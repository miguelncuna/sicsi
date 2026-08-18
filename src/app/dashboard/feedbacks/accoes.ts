"use server";

import { revalidatePath } from "next/cache";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

type TipoFeedback = "curso" | "conteudo" | "geral";

type ResultadoFeedback = {
  sucesso: boolean;
  mensagem: string;
};

export async function criarFeedback(
  tipo: TipoFeedback,
  classificacao: number,
  comentario: string,
  cursoId?: number | null,
  conteudoId?: number | null
): Promise<ResultadoFeedback> {
  /*
   * ============================================================
   * 1. VALIDAÇÃO BÁSICA
   * ============================================================
   */

  if (!["curso", "conteudo", "geral"].includes(tipo)) {
    return {
      sucesso: false,
      mensagem: "O tipo de feedback é inválido.",
    };
  }

  if (
    !Number.isInteger(classificacao) ||
    classificacao < 1 ||
    classificacao > 5
  ) {
    return {
      sucesso: false,
      mensagem: "A classificação deve estar entre 1 e 5.",
    };
  }

  const comentarioLimpo = comentario.trim();

  if (!comentarioLimpo) {
    return {
      sucesso: false,
      mensagem: "Escreva um comentário antes de enviar.",
    };
  }

  if (comentarioLimpo.length > 2000) {
    return {
      sucesso: false,
      mensagem:
        "O comentário não pode ultrapassar 2000 caracteres.",
    };
  }

  /*
   * ============================================================
   * 2. VALIDAR O ALVO DO FEEDBACK
   * ============================================================
   */

  if (tipo === "curso") {
    if (
      !Number.isInteger(cursoId) ||
      cursoId === null ||
      cursoId === undefined
    ) {
      return {
        sucesso: false,
        mensagem:
          "É necessário indicar o curso para este feedback.",
      };
    }

    if (
      conteudoId !== null &&
      conteudoId !== undefined
    ) {
      return {
        sucesso: false,
        mensagem:
          "Um feedback de curso não pode estar associado a um conteúdo.",
      };
    }
  }

  if (tipo === "conteudo") {
    if (
      !Number.isInteger(conteudoId) ||
      conteudoId === null ||
      conteudoId === undefined
    ) {
      return {
        sucesso: false,
        mensagem:
          "É necessário indicar o conteúdo para este feedback.",
      };
    }

    if (
      cursoId !== null &&
      cursoId !== undefined
    ) {
      return {
        sucesso: false,
        mensagem:
          "Um feedback de conteúdo não pode estar associado directamente a um curso.",
      };
    }
  }

  if (tipo === "geral") {
    if (
      cursoId !== null &&
      cursoId !== undefined
    ) {
      return {
        sucesso: false,
        mensagem:
          "Um feedback geral não deve estar associado a um curso.",
      };
    }

    if (
      conteudoId !== null &&
      conteudoId !== undefined
    ) {
      return {
        sucesso: false,
        mensagem:
          "Um feedback geral não deve estar associado a um conteúdo.",
      };
    }
  }

  /*
   * ============================================================
   * 3. CLIENTE SUPABASE
   * ============================================================
   */

  const supabase =
    await criarClienteSupabaseServidor();

  /*
   * ============================================================
   * 4. UTILIZADOR AUTENTICADO
   * ============================================================
   */

  const {
    data: { user },
    error: erroUtilizador,
  } = await supabase.auth.getUser();

  if (erroUtilizador || !user) {
    return {
      sucesso: false,
      mensagem:
        "A sessão do utilizador expirou. Entre novamente.",
    };
  }

  /*
   * ============================================================
   * 5. VERIFICAR PERFIL DO UTILIZADOR
   * ============================================================
   */

  const {
    data: perfil,
    error: erroPerfil,
  } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (erroPerfil || !perfil) {
    console.error(
      "Erro ao consultar perfil:",
      erroPerfil?.message
    );

    return {
      sucesso: false,
      mensagem:
        "Não foi possível verificar o perfil do utilizador.",
    };
  }

  /*
   * ============================================================
   * 6. VALIDAR CURSO
   * ============================================================
   */

  if (
    tipo === "curso" &&
    cursoId !== null &&
    cursoId !== undefined
  ) {
    const {
      data: curso,
      error: erroCurso,
    } = await supabase
      .from("cursos")
      .select("id")
      .eq("id", cursoId)
      .maybeSingle();

    if (erroCurso) {
      console.error(
        "Erro ao verificar curso:",
        erroCurso.message
      );

      return {
        sucesso: false,
        mensagem:
          "Não foi possível verificar o curso.",
      };
    }

    if (!curso) {
      return {
        sucesso: false,
        mensagem: "O curso indicado não existe.",
      };
    }
  }

  /*
   * ============================================================
   * 7. VALIDAR CONTEÚDO
   * ============================================================
   */

  if (
    tipo === "conteudo" &&
    conteudoId !== null &&
    conteudoId !== undefined
  ) {
    const {
      data: conteudo,
      error: erroConteudo,
    } = await supabase
      .from("conteudos")
      .select("id")
      .eq("id", conteudoId)
      .maybeSingle();

    if (erroConteudo) {
      console.error(
        "Erro ao verificar conteúdo:",
        erroConteudo.message
      );

      return {
        sucesso: false,
        mensagem:
          "Não foi possível verificar o conteúdo.",
      };
    }

    if (!conteudo) {
      return {
        sucesso: false,
        mensagem:
          "O conteúdo indicado não existe.",
      };
    }
  }

  /*
   * ============================================================
   * 8. INSERIR FEEDBACK
   * ============================================================
   */

  const {
    error: erroInsercao,
  } = await supabase
    .from("feedbacks")
    .insert({
      utilizador_id: user.id,
      tipo,
      curso_id:
        tipo === "curso"
          ? cursoId
          : null,
      conteudo_id:
        tipo === "conteudo"
          ? conteudoId
          : null,
      classificacao,
      comentario: comentarioLimpo,
    });

  if (erroInsercao) {
    console.error(
      "Erro ao inserir feedback:",
      erroInsercao.message
    );

    return {
      sucesso: false,
      mensagem:
        "Não foi possível enviar o feedback.",
    };
  }

  /*
   * ============================================================
   * 9. INVALIDAR CACHE
   * ============================================================
   */

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cursos");

  if (
    tipo === "curso" &&
    cursoId !== null &&
    cursoId !== undefined
  ) {
    revalidatePath(
      `/dashboard/cursos/${cursoId}`
    );
  }

  if (
    tipo === "conteudo" &&
    conteudoId !== null &&
    conteudoId !== undefined
  ) {
    revalidatePath(
      `/dashboard/cursos`
    );
  }

  /*
   * ============================================================
   * 10. RESPOSTA FINAL
   * ============================================================
   */

  return {
    sucesso: true,
    mensagem:
      "Feedback enviado com sucesso. Obrigado pela sua contribuição!",
  };
}