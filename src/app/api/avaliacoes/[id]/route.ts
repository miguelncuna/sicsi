import { NextResponse } from "next/server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

/* ============================================================
 * TIPOS
 * ============================================================
 */

type ContextoRota = {
  params: Promise<{
    id: string;
  }>;
};

type CorpoGuardarResposta = {
  action: "guardar_resposta";
  avaliacao_id: number;
  pergunta_id: number;
  alternativa_id: number;
};

type CorpoSubmeter = {
  action: "submeter";
  avaliacao_id: number;
};

type CorpoRequisicao =
  | CorpoGuardarResposta
  | CorpoSubmeter;

/* ============================================================
 * RESPOSTA DE ERRO
 * ============================================================
 */

function respostaErro(
  mensagem: string,
  status = 400
) {
  return NextResponse.json(
    {
      erro: mensagem,
    },
    {
      status,
    }
  );
}

/* ============================================================
 * GET
 *
 * Responsável por:
 *
 * 1. Identificar o utilizador
 * 2. Carregar questionário
 * 3. Carregar perguntas
 * 4. Carregar alternativas
 * 5. Criar/reutilizar tentativa
 * 6. Carregar respostas da tentativa
 *
 * IMPORTANTE:
 *
 * A coluna "correta" NUNCA é devolvida ao frontend.
 * ============================================================
 */

