"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import {
  FaArrowLeft,
  FaCheckCircle,
  FaCircle,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaSpinner,
  FaTrophy,
} from "react-icons/fa";

import { criarClienteSupabase } from "@/lib/supabase/client";

/* ============================================================
 * TIPOS
 * ============================================================
 */

type Questionario = {
  id: number;
  modulo_id: number;
  titulo: string;
  descricao: string;
  pontuacao_minima: number;
};

type Alternativa = {
  id: number;
  pergunta_id: number;
  texto: string;
  correta: boolean;
};

type Pergunta = {
  id: number;
  questionario_id: number;
  enunciado: string;
  ordem: number;
  alternativas: Alternativa[];
};

type Resultado = {
  pontuacao: number;
  corretas: number;
  total: number;
  aprovado: boolean;
  tentativa: number;
};

type RespostaGuardada = {
  pergunta_id: number;
  alternativa_id: number;
};

type AvaliacaoUtilizador = {
  id: number;
  tentativa: number;
  estado: string;
  aprovado: boolean;
  pontuacao: number;
  total_perguntas: number;
  respostas_correctas: number;
  iniciado_em: string;
  concluido_em: string | null;
};

/* ============================================================
 * PÃGINA
 * ============================================================
 */

export default function AvaliacaoPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const modo = searchParams.get("modo") ?? "iniciar";

  const questionarioId = Number(params.id);

  const [questionario, setQuestionario] =
    useState<Questionario | null>(null);

  const [perguntas, setPerguntas] =
    useState<Pergunta[]>([]);

  const [respostas, setRespostas] =
    useState<Record<number, number>>({});

  const [avaliacaoId, setAvaliacaoId] =
    useState<number | null>(null);

  const [tentativa, setTentativa] =
    useState(1);

  const [carregando, setCarregando] =
    useState(true);

  const [submetendo, setSubmetendo] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [resultado, setResultado] =
    useState<Resultado | null>(null);

  const [guardandoResposta, setGuardandoResposta] =
    useState(false);

  const supabase = criarClienteSupabase();

  /* ==========================================================
   * CARREGAR AVALIAÃ‡ÃƒO
   * ==========================================================
   */

  useEffect(() => {
    async function carregarAvaliacao() {
      try {
        setCarregando(true);
        setErro("");

        /* ------------------------------------------------------
         * VALIDAR ID
         * ------------------------------------------------------
         */

        if (
          !questionarioId ||
          Number.isNaN(questionarioId)
        ) {
          setErro(
            "A avaliaÃ§Ã£o seleccionada Ã© invÃ¡lida."
          );

          return;
        }

        /* ------------------------------------------------------
         * UTILIZADOR AUTENTICADO
         * ------------------------------------------------------
         */

        const {
          data: { user },
          error: utilizadorError,
        } = await supabase.auth.getUser();

        if (utilizadorError || !user) {
          setErro(
            "NÃ£o foi possÃ­vel identificar o utilizador autenticado."
          );

          return;
        }

        /* ------------------------------------------------------
         * QUESTIONÃRIO
         * ------------------------------------------------------
         */

        const {
          data: questionarioData,
          error: questionarioError,
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
          .eq("id", questionarioId)
          .single();

        if (
          questionarioError ||
          !questionarioData
        ) {
          console.error(
            "Erro ao carregar questionÃ¡rio:",
            questionarioError
          );

          setErro(
            "NÃ£o foi possÃ­vel carregar esta avaliaÃ§Ã£o."
          );

          return;
        }

        setQuestionario(
          questionarioData as Questionario
        );

        /* ------------------------------------------------------
         * PERGUNTAS + ALTERNATIVAS
         * ------------------------------------------------------
         */

        const {
          data: perguntasData,
          error: perguntasError,
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
                texto,
                correta
              )
            `
          )
          .eq(
            "questionario_id",
            questionarioId
          )
          .order("ordem", {
            ascending: true,
          });

        if (perguntasError) {
          console.error(
            "Erro ao carregar perguntas:",
            perguntasError
          );

          setErro(
            "NÃ£o foi possÃ­vel carregar as perguntas desta avaliaÃ§Ã£o."
          );

          return;
        }

        const perguntasCarregadas =
          (perguntasData ?? []) as Pergunta[];

        setPerguntas(
          perguntasCarregadas
        );

        /* ------------------------------------------------------
         * VERIFICAR AVALIAÃ‡ÃƒO EM ANDAMENTO
         *
         * IMPORTANTE:
         *
         * Se o estudante actualiza a pÃ¡gina ou sai e volta,
         * reutilizamos a tentativa que ainda estÃ¡ EM_PROGRESSO.
         *
         * Assim nÃ£o criamos uma nova tentativa a cada refresh.
         * ------------------------------------------------------
         */

        const {
          data: avaliacaoEmAndamento,
          error: avaliacaoAndamentoError,
        } = await supabase
          .from("avaliacoes_utilizador")
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
          .order("tentativa", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (avaliacaoAndamentoError) {
          console.error(
            "Erro ao verificar avaliaÃ§Ã£o em andamento:",
            avaliacaoAndamentoError
          );

          setErro(
            "NÃ£o foi possÃ­vel verificar o estado da sua avaliaÃ§Ã£o."
          );

          return;
        }

        let avaliacaoActual:
          AvaliacaoUtilizador | null =
          avaliacaoEmAndamento
            ? (avaliacaoEmAndamento as AvaliacaoUtilizador)
            : null;

        /* ------------------------------------------------------
         * PERSISTÃŠNCIA DA TENTATIVA
         *
         * Actualizar a pÃ¡gina NUNCA deve criar uma nova tentativa.
         * Se jÃ¡ existe uma tentativa concluÃ­da, mostramos o seu
         * resultado. Uma nova tentativa sÃ³ nasce quando o estudante
         * escolhe explicitamente "Tentar novamente" (modo=retry).
         *
         * A tentativa EM_PROGRESSO tem sempre prioridade, porque
         * representa uma avaliaÃ§Ã£o que o estudante ainda nÃ£o terminou.
         * ------------------------------------------------------
         */

        if (!avaliacaoActual && modo !== "retry") {
          const {
            data: ultimaAvaliacaoConcluida,
            error: erroUltimaAvaliacaoConcluida,
          } = await supabase
            .from("avaliacoes_utilizador")
            .select(`
              id,
              tentativa,
              estado,
              aprovado,
              pontuacao,
              total_perguntas,
              respostas_correctas,
              iniciado_em,
              concluido_em
            `)
            .eq("utilizador_id", user.id)
            .eq("questionario_id", questionarioId)
            .in("estado", ["APROVADA", "NAO_APROVADA"])
            .order("tentativa", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (erroUltimaAvaliacaoConcluida) {
            console.error(
              "Erro ao carregar o Ãºltimo resultado da avaliaÃ§Ã£o:",
              erroUltimaAvaliacaoConcluida
            );

            setErro(
              "NÃ£o foi possÃ­vel verificar o resultado anterior da avaliaÃ§Ã£o."
            );

            return;
          }

          if (ultimaAvaliacaoConcluida) {
            const resultadoAnterior =
              ultimaAvaliacaoConcluida as AvaliacaoUtilizador;

            setAvaliacaoId(Number(resultadoAnterior.id));
            setTentativa(Number(resultadoAnterior.tentativa));

            const {
              data: respostasResultado,
              error: erroRespostasResultado,
            } = await supabase
              .from("respostas_utilizador")
              .select("pergunta_id, alternativa_id")
              .eq("utilizador_id", user.id)
              .eq("avaliacao_id", resultadoAnterior.id);

            if (erroRespostasResultado) {
              console.error(
                "Erro ao carregar respostas do resultado:",
                erroRespostasResultado
              );
            } else {
              const respostasAnteriores: Record<number, number> = {};

              ((respostasResultado ?? []) as RespostaGuardada[]).forEach(
                (resposta) => {
                  respostasAnteriores[Number(resposta.pergunta_id)] =
                    Number(resposta.alternativa_id);
                }
              );

              setRespostas(respostasAnteriores);
            }

            setResultado({
              pontuacao: Number(resultadoAnterior.pontuacao),
              corretas: Number(resultadoAnterior.respostas_correctas),
              total: Number(resultadoAnterior.total_perguntas),
              aprovado: Boolean(resultadoAnterior.aprovado),
              tentativa: Number(resultadoAnterior.tentativa),
            });

            return;
          }
        }

        /* ------------------------------------------------------
         * SÃ“ AGORA CRIAMOS UMA NOVA TENTATIVA.
         * Isto acontece apenas quando:
         * 1. nÃ£o existe EM_PROGRESSO; e
         * 2. nÃ£o existe resultado anterior; ou
         * 3. o estudante pediu explicitamente modo=retry.
         * ------------------------------------------------------
         */

        if (!avaliacaoActual) {
          const {
            data: ultimaAvaliacao,
            error: ultimaAvaliacaoError,
          } = await supabase
            .from("avaliacoes_utilizador")
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
            .order("tentativa", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle();

          if (ultimaAvaliacaoError) {
            console.error(
              "Erro ao verificar Ãºltima tentativa:",
              ultimaAvaliacaoError
            );

            setErro(
              "NÃ£o foi possÃ­vel determinar a prÃ³xima tentativa."
            );

            return;
          }

          const proximaTentativa =
            ultimaAvaliacao
              ? Number(
                  ultimaAvaliacao.tentativa
                ) + 1
              : 1;

          /* ----------------------------------------------------
           * CRIAR REGISTO DA AVALIAÃ‡ÃƒO
           *
           * ESTE REGISTO REPRESENTA A AVALIAÃ‡ÃƒO COMPLETA.
           *
           * As perguntas nÃ£o criam avaliaÃ§Ãµes.
           * ----------------------------------------------------
           */

          const {
            data: novaAvaliacao,
            error: novaAvaliacaoError,
          } = await supabase
            .from("avaliacoes_utilizador")
            .insert({
              utilizador_id: user.id,
              questionario_id:
                questionarioId,

              pontuacao: 0,

              total_perguntas:
                perguntasCarregadas.length,

              respostas_correctas: 0,

              estado: "EM_PROGRESSO",

              aprovado: false,

              iniciado_em:
                new Date().toISOString(),

              concluido_em: null,

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
            novaAvaliacaoError ||
            !novaAvaliacao
          ) {
            console.error(
              "Erro ao criar avaliaÃ§Ã£o:",
              novaAvaliacaoError
            );

            setErro(
              "NÃ£o foi possÃ­vel iniciar a avaliaÃ§Ã£o."
            );

            return;
          }

          avaliacaoActual =
            novaAvaliacao as AvaliacaoUtilizador;
        }

        /* ------------------------------------------------------
         * GUARDAR ID DA AVALIAÃ‡ÃƒO
         * ------------------------------------------------------
         */

        setAvaliacaoId(
          Number(avaliacaoActual.id)
        );

        setTentativa(
          Number(avaliacaoActual.tentativa)
        );

        /* ------------------------------------------------------
         * CARREGAR RESPOSTAS DA TENTATIVA
         *
         * A PARTIR DE AGORA:
         *
         * respostas_utilizador.avaliacao_id
         *
         * identifica exactamente a tentativa.
         * ------------------------------------------------------
         */

        const {
          data: respostasData,
          error: respostasError,
        } = await supabase
          .from("respostas_utilizador")
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
            avaliacaoActual.id
          );

        if (respostasError) {
          console.error(
            "Erro ao carregar respostas da tentativa:",
            respostasError
          );

          setErro(
            "NÃ£o foi possÃ­vel carregar o progresso da avaliaÃ§Ã£o."
          );

          return;
        }

        const respostasIniciais:
          Record<number, number> = {};

        (
          (respostasData ??
            []) as RespostaGuardada[]
        ).forEach((resposta) => {
          respostasIniciais[
            Number(resposta.pergunta_id)
          ] =
            Number(
              resposta.alternativa_id
            );
        });

        setRespostas(
          respostasIniciais
        );

        /* ------------------------------------------------------
         * SE JÃ EXISTIR UMA AVALIAÃ‡ÃƒO CONCLUÃDA,
         * MOSTRAR O RESULTADO.
         *
         * Normalmente isto nÃ£o acontece nesta lÃ³gica porque
         * criamos/reutilizamos apenas EM_PROGRESSO.
         * ------------------------------------------------------
         */

        if (
          avaliacaoActual.estado !==
            "EM_PROGRESSO" &&
          avaliacaoActual.concluido_em
        ) {
          setResultado({
            pontuacao:
              Number(
                avaliacaoActual.pontuacao
              ),

            corretas:
              Number(
                avaliacaoActual.respostas_correctas
              ),

            total:
              Number(
                avaliacaoActual.total_perguntas
              ),

            aprovado:
              Boolean(
                avaliacaoActual.aprovado
              ),

            tentativa:
              Number(
                avaliacaoActual.tentativa
              ),
          });
        }
      } catch (error) {
        console.error(
          "Erro inesperado ao carregar avaliaÃ§Ã£o:",
          error
        );

        setErro(
          "Ocorreu um erro inesperado ao carregar a avaliaÃ§Ã£o."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarAvaliacao();
  }, [questionarioId, modo]);

  /* ==========================================================
   * SELECCIONAR RESPOSTA
   * ==========================================================
   */

  async function seleccionarResposta(
    perguntaId: number,
    alternativaId: number
  ) {
    if (
      resultado ||
      !avaliacaoId
    ) {
      return;
    }

    /* --------------------------------------------------------
     * ACTUALIZAR INTERFACE IMEDIATAMENTE
     * --------------------------------------------------------
     */

    setRespostas(
      (estadoAtual) => ({
        ...estadoAtual,
        [perguntaId]:
          alternativaId,
      })
    );

    /*
     * Guardamos tambÃ©m a resposta no banco.
     *
     * Isto permite que o estudante possa sair da pÃ¡gina,
     * voltar mais tarde e continuar a tentativa.
     */

    try {
      setGuardandoResposta(true);

      const {
        data: {
          user,
        },
        error: utilizadorError,
      } = await supabase.auth.getUser();

      if (
        utilizadorError ||
        !user
      ) {
        console.error(
          "Utilizador nÃ£o autenticado:",
          utilizadorError
        );

        return;
      }

      /* ------------------------------------------------------
       * APAGAR EVENTUAL RESPOSTA ANTERIOR
       * DA MESMA PERGUNTA NESTA TENTATIVA
       * ------------------------------------------------------
       */

      const {
        error: apagarError,
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
          avaliacaoId
        )
        .eq(
          "pergunta_id",
          perguntaId
        );

      if (apagarError) {
        console.error(
          "Erro ao actualizar resposta:",
          apagarError
        );

        return;
      }

      /* ------------------------------------------------------
       * INSERIR NOVA RESPOSTA
       * ------------------------------------------------------
       */

      const {
        error: inserirError,
      } = await supabase
        .from(
          "respostas_utilizador"
        )
        .insert({
          utilizador_id:
            user.id,

          avaliacao_id:
            avaliacaoId,

          pergunta_id:
            perguntaId,

          alternativa_id:
            alternativaId,

          respondido_em:
            new Date().toISOString(),
        });

      if (inserirError) {
        console.error(
          "Erro ao guardar resposta:",
          inserirError
        );
      }
    } catch (error) {
      console.error(
        "Erro ao guardar resposta:",
        error
      );
    } finally {
      setGuardandoResposta(false);
    }
  }

  /* ==========================================================
   * SUBMETER AVALIAÃ‡ÃƒO
   * ==========================================================
   */

  async function submeterAvaliacao() {
    if (
      !questionario ||
      !avaliacaoId
    ) {
      return;
    }

    /* --------------------------------------------------------
     * VERIFICAR PERGUNTAS
     * --------------------------------------------------------
     */

    if (
      perguntas.length === 0
    ) {
      setErro(
        "Esta avaliaÃ§Ã£o ainda nÃ£o possui perguntas."
      );

      return;
    }

    /* --------------------------------------------------------
     * VERIFICAR TODAS AS RESPOSTAS
     * --------------------------------------------------------
     */

    const perguntasSemResposta =
      perguntas.filter(
        (pergunta) =>
          !respostas[
            pergunta.id
          ]
      );

    if (
      perguntasSemResposta.length >
      0
    ) {
      setErro(
        `Responda a todas as perguntas antes de submeter a avaliaÃ§Ã£o. Faltam ${perguntasSemResposta.length}.`
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setSubmetendo(true);
      setErro("");

      /* ------------------------------------------------------
       * UTILIZADOR
       * ------------------------------------------------------
       */

      const {
        data: {
          user,
        },
        error: utilizadorError,
      } = await supabase.auth.getUser();

      if (
        utilizadorError ||
        !user
      ) {
        setErro(
          "NÃ£o foi possÃ­vel identificar o utilizador autenticado."
        );

        return;
      }

      /* ------------------------------------------------------
       * CALCULAR RESULTADO
       * ------------------------------------------------------
       */

      let corretas = 0;

      perguntas.forEach(
        (pergunta) => {
          const alternativaEscolhida =
            pergunta.alternativas.find(
              (alternativa) =>
                alternativa.id ===
                respostas[
                  pergunta.id
                ]
            );

          if (
            alternativaEscolhida?.correta
          ) {
            corretas++;
          }
        }
      );

      const total =
        perguntas.length;

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
        questionario.pontuacao_minima;

      /* ------------------------------------------------------
       * GARANTIR QUE TODAS AS RESPOSTAS
       * DA TENTATIVA ESTÃƒO NO BANCO
       *
       * Caso alguma selecÃ§Ã£o ainda esteja apenas no estado
       * local, fazemos uma sincronizaÃ§Ã£o final.
       * ------------------------------------------------------
       */

      const respostasParaGuardar =
        perguntas.map(
          (pergunta) => ({
            utilizador_id:
              user.id,

            avaliacao_id:
              avaliacaoId,

            pergunta_id:
              pergunta.id,

            alternativa_id:
              respostas[
                pergunta.id
              ],

            respondido_em:
              new Date().toISOString(),
          })
        );

      /* ------------------------------------------------------
       * LIMPAR APENAS RESPOSTAS
       * DESTA TENTATIVA
       *
       * NUNCA apagamos respostas de outras tentativas.
       * ------------------------------------------------------
       */

      const {
        error:
          apagarRespostasError,
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
          avaliacaoId
        );

      if (
        apagarRespostasError
      ) {
        console.error(
          "Erro ao preparar respostas da avaliaÃ§Ã£o:",
          apagarRespostasError
        );

        setErro(
          "NÃ£o foi possÃ­vel preparar as respostas para submissÃ£o."
        );

        return;
      }

      /* ------------------------------------------------------
       * GUARDAR TODAS AS RESPOSTAS
       * LIGADAS Ã€ TENTATIVA
       * ------------------------------------------------------
       */

      const {
        error:
          guardarRespostasError,
      } = await supabase
        .from(
          "respostas_utilizador"
        )
        .insert(
          respostasParaGuardar
        );

      if (
        guardarRespostasError
      ) {
        console.error(
          "Erro ao guardar respostas:",
          guardarRespostasError
        );

        setErro(
          "NÃ£o foi possÃ­vel guardar as respostas da avaliaÃ§Ã£o."
        );

        return;
      }

      /* ------------------------------------------------------
       * FINALIZAR A AVALIAÃ‡ÃƒO
       *
       * UM ÃšNICO REGISTO EM
       * avaliacoes_utilizador
       *
       * independentemente de existirem
       * 5, 10, 20 ou 50 perguntas.
       * ------------------------------------------------------
       */

      const {
        error:
          actualizarAvaliacaoError,
      } = await supabase
        .from(
          "avaliacoes_utilizador"
        )
        .update({
          pontuacao:
            pontuacao,

          total_perguntas:
            total,

          respostas_correctas:
            corretas,

          estado:
            aprovado
              ? "APROVADA"
              : "NAO_APROVADA",

          aprovado:
            aprovado,

          concluido_em:
            new Date().toISOString(),

          actualizado_em:
            new Date().toISOString(),
        })
        .eq(
          "id",
          avaliacaoId
        )
        .eq(
          "utilizador_id",
          user.id
        );

      if (
        actualizarAvaliacaoError
      ) {
        console.error(
          "Erro ao finalizar avaliaÃ§Ã£o:",
          actualizarAvaliacaoError
        );

        setErro(
          "As respostas foram guardadas, mas nÃ£o foi possÃ­vel finalizar a avaliaÃ§Ã£o."
        );

        return;
      }

      /* ------------------------------------------------------
       * MOSTRAR RESULTADO
       * ------------------------------------------------------
       */

      setResultado({
        pontuacao,
        corretas,
        total,
        aprovado,
        tentativa,
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Erro ao submeter avaliaÃ§Ã£o:",
        error
      );

      setErro(
        "Ocorreu um erro ao submeter a avaliaÃ§Ã£o."
      );
    } finally {
      setSubmetendo(false);
    }
  }

  /* ==========================================================
   * CARREGAMENTO
   * ==========================================================
   */

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="text-4xl text-blue-700 animate-spin" />

          <p className="text-slate-600">
            A preparar a avaliaÃ§Ã£o...
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================================
   * ERRO DE CARREGAMENTO
   * ==========================================================
   */

  if (
    erro &&
    !questionario
  ) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">

          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-5">
            <FaExclamationTriangle className="text-2xl text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            NÃ£o foi possÃ­vel carregar a avaliaÃ§Ã£o
          </h1>

          <p className="text-slate-600 mb-7">
            {erro}
          </p>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
          >
            <FaArrowLeft />
            Voltar
          </button>

        </div>
      </div>
    );
  }

  /* ==========================================================
   * RESULTADO FINAL
   * ==========================================================
   */

  if (
    resultado &&
    questionario
  ) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">

        <div className="max-w-4xl mx-auto">

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

            {/* CABEÃ‡ALHO DO RESULTADO */}

            <div
              className={`p-10 text-center ${
                resultado.aprovado
                  ? "bg-emerald-50"
                  : "bg-red-50"
              }`}
            >

              <div
                className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${
                  resultado.aprovado
                    ? "bg-emerald-100"
                    : "bg-red-100"
                }`}
              >

                {resultado.aprovado ? (
                  <FaTrophy className="text-4xl text-emerald-600" />
                ) : (
                  <FaExclamationTriangle className="text-4xl text-red-600" />
                )}

              </div>

              <h1 className="text-3xl font-bold text-slate-900 mb-3">
                {resultado.aprovado
                  ? "AvaliaÃ§Ã£o concluÃ­da!"
                  : "AvaliaÃ§Ã£o concluÃ­da sem aproveitamento"}
              </h1>

              <p className="text-slate-600">
                {resultado.aprovado
                  ? "ParabÃ©ns! Atingiu a pontuaÃ§Ã£o mÃ­nima necessÃ¡ria."
                  : "Reveja os conteÃºdos e tente novamente."}
              </p>

            </div>

            {/* DADOS */}

            <div className="p-8">

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

                {/* PONTUAÃ‡ÃƒO */}

                <div className="bg-slate-50 rounded-2xl p-6 text-center">

                  <p className="text-sm text-slate-500 mb-2">
                    PontuaÃ§Ã£o
                  </p>

                  <p
                    className={`text-4xl font-bold ${
                      resultado.aprovado
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {resultado.pontuacao}%
                  </p>

                </div>

                {/* CORRECTAS */}

                <div className="bg-slate-50 rounded-2xl p-6 text-center">

                  <p className="text-sm text-slate-500 mb-2">
                    Respostas correctas
                  </p>

                  <p className="text-4xl font-bold text-slate-900">
                    {resultado.corretas}/
                    {resultado.total}
                  </p>

                </div>

                {/* MÃNIMO */}

                <div className="bg-slate-50 rounded-2xl p-6 text-center">

                  <p className="text-sm text-slate-500 mb-2">
                    PontuaÃ§Ã£o mÃ­nima
                  </p>

                  <p className="text-4xl font-bold text-blue-700">
                    {
                      questionario.pontuacao_minima
                    }%
                  </p>

                </div>

                {/* TENTATIVA */}

                <div className="bg-slate-50 rounded-2xl p-6 text-center">

                  <p className="text-sm text-slate-500 mb-2">
                    Tentativa
                  </p>

                  <p className="text-4xl font-bold text-slate-900">
                    #{resultado.tentativa}
                  </p>

                </div>

              </div>

              {/* MENSAGEM DE CERTIFICAÃ‡ÃƒO */}

              {resultado.aprovado && (
                <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

                  <div className="flex items-start gap-3">

                    <FaCheckCircle className="text-emerald-600 mt-1 shrink-0" />

                    <div>

                      <p className="font-semibold text-emerald-900">
                        AvaliaÃ§Ã£o aprovada
                      </p>

                      <p className="mt-1 text-sm text-emerald-700">
                        Esta avaliaÃ§Ã£o foi concluÃ­da com aproveitamento. A conclusÃ£o do curso e a emissÃ£o do certificado serÃ£o verificadas pelo SICSI apÃ³s o cumprimento dos restantes requisitos.
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {/* BOTÃ•ES */}

              <div className="flex flex-col sm:flex-row justify-center gap-4">

                <button
                  type="button"
                  onClick={() =>
                    router.back()
                  }
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  <FaArrowLeft />
                  Voltar ao mÃ³dulo
                </button>

                {!resultado.aprovado && (
                  <button
                    type="button"
                    onClick={() => {
                      router.push(
                        `/dashboard/avaliacoes/${questionario.id}?modo=retry`
                      );
                    }}
                    className="px-6 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
                  >
                    Tentar novamente
                  </button>
                )}

              </div>

            </div>

          </div>

        </div>

      </div>
    );
  }

  /* ==========================================================
   * SEM PERGUNTAS
   * ==========================================================
   */

  if (
    perguntas.length === 0
  ) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">

        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">

          <FaClipboardCheck className="text-5xl text-blue-700 mx-auto mb-5" />

          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            AvaliaÃ§Ã£o ainda nÃ£o disponÃ­vel
          </h1>

          <p className="text-slate-600 mb-7">
            Esta avaliaÃ§Ã£o ainda nÃ£o possui perguntas disponÃ­veis.
          </p>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
          >
            <FaArrowLeft />
            Voltar
          </button>

        </div>

      </div>
    );
  }

  /* ==========================================================
   * INTERFACE
   * ==========================================================
   */

  const respondidas =
    Object.keys(respostas).length;

  const progresso =
    perguntas.length > 0
      ? Math.round(
          (respondidas /
            perguntas.length) *
            100
        )
      : 0;

  /* ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">

      <div className="max-w-4xl mx-auto">

        {/* ====================================================
         * CABEÃ‡ALHO
         * ====================================================
         */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 mb-6">

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-700 font-medium mb-6 transition"
          >
            <FaArrowLeft />
            Voltar
          </button>

          <div className="flex items-start gap-4">

            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <FaClipboardCheck className="text-2xl text-blue-700" />
            </div>

            <div>

              <div className="flex flex-wrap items-center gap-2 mb-2">

                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  AvaliaÃ§Ã£o
                </span>

                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Tentativa #{tentativa}
                </span>

              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                {questionario?.titulo}
              </h1>

              <p className="text-slate-600 mt-2">
                {questionario?.descricao}
              </p>

            </div>

          </div>

          {/* ==================================================
           * PROGRESSO
           * ==================================================
           */}

          <div className="mt-7">

            <div className="flex justify-between text-sm mb-2">

              <span className="font-medium text-slate-700">
                Progresso da avaliaÃ§Ã£o
              </span>

              <span className="text-slate-500">
                {respondidas} de{" "}
                {perguntas.length}{" "}
                respondidas
              </span>

            </div>

            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">

              <div
                className="h-full bg-blue-700 rounded-full transition-all duration-300"
                style={{
                  width: `${progresso}%`,
                }}
              />

            </div>

            <div className="flex justify-between mt-2 text-xs text-slate-400">

              <span>
                0%
              </span>

              <span>
                {progresso}%
              </span>

              <span>
                100%
              </span>

            </div>

          </div>

          {/* ==================================================
           * ESTADO DE GRAVAÃ‡ÃƒO
           * ==================================================
           */}

          {guardandoResposta && (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">

              <FaSpinner className="animate-spin" />

              A guardar a sua resposta...

            </div>
          )}

        </div>

        {/* ====================================================
         * ERRO
         * ====================================================
         */}

        {erro && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">

            <FaExclamationTriangle className="text-red-600 mt-0.5 shrink-0" />

            <p className="text-red-700 text-sm">
              {erro}
            </p>

          </div>
        )}

        {/* ====================================================
         * PERGUNTAS
         * ====================================================
         */}

        <div className="space-y-6">

          {perguntas.map(
            (
              pergunta,
              indice
            ) => {

              const respostaSelecionada =
                respostas[
                  pergunta.id
                ];

              const alternativasOrdenadas =
                [...pergunta.alternativas].sort(
                  (a, b) =>
                    a.id - b.id
                );

              return (
                <div
                  key={pergunta.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7"
                >

                  <div className="flex gap-4">

                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                      {indice + 1}
                    </div>

                    <div className="flex-1">

                      <h2 className="text-lg md:text-xl font-semibold text-slate-900 leading-relaxed">
                        {pergunta.enunciado}
                      </h2>

                      <div className="mt-5 space-y-3">

                        {alternativasOrdenadas.map(
                          (
                            alternativa
                          ) => {

                            const selecionada =
                              respostaSelecionada ===
                              alternativa.id;

                            return (
                              <button
                                key={
                                  alternativa.id
                                }
                                type="button"
                                onClick={() =>
                                  seleccionarResposta(
                                    pergunta.id,
                                    alternativa.id
                                  )
                                }
                                className={`w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 ${
                                  selecionada
                                    ? "border-blue-700 bg-blue-50"
                                    : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                                }`}
                              >

                                {selecionada ? (
                                  <FaCheckCircle className="text-blue-700 shrink-0" />
                                ) : (
                                  <FaCircle className="text-slate-300 shrink-0" />
                                )}

                                <span
                                  className={
                                    selecionada
                                      ? "font-medium text-blue-900"
                                      : "text-slate-700"
                                  }
                                >
                                  {
                                    alternativa.texto
                                  }
                                </span>

                              </button>
                            );
                          }
                        )}

                      </div>

                    </div>

                  </div>

                </div>
              );
            }
          )}

        </div>

        {/* ====================================================
         * SUBMETER
         * ====================================================
         */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-6">

          <div className="flex flex-col md:flex-row items-center justify-between gap-5">

            <div>

              <p className="font-semibold text-slate-900">
                EstÃ¡ pronto para submeter?
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Respondeu{" "}
                {respondidas} de{" "}
                {perguntas.length}{" "}
                perguntas.
              </p>

              <p className="text-xs text-slate-400 mt-1">
                A avaliaÃ§Ã£o sÃ³ serÃ¡ concluÃ­da depois da submissÃ£o.
              </p>

            </div>

            <button
              type="button"
              disabled={
                submetendo ||
                guardandoResposta
              }
              onClick={
                submeterAvaliacao
              }
              className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition ${
                submetendo ||
                guardandoResposta
                  ? "bg-blue-400 cursor-wait"
                  : "bg-blue-700 hover:bg-blue-800 shadow-sm"
              }`}
            >

              {submetendo ? (
                <>
                  <FaSpinner className="animate-spin" />
                  A processar...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Submeter avaliaÃ§Ã£o
                </>
              )}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}