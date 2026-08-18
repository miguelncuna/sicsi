import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function obterSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Configuração do Supabase incompleta.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET() {
  try {
    const supabase = obterSupabaseAdmin();

    /*
     * =========================================================
     * CERTIFICADOS
     * =========================================================
     */

    const { data: certificados, error: erroCertificados } =
      await supabase
        .from("certificados")
        .select(`
          id,
          utilizador_id,
          curso_id,
          data_emissao
        `)
        .order("data_emissao", {
          ascending: false,
        });

    if (erroCertificados) {
      console.error(
        "Erro ao carregar certificados:",
        erroCertificados
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro: erroCertificados.message,
          certificados: [],
        },
        { status: 500 }
      );
    }

    const listaCertificados = certificados ?? [];

    /*
     * =========================================================
     * IDS DOS UTILIZADORES
     * =========================================================
     */

    const idsUtilizadores = Array.from(
      new Set(
        listaCertificados
          .map((certificado) => certificado.utilizador_id)
          .filter(Boolean)
      )
    );

    /*
     * =========================================================
     * IDS DOS CURSOS
     * =========================================================
     */

    const idsCursos = Array.from(
      new Set(
        listaCertificados
          .map((certificado) => Number(certificado.curso_id))
          .filter((id) => Number.isInteger(id))
      )
    );

    /*
     * =========================================================
     * PERFIS
     * =========================================================
     */

    let perfis: Array<{
      id: string;
      nome_completo: string | null;
      email: string | null;
      foto_url: string | null;
    }> = [];

    if (idsUtilizadores.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from("perfis")
        .select(`
          id,
          nome_completo,
          email,
          foto_url
        `)
        .in("id", idsUtilizadores);

      if (error) {
        console.error(
          "Erro ao carregar perfis dos certificados:",
          error
        );

        return NextResponse.json(
          {
            sucesso: false,
            erro: error.message,
            certificados: [],
          },
          { status: 500 }
        );
      }

      perfis = data ?? [];
    }

    /*
     * =========================================================
     * CURSOS
     * =========================================================
     */

    let cursos: Array<{
      id: number;
      titulo: string | null;
    }> = [];

    if (idsCursos.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from("cursos")
        .select(`
          id,
          titulo
        `)
        .in("id", idsCursos);

      if (error) {
        console.error(
          "Erro ao carregar cursos dos certificados:",
          error
        );

        return NextResponse.json(
          {
            sucesso: false,
            erro: error.message,
            certificados: [],
          },
          { status: 500 }
        );
      }

      cursos = data ?? [];
    }

    /*
     * =========================================================
     * MAPAS
     * =========================================================
     */

    const mapaPerfis = new Map(
      perfis.map((perfil) => [
        perfil.id,
        perfil,
      ])
    );

    const mapaCursos = new Map(
      cursos.map((curso) => [
        Number(curso.id),
        curso,
      ])
    );

    /*
     * =========================================================
     * RESULTADO FINAL
     * =========================================================
     */

    const certificadosFormatados =
      listaCertificados.map((certificado) => {
        const perfil = mapaPerfis.get(
          certificado.utilizador_id
        );

        const curso = mapaCursos.get(
          Number(certificado.curso_id)
        );

        return {
          id: certificado.id,
          utilizador_id:
            certificado.utilizador_id,
          curso_id: certificado.curso_id,
          data_emissao:
            certificado.data_emissao,

          numero: `SICSI-${String(
            certificado.id
          ).padStart(6, "0")}`,

          utilizador: {
            id: perfil?.id ?? certificado.utilizador_id,
            nome_completo:
              perfil?.nome_completo ??
              "Utilizador desconhecido",
            email:
              perfil?.email ??
              "",
            foto_url:
              perfil?.foto_url ??
              null,
          },

          curso: {
            id: curso?.id ?? certificado.curso_id,
            titulo:
              curso?.titulo ??
              `Curso #${certificado.curso_id}`,
          },

          estado: "EMITIDO",
        };
      });

    return NextResponse.json(
      {
        sucesso: true,
        certificados: certificadosFormatados,
        total: certificadosFormatados.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erro na API administrativa de certificados:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          error instanceof Error
            ? error.message
            : "Erro interno do servidor.",
        certificados: [],
      },
      { status: 500 }
    );
  }
}