export async function GET(
  request: Request,
  { params }: ContextoRota
) {
  try {
    const supabase =
      await criarClienteSupabaseServidor();

    /* --------------------------------------------------------
     * UTILIZADOR AUTENTICADO
     * --------------------------------------------------------
     */

    const {
      data: { user },
      error: erroUtilizador,
    } =
      await supabase.auth.getUser();

    if (
      erroUtilizador ||
      !user
    ) {
      return respostaErro(
        "Sessão do utilizador não encontrada.",
        401
      );
    }

    /* --------------------------------------------------------
     * ID DO QUESTIONÁRIO
     * --------------------------------------------------------
     */

    const { id } = await params;

    const questionarioId =
      Number(id);

    if (
      !Number.isInteger(
        questionarioId
      ) ||
      questionarioId <= 0
    ) {
      return respostaErro(
        "O identificador da avaliação é inválido.",
        400
      );
    }

    const url =
      new URL(request.url);

    const modo =
      url.searchParams.get(
        "modo"
      );

    /* --------------------------------------------------------
     * QUESTIONÁRIO
     * --------------------------------------------------------
     */

    const {
      data: questionario,
      error: erroQuestionario,
    } = await supabase
      .from("questionarios")
      .select(
        `
          id,
          modulo_id,
          titulo,
          descricao,
          pontuacao_minima
        `
      )
      .eq(
        "id",
        questionarioId
      )
      .single();

    if (
      erroQuestionario ||
      !questionario
    ) {
      console.error(
        "Erro ao carregar questionário:",
        erroQuestionario
      );

      return respostaErro(
        "Não foi possível carregar esta avaliação.",
        404
      );
    }

    /* --------------------------------------------------------
     * PERGUNTAS + ALTERNATIVAS
     *
     * ATENÇÃO:
     *
     * "correta" NÃO é seleccionada.
     * ========================================================
     */

    const {
      data: perguntas,
      error: erroPerguntas,
    } = await supabase
      .from("perguntas")
      .select(
        `
          id,
          questionario_id,
          enunciado,
          ordem,
          alternativas (
            id,
            pergunta_id,
            texto
          )
        `
      )
      .eq(
        "questionario_id",
        questionarioId
      )
      .order(
        "ordem",
        {
          ascending: true,
        }
      );

    if (erroPerguntas) {
      console.error(
        "Erro ao carregar perguntas:",
        erroPerguntas
      );

      return respostaErro(
        "Não foi possível carregar as perguntas desta avaliação.",
        500
      );
    }

    /* --------------------------------------------------------
     * PROCURAR AVALIAÇÃO EM ANDAMENTO
     * --------------------------------------------------------
     */

    const {
      data: avaliacaoEmAndamento,
      error: erroEmAndamento,
    } = await supabase
      .from(
        "avaliacoes_utilizador"
      )
      .select(
        `
          id,
          tentativa,
          estado,
          aprovado,
          pontuacao,
          total_perguntas,
          respostas_correctas,
          iniciado_em,
          concluido_em
        `
      )
      .eq(
        "utilizador_id",
        user.id
      )
      .eq(
        "questionario_id",
        questionarioId
      )
      .eq(
        "estado",
        "EM_PROGRESSO"
      )
      .order(
        "tentativa",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (erroEmAndamento) {
      console.error(
        "Erro ao verificar avaliação em andamento:",
        erroEmAndamento
      );

      return respostaErro(
        "Não foi possível verificar o estado da avaliação.",
        500
      );
    }

    let avaliacao =
      avaliacaoEmAndamento;

    /* --------------------------------------------------------
     * MODO RESULTADO
     * --------------------------------------------------------
     */

    if (
      !avaliacao &&
      modo === "resultado"
    ) {
      const {
        data: ultimaAvaliacao,
        error: erroUltimaAvaliacao,
      } = await supabase
        .from(
          "avaliacoes_utilizador"
        )
        .select(
          `
            id,
            tentativa,
            estado,
            aprovado,
            pontuacao,
            total_perguntas,
            respostas_correctas,
            iniciado_em,
            concluido_em
          `
        )
        .eq(
          "utilizador_id",
          user.id
        )
        .eq(
          "questionario_id",
          questionarioId
        )
        .neq(
          "estado",
          "EM_PROGRESSO"
        )
        .order(
          "tentativa",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

      if (
        erroUltimaAvaliacao
      ) {
        console.error(
          "Erro ao carregar resultado:",
          erroUltimaAvaliacao
        );

        return respostaErro(
          "Não foi possível carregar o resultado da avaliação.",
          500
        );
      }

      if (
        !ultimaAvaliacao
      ) {
        return respostaErro(
          "Ainda não existe uma avaliação concluída para apresentar.",
          404
        );
      }

      avaliacao =
        ultimaAvaliacao;
    }

    /* --------------------------------------------------------
     * CRIAR NOVA TENTATIVA
     * --------------------------------------------------------
     */

    if (
      !avaliacao &&
      modo !== "resultado"
    ) {
      const {
        data: ultimaAvaliacao,
        error: erroUltimaAvaliacao,
      } = await supabase
        .from(
          "avaliacoes_utilizador"
        )
        .select(
          "tentativa"
        )
        .eq(
          "utilizador_id",
          user.id
        )
        .eq(
          "questionario_id",
          questionarioId
        )
        .order(
          "tentativa",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

      if (
        erroUltimaAvaliacao
      ) {
        console.error(
          "Erro ao determinar a tentativa:",
          erroUltimaAvaliacao
        );

        return respostaErro(
          "Não foi possível determinar a próxima tentativa.",
          500
        );
      }

      const proximaTentativa =
        Number(
          ultimaAvaliacao?.tentativa ??
            0
        ) + 1;

      const {
        data: novaAvaliacao,
        error: erroNovaAvaliacao,
      } = await supabase
        .from(
          "avaliacoes_utilizador"
        )
        .insert({
          utilizador_id:
            user.id,

          questionario_id:
            questionarioId,

          pontuacao: 0,

          total_perguntas:
            (
              perguntas ?? []
            ).length,

          respostas_correctas: 0,

          estado:
            "EM_PROGRESSO",

          aprovado: false,

          iniciado_em:
            new Date().toISOString(),

          concluido_em:
            null,

          tentativa:
            proximaTentativa,
        })
        .select(
          `
            id,
            tentativa,
            estado,
            aprovado,
            pontuacao,
            total_perguntas,
            respostas_correctas,
            iniciado_em,
            concluido_em
          `
        )
        .single();

      if (
        erroNovaAvaliacao ||
        !novaAvaliacao
      ) {
        console.error(
          "Erro ao criar avaliação:",
          erroNovaAvaliacao
        );

        return respostaErro(
          "Não foi possível iniciar a avaliação.",
          500
        );
      }

      avaliacao =
        novaAvaliacao;
    }

    /* --------------------------------------------------------
     * GARANTIR QUE EXISTE UMA AVALIAÇÃO
     * --------------------------------------------------------
     *
     * O TypeScript considera "avaliacao" potencialmente nula porque
     * ela pode vir de maybeSingle(). Depois das ramificações acima,
     * garantimos explicitamente que existe antes de usar avaliacao.id.
     */

    if (!avaliacao) {
      return respostaErro(
        "Não foi possível obter a tentativa da avaliação.",
        500
      );
    }

    /* --------------------------------------------------------
     * RESPOSTAS DA TENTATIVA
     * --------------------------------------------------------
     */

    const {
      data: respostas,
      error: erroRespostas,
    } = await supabase
      .from(
        "respostas_utilizador"
      )
      .select(
        `
          pergunta_id,
          alternativa_id
        `
      )
      .eq(
        "utilizador_id",
        user.id
      )
      .eq(
        "avaliacao_id",
        avaliacao.id
      );

    if (
      erroRespostas
    ) {
      console.error(
        "Erro ao carregar respostas:",
        erroRespostas
      );

      return respostaErro(
        "Não foi possível carregar o progresso da avaliação.",
        500
      );
    }

    /* --------------------------------------------------------
     * RESPOSTA FINAL
     * --------------------------------------------------------
     */

    return NextResponse.json({
      questionario,

      perguntas:
        perguntas ?? [],

      avaliacao,

      respostas:
        respostas ?? [],
    });
  } catch (erro) {
    console.error(
      "Erro inesperado na API da avaliação:",
      erro
    );

    return respostaErro(
      "Ocorreu um erro inesperado.",
      500
    );
  }
}

/* ============================================================
 * POST
 *
 * Acções suportadas:
 *
 * 1. guardar_resposta
 * 2. submeter
 * ============================================================
 */

export async function POST(
  request: Request,
  { params }: ContextoRota
) {
  try {
    const supabase =
      await criarClienteSupabaseServidor();

    /* --------------------------------------------------------
     * UTILIZADOR
     * --------------------------------------------------------
     */

    const {
      data: { user },
      error: erroUtilizador,
    } =
      await supabase.auth.getUser();

    if (
      erroUtilizador ||
      !user
    ) {
      return respostaErro(
        "Sessão do utilizador não encontrada.",
        401
      );
    }

    /* --------------------------------------------------------
     * ID DO QUESTIONÁRIO
     * --------------------------------------------------------
     */

    const { id } = await params;

    const questionarioId =
      Number(id);

    if (
      !Number.isInteger(
        questionarioId
      ) ||
      questionarioId <= 0
    ) {
      return respostaErro(
        "O identificador da avaliação é inválido.",
        400
      );
    }

    /* --------------------------------------------------------
     * CORPO DA REQUISIÇÃO
     * --------------------------------------------------------
     */

    let corpo: CorpoRequisicao;

    try {
      corpo =
        (await request.json()) as CorpoRequisicao;
    } catch {
      return respostaErro(
        "O corpo da requisição é inválido.",
        400
      );
    }

    if (
      !corpo ||
      !corpo.action
    ) {
      return respostaErro(
        "A acção da requisição é obrigatória.",
        400
      );
    }

    /* --------------------------------------------------------
     * QUESTIONÁRIO
     * --------------------------------------------------------
     */

    const {
      data: questionario,
      error: erroQuestionario,
    } = await supabase
      .from("questionarios")
      .select(
        `
          id,
          pontuacao_minima
        `
      )
      .eq(
        "id",
        questionarioId
      )
      .single();

    if (
      erroQuestionario ||
      !questionario
    ) {
      return respostaErro(
        "Questionário não encontrado.",
        404
      );
    }

    /* ========================================================
     * ACÇÃO: GUARDAR RESPOSTA
     * ========================================================
     */

    if (
      corpo.action ===
      "guardar_resposta"
    ) {
      if (
        !Number.isInteger(
          corpo.avaliacao_id
        ) ||
        !Number.isInteger(
          corpo.pergunta_id
        ) ||
        !Number.isInteger(
          corpo.alternativa_id
        )
      ) {
        return respostaErro(
          "Os identificadores da resposta são inválidos.",
          400
        );
      }

      /* ------------------------------------------------------
       * VALIDAR AVALIAÇÃO
       * ------------------------------------------------------
       */

      const {
        data: avaliacao,
        error: erroAvaliacao,
      } = await supabase
        .from(
          "avaliacoes_utilizador"
        )
        .select(
          `
            id,
            questionario_id,
            estado
          `
        )
        .eq(
          "id",
          corpo.avaliacao_id
        )
        .eq(
          "utilizador_id",
          user.id
        )
        .single();

      if (
        erroAvaliacao ||
        !avaliacao ||
        Number(
          avaliacao.questionario_id
        ) !== questionarioId
      ) {
        return respostaErro(
          "A tentativa da avaliação não pertence ao utilizador actual.",
          403
        );
      }

      if (
        avaliacao.estado !==
        "EM_PROGRESSO"
      ) {
        return respostaErro(
          "Esta avaliação já foi concluída.",
          409
        );
      }

      /* ------------------------------------------------------
       * VALIDAR PERGUNTA
       * ------------------------------------------------------
       */

      const {
        data: pergunta,
        error: erroPergunta,
      } = await supabase
        .from("perguntas")
        .select(
          `
            id,
            questionario_id
          `
        )
        .eq(
          "id",
          corpo.pergunta_id
        )
        .eq(
          "questionario_id",
          questionarioId
        )
        .single();

      if (
        erroPergunta ||
        !pergunta
      ) {
        return respostaErro(
          "A pergunta não pertence a esta avaliação.",
          400
        );
      }

      /* ------------------------------------------------------
       * VALIDAR ALTERNATIVA
       * ------------------------------------------------------
       */

      const {
        data: alternativa,
        error: erroAlternativa,
      } = await supabase
        .from("alternativas")
        .select(
          `
            id,
            pergunta_id
          `
        )
        .eq(
          "id",
          corpo.alternativa_id
        )
        .eq(
          "pergunta_id",
          corpo.pergunta_id
        )
        .single();

      if (
        erroAlternativa ||
        !alternativa
      ) {
        return respostaErro(
          "A alternativa seleccionada não pertence à pergunta.",
          400
        );
      }

      /* ------------------------------------------------------
       * REMOVER RESPOSTA ANTERIOR
       * ------------------------------------------------------
       */

      const {
        error: erroApagar,
      } = await supabase
        .from(
          "respostas_utilizador"
        )
        .delete()
        .eq(
          "utilizador_id",
          user.id
        )
        .eq(
          "avaliacao_id",
          corpo.avaliacao_id
        )
        .eq(
          "pergunta_id",
          corpo.pergunta_id
        );

      if (
        erroApagar
      ) {
        console.error(
          "Erro ao substituir resposta:",
          erroApagar
        );

        return respostaErro(
          "Não foi possível actualizar a resposta.",
          500
        );
      }

      /* ------------------------------------------------------
       * INSERIR RESPOSTA
       * ------------------------------------------------------
       */

      const {
        error: erroInserir,
      } = await supabase
        .from(
          "respostas_utilizador"
        )
        .insert({
          utilizador_id:
            user.id,

          avaliacao_id:
            corpo.avaliacao_id,

          pergunta_id:
            corpo.pergunta_id,

          alternativa_id:
            corpo.alternativa_id,

          respondido_em:
            new Date().toISOString(),
        });

      if (
        erroInserir
      ) {
        console.error(
          "Erro ao guardar resposta:",
          erroInserir
        );

        return respostaErro(
          "Não foi possível guardar a resposta.",
          500
        );
      }

      return NextResponse.json({
        sucesso: true,
      });
    }

    /* ========================================================
     * ACÇÃO: SUBMETER
     * ========================================================
     *
     * A CORRECÇÃO ACONTECE AQUI.
     *
     * O navegador nunca envia a resposta correcta.
     * O servidor consulta a BD e determina a pontuação.
     * ========================================================
     */

    if (
      corpo.action ===
      "submeter"
    ) {
      if (
        !Number.isInteger(
          corpo.avaliacao_id
        )
      ) {
        return respostaErro(
          "O identificador da avaliação é inválido.",
          400
        );
      }

      /* ------------------------------------------------------
       * VALIDAR AVALIAÇÃO
       * ------------------------------------------------------
       */

      const {
        data: avaliacao,
        error: erroAvaliacao,
      } = await supabase
        .from(
          "avaliacoes_utilizador"
        )
        .select(
          `
            id,
            questionario_id,
            tentativa,
            estado
          `
        )
        .eq(
          "id",
          corpo.avaliacao_id
        )
        .eq(
          "utilizador_id",
          user.id
        )
        .single();

      if (
        erroAvaliacao ||
        !avaliacao ||
        Number(
          avaliacao.questionario_id
        ) !== questionarioId
      ) {
        return respostaErro(
          "A tentativa da avaliação não pertence ao utilizador actual.",
          403
        );
      }

      if (
        avaliacao.estado !==
        "EM_PROGRESSO"
      ) {
        return respostaErro(
          "Esta avaliação já foi concluída.",
          409
        );
      }

      /* ------------------------------------------------------
       * CARREGAR PERGUNTAS
       * ------------------------------------------------------
       */

      const {
        data: perguntas,
        error: erroPerguntas,
      } = await supabase
        .from("perguntas")
        .select(
          `
            id
          `
        )
        .eq(
          "questionario_id",
          questionarioId
        )
        .order(
          "ordem",
          {
            ascending: true,
          }
        );

      if (
        erroPerguntas
      ) {
        console.error(
          "Erro ao carregar perguntas para correcção:",
          erroPerguntas
        );

        return respostaErro(
          "Não foi possível corrigir a avaliação.",
          500
        );
      }

      const listaPerguntas =
        perguntas ?? [];

      /* ------------------------------------------------------
       * CARREGAR RESPOSTAS DO UTILIZADOR
       * ------------------------------------------------------
       */

      const {
        data: respostas,
        error: erroRespostas,
      } = await supabase
        .from(
          "respostas_utilizador"
        )
        .select(
          `
            pergunta_id,
            alternativa_id
          `
        )
        .eq(
          "utilizador_id",
          user.id
        )
        .eq(
          "avaliacao_id",
          corpo.avaliacao_id
        );

      if (
        erroRespostas
      ) {
        console.error(
          "Erro ao carregar respostas para correcção:",
          erroRespostas
        );

        return respostaErro(
          "Não foi possível corrigir as respostas.",
          500
        );
      }

      /* ------------------------------------------------------
       * MAPA DAS RESPOSTAS
       * ------------------------------------------------------
       */

      const mapaRespostas =
        new Map<
          number,
          number
        >();

      (
        respostas ?? []
      ).forEach(
        (resposta) => {
          mapaRespostas.set(
            Number(
              resposta.pergunta_id
            ),
            Number(
              resposta.alternativa_id
            )
          );
        }
      );

      /* ------------------------------------------------------
       * VERIFICAR PERGUNTAS SEM RESPOSTA
       * ------------------------------------------------------
       */

      const perguntasSemResposta =
        listaPerguntas.filter(
          (pergunta) =>
            !mapaRespostas.has(
              Number(
                pergunta.id
              )
            )
        );

      if (
        perguntasSemResposta.length >
        0
      ) {
        return respostaErro(
          `Responda a todas as perguntas antes de submeter a avaliação. Faltam ${perguntasSemResposta.length}.`,
          422
        );
      }

      /* ------------------------------------------------------
       * CARREGAR RESPOSTAS CORRECTAS
       *
       * SOMENTE O SERVIDOR EXECUTA ESTA CONSULTA.
       * ------------------------------------------------------
       */

      const idsPerguntas =
        listaPerguntas.map(
          (pergunta) =>
            Number(
              pergunta.id
            )
        );

      const {
        data: alternativas,
        error: erroAlternativas,
      } = await supabase
        .from(
          "alternativas"
        )
        .select(
          `
            id,
            pergunta_id,
            correta
          `
        )
        .in(
          "pergunta_id",
          idsPerguntas
        );

      if (
        erroAlternativas
      ) {
        console.error(
          "Erro ao carregar respostas correctas:",
          erroAlternativas
        );

        return respostaErro(
          "Não foi possível corrigir a avaliação.",
          500
        );
      }

      /* ------------------------------------------------------
       * MAPA DAS RESPOSTAS CORRECTAS
       * ------------------------------------------------------
       */

      const mapaCorretas =
        new Map<
          number,
          number
        >();

      (
        alternativas ?? []
      ).forEach(
        (alternativa) => {
          if (
            alternativa.correta ===
            true
          ) {
            mapaCorretas.set(
              Number(
                alternativa.pergunta_id
              ),
              Number(
                alternativa.id
              )
            );
          }
        }
      );

      /* ------------------------------------------------------
       * CALCULAR RESPOSTAS CORRECTAS
       * ------------------------------------------------------
       */

      let corretas = 0;

      listaPerguntas.forEach(
        (pergunta) => {
          const respostaEscolhida =
            mapaRespostas.get(
              Number(
                pergunta.id
              )
            );

          const respostaCorrecta =
            mapaCorretas.get(
              Number(
                pergunta.id
              )
            );

          if (
            respostaEscolhida !==
              undefined &&
            respostaEscolhida ===
              respostaCorrecta
          ) {
            corretas += 1;
          }
        }
      );

      /* ------------------------------------------------------
       * CALCULAR RESULTADO
       * ------------------------------------------------------
       */

      const total =
        listaPerguntas.length;

      const pontuacao =
        total > 0
          ? Math.round(
              (corretas /
                total) *
                100
            )
          : 0;

      const aprovado =
        pontuacao >=
        Number(
          questionario.pontuacao_minima
        );

      const estado =
        aprovado
          ? "APROVADA"
          : "NAO_APROVADA";

      const agora =
        new Date().toISOString();

      /* ------------------------------------------------------
       * FINALIZAR AVALIAÇÃO
       * ------------------------------------------------------
       */

      const {
        error: erroActualizar,
      } = await supabase
        .from(
          "avaliacoes_utilizador"
        )
        .update({
          pontuacao,

          total_perguntas:
            total,

          respostas_correctas:
            corretas,

          estado,

          aprovado,

          concluido_em:
            agora,

          actualizado_em:
            agora,
        })
        .eq(
          "id",
          corpo.avaliacao_id
        )
        .eq(
          "utilizador_id",
          user.id
        )
        .eq(
          "estado",
          "EM_PROGRESSO"
        );

      if (
        erroActualizar
      ) {
        console.error(
          "Erro ao finalizar avaliação:",
          erroActualizar
        );

        return respostaErro(
          "Não foi possível finalizar a avaliação.",
          500
        );
      }

      /* ------------------------------------------------------
       * DEVOLVER RESULTADO
       * ------------------------------------------------------
       */

      return NextResponse.json({
        sucesso: true,

        resultado: {
          pontuacao,

          corretas,

          total,

          aprovado,

          tentativa:
            Number(
              avaliacao.tentativa
            ),
        },
      });
    }

    /* --------------------------------------------------------
     * ACÇÃO DESCONHECIDA
     * --------------------------------------------------------
     */

    return respostaErro(
      "Acção de avaliação não suportada.",
      400
    );
  } catch (erro) {
    console.error(
      "Erro inesperado na API da avaliação:",
      erro
    );

    return respostaErro(
      "Ocorreu um erro inesperado.",
      500
    );
  }
}