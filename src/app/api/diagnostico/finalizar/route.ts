import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

const QUESTIONARIO_ID = 6;

type RespostaRecebida = {
  perguntaId: number;
  alternativaId: number;
};

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

    const avaliacaoId =
      Number(corpo.avaliacaoId);

    const questionarioId =
      Number(corpo.questionarioId);

    const respostas =
      Array.isArray(corpo.respostas)
        ? (corpo.respostas as RespostaRecebida[])
        : [];

    if (!Number.isInteger(avaliacaoId)) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Avaliação inválida.",
        },
        { status: 400 }
      );
    }

    if (questionarioId !== QUESTIONARIO_ID) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Questionário inválido.",
        },
        { status: 400 }
      );
    }

    if (respostas.length !== 5) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "O diagnóstico deve conter exactamente 5 respostas.",
        },
        { status: 400 }
      );
    }

    /*
     * Verificar se a avaliação pertence ao utilizador.
     */
    const {
      data: avaliacao,
      error: erroAvaliacao,
    } = await supabase
      .from("avaliacoes_utilizador")
      .select(
        "id, utilizador_id, questionario_id, estado"
      )
      .eq("id", avaliacaoId)
      .eq("utilizador_id", user.id)
      .eq("questionario_id", QUESTIONARIO_ID)
      .single();

    if (erroAvaliacao || !avaliacao) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Avaliação não encontrada.",
        },
        { status: 404 }
      );
    }

    if (avaliacao.estado !== "EM_PROGRESSO") {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Esta avaliação já foi concluída.",
        },
        { status: 400 }
      );
    }

    /*
     * Carregar as perguntas oficiais.
     */
    const {
      data: perguntas,
      error: erroPerguntas,
    } = await supabase
      .from("perguntas")
      .select("id")
      .eq("questionario_id", QUESTIONARIO_ID)
      .order("ordem", {
        ascending: true,
      });

    if (erroPerguntas) {
      throw new Error(
        `Erro ao carregar perguntas: ${erroPerguntas.message}`
      );
    }

    if (!perguntas || perguntas.length !== 5) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "O questionário diagnóstico deve possuir exactamente 5 perguntas.",
        },
        { status: 500 }
      );
    }

    const idsPerguntas =
      perguntas.map((item) => Number(item.id));

    const mapaRespostas = new Map<
      number,
      number
    >();

    for (const resposta of respostas) {
      const perguntaId =
        Number(resposta.perguntaId);

      const alternativaId =
        Number(resposta.alternativaId);

      if (
        !idsPerguntas.includes(perguntaId) ||
        !Number.isInteger(alternativaId)
      ) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Foi encontrada uma resposta inválida.",
          },
          { status: 400 }
        );
      }

      mapaRespostas.set(
        perguntaId,
        alternativaId
      );
    }

    if (mapaRespostas.size !== 5) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Cada pergunta deve possuir uma resposta.",
        },
        { status: 400 }
      );
    }

    /*
     * Carregar alternativas e respectivas respostas correctas.
     */
    const {
      data: alternativas,
      error: erroAlternativas,
    } = await supabase
      .from("alternativas")
      .select(
        "id, pergunta_id, texto, correta"
      )
      .in("pergunta_id", idsPerguntas);

    if (erroAlternativas) {
      throw new Error(
        `Erro ao carregar alternativas: ${erroAlternativas.message}`
      );
    }

    /*
     * Verificar se todas as alternativas escolhidas
     * pertencem realmente às perguntas.
     */
    const mapaAlternativas = new Map<
      number,
      {
        id: number;
        pergunta_id: number;
        correta: boolean;
      }
    >();

    (alternativas ?? []).forEach(
      (alternativa) => {
        mapaAlternativas.set(
          Number(alternativa.id),
          {
            id: Number(alternativa.id),
            pergunta_id: Number(
              alternativa.pergunta_id
            ),
            correta:
              alternativa.correta === true,
          }
        );
      }
    );

    let respostasCorrectas = 0;

    for (const perguntaId of idsPerguntas) {
      const alternativaId =
        mapaRespostas.get(perguntaId);

      if (!alternativaId) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Existe uma pergunta sem resposta.",
          },
          { status: 400 }
        );
      }

      const alternativa =
        mapaAlternativas.get(alternativaId);

      if (
        !alternativa ||
        alternativa.pergunta_id !== perguntaId
      ) {
        return NextResponse.json(
          {
            sucesso: false,
            erro:
              "Uma das alternativas seleccionadas é inválida.",
          },
          { status: 400 }
        );
      }

      if (alternativa.correta) {
        respostasCorrectas++;
      }
    }

    /*
     * Cada pergunta vale 20 pontos.
     */
    const totalPerguntas = 5;

    const pontuacao =
      respostasCorrectas * 20;

    const percentagem = pontuacao;

    const aprovado = pontuacao >= 70;

    /*
     * Classificação diagnóstica.
     */
    let nivel = "";
    let tituloNivel = "";
    let descricaoNivel = "";
    let recomendacao = "";
    let cursoId: number | null = null;
    let cursoTitulo: string | null = null;

    if (pontuacao <= 39) {
      nivel = "BASICO";
      tituloNivel = "Nível inicial";
      descricaoNivel =
        "Os resultados indicam que ainda existem conhecimentos fundamentais de cibersegurança que podem ser desenvolvidos.";
      recomendacao =
        "Recomendamos começar pelos fundamentos da cibersegurança, aprendendo conceitos essenciais de protecção de contas, dados, dispositivos e comportamentos seguros.";
      cursoId = 4;
      cursoTitulo =
        "Introdução à Cibersegurança";
    } else if (pontuacao <= 69) {
      nivel = "INTERMEDIO";
      tituloNivel = "Nível básico/intermédio";
      descricaoNivel =
        "Já demonstra conhecimentos importantes, mas existem algumas áreas que podem ser aprofundadas.";
      recomendacao =
        "Recomendamos aprofundar temas relacionados com phishing, engenharia social, fraudes digitais e identificação de ameaças.";
      cursoId = null;
      cursoTitulo = null;
    } else if (pontuacao <= 89) {
      nivel = "AVANCADO";
      tituloNivel = "Nível intermédio";
      descricaoNivel =
        "Apresenta uma boa compreensão dos princípios fundamentais de cibersegurança.";
      recomendacao =
        "Pode avançar para conteúdos mais práticos e aprofundar estratégias de protecção, prevenção e resposta a incidentes.";
      cursoId = null;
      cursoTitulo = null;
    } else {
      nivel = "EXPERT";
      tituloNivel = "Nível avançado";
      descricaoNivel =
        "Demonstrou um domínio muito sólido dos conhecimentos avaliados neste diagnóstico.";
      recomendacao =
        "Está preparado para explorar conteúdos mais avançados, testes e simulações disponíveis na plataforma.";
      cursoId = null;
      cursoTitulo = null;
    }

    /*
     * Guardar as respostas.
     */
    const respostasParaGuardar =
      idsPerguntas.map((perguntaId) => ({
        utilizador_id: user.id,
        pergunta_id: perguntaId,
        alternativa_id:
          mapaRespostas.get(perguntaId)!,
        avaliacao_id: avaliacaoId,
      }));

    /*
     * Remover respostas anteriores desta avaliação,
     * caso exista uma tentativa parcialmente guardada.
     */
    const {
      error: erroEliminarRespostas,
    } = await supabase
      .from("respostas_utilizador")
      .delete()
      .eq("avaliacao_id", avaliacaoId)
      .eq("utilizador_id", user.id);

    if (erroEliminarRespostas) {
      throw new Error(
        `Erro ao preparar respostas: ${erroEliminarRespostas.message}`
      );
    }

    const {
      error: erroGuardarRespostas,
    } = await supabase
      .from("respostas_utilizador")
      .insert(respostasParaGuardar);

    if (erroGuardarRespostas) {
      throw new Error(
        `Erro ao guardar respostas: ${erroGuardarRespostas.message}`
      );
    }

    /*
     * Finalizar avaliação.
     */
    const {
      data: avaliacaoActualizada,
      error: erroActualizar,
    } = await supabase
      .from("avaliacoes_utilizador")
      .update({
        pontuacao,
        total_perguntas: totalPerguntas,
        respostas_correctas: respostasCorrectas,
        estado: "CONCLUIDA",
        aprovado,
        concluido_em:
          new Date().toISOString(),
        actualizado_em:
          new Date().toISOString(),
      })
      .eq("id", avaliacaoId)
      .eq("utilizador_id", user.id)
      .select("id")
      .single();

    if (
      erroActualizar ||
      !avaliacaoActualizada
    ) {
      throw new Error(
        erroActualizar?.message ||
          "Não foi possível concluir a avaliação."
      );
    }

    return NextResponse.json({
      sucesso: true,
      resultado: {
        pontuacao,
        totalPerguntas,
        respostasCorrectas,
        percentagem,
        nivel,
        tituloNivel,
        descricaoNivel,
        recomendacao,
        cursoId,
        cursoTitulo,
      },
    });
  } catch (erro) {
    console.error(
      "Erro ao finalizar diagnóstico:",
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
