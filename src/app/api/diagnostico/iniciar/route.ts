import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

const QUESTIONARIO_ID = 6;

export async function POST(request: NextRequest) {
  try {
    const supabase =
      await criarClienteSupabaseServidor();

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Utilizador não autenticado.",
        },
        { status: 401 }
      );
    }

    const corpo = await request.json();

    const questionarioId =
      Number(corpo.questionarioId);

    if (questionarioId !== QUESTIONARIO_ID) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Questionário diagnóstico inválido.",
        },
        { status: 400 }
      );
    }

    const {
      data: questionario,
      error: erroQuestionario,
    } = await supabase
      .from("questionarios")
      .select("id")
      .eq("id", QUESTIONARIO_ID)
      .maybeSingle();

    if (erroQuestionario) {
      console.error(
        "Erro ao verificar questionário:",
        erroQuestionario
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro: "Não foi possível verificar o questionário.",
        },
        { status: 500 }
      );
    }

    if (!questionario) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Questionário diagnóstico não encontrado.",
        },
        { status: 404 }
      );
    }

    /*
     * Se existir uma avaliação anterior em progresso,
     * reutilizamos essa tentativa.
     */
    const {
      data: avaliacaoEmProgresso,
      error: erroAvaliacaoExistente,
    } = await supabase
      .from("avaliacoes_utilizador")
      .select("id")
      .eq("utilizador_id", user.id)
      .eq("questionario_id", QUESTIONARIO_ID)
      .eq("estado", "EM_PROGRESSO")
      .order("criado_em", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (erroAvaliacaoExistente) {
      console.error(
        "Erro ao verificar avaliação existente:",
        erroAvaliacaoExistente
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro: "Não foi possível verificar a avaliação actual.",
        },
        { status: 500 }
      );
    }

    if (avaliacaoEmProgresso) {
      return NextResponse.json({
        sucesso: true,
        avaliacaoId: avaliacaoEmProgresso.id,
        existente: true,
      });
    }

    /*
     * Criar nova avaliação.
     */
    const {
      data: novaAvaliacao,
      error: erroCriarAvaliacao,
    } = await supabase
      .from("avaliacoes_utilizador")
      .insert({
        utilizador_id: user.id,
        questionario_id: QUESTIONARIO_ID,
        pontuacao: 0,
        total_perguntas: 5,
        respostas_correctas: 0,
        estado: "EM_PROGRESSO",
        aprovado: false,
        tentativa: 1,
        iniciado_em: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (erroCriarAvaliacao || !novaAvaliacao) {
      console.error(
        "Erro ao criar avaliação:",
        erroCriarAvaliacao
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro:
            erroCriarAvaliacao?.message ||
            "Não foi possível iniciar a avaliação.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      avaliacaoId: novaAvaliacao.id,
      existente: false,
    });
  } catch (erro) {
    console.error(
      "Erro ao iniciar diagnóstico:",
      erro
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          erro instanceof Error
            ? erro.message
            : "Erro interno do servidor.",
      },
      { status: 500 }
    );
  }
}
