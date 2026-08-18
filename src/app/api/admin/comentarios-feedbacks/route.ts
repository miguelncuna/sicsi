import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function obterSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Configuração do Supabase incompleta."
    );
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function GET() {
  try {
    const supabase =
      obterSupabaseAdmin();

    const {
      data: feedbacks,
      error,
    } = await supabase
      .from("feedbacks")
      .select(
        `
          id,
          utilizador_id,
          tipo,
          curso_id,
          conteudo_id,
          classificacao,
          comentario,
          criado_em
        `
      )
      .order("criado_em", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Erro ao obter feedbacks:",
        error
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro: error.message,
          feedbacks: [],
        },
        { status: 500 }
      );
    }

    const lista = feedbacks ?? [];

    /*
     * ==========================================================
     * UTILIZADORES
     *
     * A tabela feedbacks não possui FK declarada para perfis.
     * Por isso fazemos a associação manualmente.
     * ==========================================================
     */

    const idsUtilizadores = [
      ...new Set(
        lista
          .map(
            (feedback) =>
              feedback.utilizador_id
          )
          .filter(Boolean)
      ),
    ];

    const utilizadores =
      idsUtilizadores.length > 0
        ? (
            await supabase
              .from("perfis")
              .select(
                "id, nome_completo, email, foto_url"
              )
              .in(
                "id",
                idsUtilizadores
              )
          ).data ?? []
        : [];

    const mapaUtilizadores =
      new Map(
        utilizadores.map(
          (utilizador) => [
            utilizador.id,
            utilizador,
          ]
        )
      );

    /*
     * ==========================================================
     * CURSOS
     * ==========================================================
     */

    const idsCursos = [
      ...new Set(
        lista
          .map(
            (feedback) =>
              feedback.curso_id
          )
          .filter(
            (
              id
            ): id is number =>
              id !== null
          )
      ),
    ];

    const cursos =
      idsCursos.length > 0
        ? (
            await supabase
              .from("cursos")
              .select(
                "id, titulo"
              )
              .in(
                "id",
                idsCursos
              )
          ).data ?? []
        : [];

    const mapaCursos =
      new Map(
        cursos.map((curso) => [
          curso.id,
          curso,
        ])
      );

    /*
     * ==========================================================
     * CONTEÚDOS
     * ==========================================================
     */

    const idsConteudos = [
      ...new Set(
        lista
          .map(
            (feedback) =>
              feedback.conteudo_id
          )
          .filter(
            (
              id
            ): id is number =>
              id !== null
          )
      ),
    ];

    const conteudos =
      idsConteudos.length > 0
        ? (
            await supabase
              .from("conteudos")
              .select(
                "id, titulo"
              )
              .in(
                "id",
                idsConteudos
              )
          ).data ?? []
        : [];

    const mapaConteudos =
      new Map(
        conteudos.map(
          (conteudo) => [
            conteudo.id,
            conteudo,
          ]
        )
      );

    /*
     * ==========================================================
     * COMBINAR
     * ==========================================================
     */

    const resultado =
      lista.map((feedback) => ({
        ...feedback,

        utilizador:
          mapaUtilizadores.get(
            feedback.utilizador_id
          ) ?? null,

        curso:
          feedback.curso_id !== null
            ? mapaCursos.get(
                feedback.curso_id
              ) ?? null
            : null,

        conteudo:
          feedback.conteudo_id !== null
            ? mapaConteudos.get(
                feedback.conteudo_id
              ) ?? null
            : null,
      }));

    return NextResponse.json(
      {
        sucesso: true,
        feedbacks: resultado,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erro na API de comentários e feedbacks:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          error instanceof Error
            ? error.message
            : "Erro interno do servidor.",
        feedbacks: [],
      },
      { status: 500 }
    );
  }
}