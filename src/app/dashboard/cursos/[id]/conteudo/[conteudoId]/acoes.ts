"use server";

import { revalidatePath } from "next/cache";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

type ResultadoProgresso = {
  sucesso: boolean;
  concluido: boolean;
  mensagem: string;
};

export async function marcarConteudoComoConcluido(
  conteudoId: number,
  cursoId: number
): Promise<ResultadoProgresso> {
  /*
   * ============================================================
   * 1. VALIDAR DADOS RECEBIDOS
   * ============================================================
   */

  if (
    !Number.isInteger(conteudoId) ||
    !Number.isInteger(cursoId) ||
    conteudoId <= 0 ||
    cursoId <= 0
  ) {
    return {
      sucesso: false,
      concluido: false,
      mensagem: "Os dados do conteúdo são inválidos.",
    };
  }

  /*
   * ============================================================
   * 2. CLIENTE SUPABASE
   * ============================================================
   */

  const supabase = await criarClienteSupabaseServidor();

  /*
   * ============================================================
   * 3. UTILIZADOR AUTENTICADO
   * ============================================================
   */

  const {
    data: { user },
    error: erroUtilizador,
  } = await supabase.auth.getUser();

  if (erroUtilizador || !user) {
    return {
      sucesso: false,
      concluido: false,
      mensagem: "A sessão do utilizador expirou. Entre novamente.",
    };
  }

  /*
   * ============================================================
   * 4. CONFIRMAR PERFIL DO UTILIZADOR
   * ============================================================
   */

  const { data: perfil, error: erroPerfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (
    erroPerfil ||
    !perfil ||
    perfil.papel !== "ESTUDANTE"
  ) {
    return {
      sucesso: false,
      concluido: false,
      mensagem:
        "O utilizador não tem permissão para registar este progresso.",
    };
  }

  /*
   * ============================================================
   * 5. CONFIRMAR QUE O CONTEÚDO PERTENCE AO CURSO
   * ============================================================
   */

  const {
    data: conteudo,
    error: erroConteudo,
  } = await supabase
    .from("conteudos")
    .select(`
      id,
      modulos!inner (
        id,
        curso_id
      )
    `)
    .eq("id", conteudoId)
    .eq("modulos.curso_id", cursoId)
    .single();

  if (erroConteudo || !conteudo) {
    return {
      sucesso: false,
      concluido: false,
      mensagem:
        "O conteúdo não pertence ao curso solicitado.",
    };
  }

  /*
   * ============================================================
   * 6. PROCURAR PROGRESSO EXISTENTE
   * ============================================================
   */

  const {
    data: progressoExistente,
    error: erroProgresso,
  } = await supabase
    .from("progresso_utilizador")
    .select("id, concluido, concluido_em")
    .eq("utilizador_id", user.id)
    .eq("conteudo_id", conteudoId)
    .maybeSingle();

  if (erroProgresso) {
    console.error(
      "SICSI — erro ao consultar progresso:",
      erroProgresso
    );

    return {
      sucesso: false,
      concluido: false,
      mensagem:
        "Não foi possível consultar o progresso.",
    };
  }

  /*
   * ============================================================
   * 7. EVITAR OPERAÇÕES DESNECESSÁRIAS
   * ============================================================
   */

  if (progressoExistente?.concluido === true) {
    revalidatePath(`/dashboard/cursos/${cursoId}`);
    revalidatePath(
      `/dashboard/cursos/${cursoId}/conteudo/${conteudoId}`
    );
    revalidatePath("/dashboard");

    return {
      sucesso: true,
      concluido: true,
      mensagem: "Este conteúdo já foi concluído.",
    };
  }

  /*
   * ============================================================
   * 8. ACTUALIZAR PROGRESSO EXISTENTE
   * ============================================================
   */

  if (progressoExistente) {
    const {
      error: erroAtualizacao,
    } = await supabase
      .from("progresso_utilizador")
      .update({
        concluido: true,
        concluido_em: new Date().toISOString(),
      })
      .eq("id", progressoExistente.id)
      .eq("utilizador_id", user.id);

    if (erroAtualizacao) {
      console.error(
        "SICSI — erro ao actualizar progresso:",
        erroAtualizacao
      );

      return {
        sucesso: false,
        concluido: false,
        mensagem:
          "Não foi possível actualizar o progresso.",
      };
    }
  }

  /*
   * ============================================================
   * 9. CRIAR NOVO REGISTO DE PROGRESSO
   * ============================================================
   */

  else {
    const {
      error: erroInsercao,
    } = await supabase
      .from("progresso_utilizador")
      .insert({
        utilizador_id: user.id,
        conteudo_id: conteudoId,
        concluido: true,
        concluido_em: new Date().toISOString(),
      });

    if (erroInsercao) {
      console.error(
        "SICSI — erro ao criar progresso:",
        erroInsercao
      );

      return {
        sucesso: false,
        concluido: false,
        mensagem:
          "Não foi possível registar a conclusão.",
      };
    }
  }

  /*
   * ============================================================
   * 10. INVALIDAR CACHE / ACTUALIZAR INTERFACE
   * ============================================================
   */

  revalidatePath(`/dashboard/cursos/${cursoId}`);

  revalidatePath(
    `/dashboard/cursos/${cursoId}/conteudo/${conteudoId}`
  );

  revalidatePath("/dashboard");

  /*
   * ============================================================
   * 11. RESULTADO FINAL
   * ============================================================
   */

  return {
    sucesso: true,
    concluido: true,
    mensagem:
      "Conteúdo concluído com sucesso.",
  };
}