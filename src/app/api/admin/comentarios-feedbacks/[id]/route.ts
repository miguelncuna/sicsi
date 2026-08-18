import {
  NextRequest,
  NextResponse,
} from "next/server";

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

type Contexto = {
  params: Promise<{
    id: string;
  }>;
};

/*
 * ============================================================
 * EDITAR FEEDBACK
 * ============================================================
 */

export async function PATCH(
  request: NextRequest,
  contexto: Contexto
) {
  try {
    const { id } =
      await contexto.params;

    const idNumerico = Number(id);

    if (
      !Number.isInteger(idNumerico) ||
      idNumerico <= 0
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "ID do feedback inválido.",
        },
        { status: 400 }
      );
    }

    const corpo =
      await request.json();

    const classificacao = Number(
      corpo.classificacao
    );

    const comentario =
      typeof corpo.comentario ===
      "string"
        ? corpo.comentario.trim()
        : "";

    if (
      !Number.isInteger(
        classificacao
      ) ||
      classificacao < 1 ||
      classificacao > 5
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A classificação deve estar entre 1 e 5.",
        },
        { status: 400 }
      );
    }

    if (!comentario) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "O comentário não pode estar vazio.",
        },
        { status: 400 }
      );
    }

    if (comentario.length > 2000) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "O comentário não pode ultrapassar 2000 caracteres.",
        },
        { status: 400 }
      );
    }

    const supabase =
      obterSupabaseAdmin();

    const {
      data,
      error,
    } = await supabase
      .from("feedbacks")
      .update({
        classificacao,
        comentario,
      })
      .eq("id", idNumerico)
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
      .maybeSingle();

    if (error) {
      console.error(
        "Erro ao actualizar feedback:",
        error
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro: error.message,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Feedback não encontrado.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        feedback: data,
        mensagem:
          "Feedback actualizado com sucesso.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erro ao actualizar feedback:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          error instanceof Error
            ? error.message
            : "Erro interno do servidor.",
      },
      { status: 500 }
    );
  }
}

/*
 * ============================================================
 * ELIMINAR FEEDBACK
 * ============================================================
 */

export async function DELETE(
  request: NextRequest,
  contexto: Contexto
) {
  try {
    const { id } =
      await contexto.params;

    const idNumerico = Number(id);

    if (
      !Number.isInteger(idNumerico) ||
      idNumerico <= 0
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "ID do feedback inválido.",
        },
        { status: 400 }
      );
    }

    const supabase =
      obterSupabaseAdmin();

    const {
      data: existente,
      error: erroPesquisa,
    } = await supabase
      .from("feedbacks")
      .select("id")
      .eq("id", idNumerico)
      .maybeSingle();

    if (erroPesquisa) {
      console.error(
        "Erro ao procurar feedback:",
        erroPesquisa
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro: erroPesquisa.message,
        },
        { status: 500 }
      );
    }

    if (!existente) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Feedback não encontrado.",
        },
        { status: 404 }
      );
    }

    const {
      error,
    } = await supabase
      .from("feedbacks")
      .delete()
      .eq("id", idNumerico);

    if (error) {
      console.error(
        "Erro ao eliminar feedback:",
        error
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        mensagem:
          "Feedback eliminado com sucesso.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erro ao eliminar feedback:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          error instanceof Error
            ? error.message
            : "Erro interno do servidor.",
      },
      { status: 500 }
    );
  }
}