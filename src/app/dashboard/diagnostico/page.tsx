"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { criarClienteSupabase } from "@/lib/supabase/client";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaChevronRight,
  FaGraduationCap,
  FaShieldAlt,
} from "react-icons/fa";

type Alternativa = {
  id: number;
  texto: string;
};

type Pergunta = {
  id: number;
  enunciado: string;
  ordem: number;
  alternativas: Alternativa[];
};

type Resultado = {
  pontuacao: number;
  totalPerguntas: number;
  respostasCorrectas: number;
  percentagem: number;
  nivel: string;
  tituloNivel: string;
  descricaoNivel: string;
  recomendacao: string;
  cursoId: number | null;
  cursoTitulo: string | null;
};

const QUESTIONARIO_ID = 6;

export default function DiagnosticoPage() {
  const router = useRouter();

  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [avaliacaoId, setAvaliacaoId] = useState<number | null>(null);

  useEffect(() => {
    async function carregarDiagnostico() {
      const supabase = criarClienteSupabase();

      try {
        const {
          data: { user },
          error: erroUtilizador,
        } = await supabase.auth.getUser();

        if (erroUtilizador || !user) {
          router.replace("/login");
          return;
        }

        const { data: questionario, error: erroQuestionario } =
          await supabase
            .from("questionarios")
            .select("id, titulo, descricao")
            .eq("id", QUESTIONARIO_ID)
            .single();

        if (erroQuestionario || !questionario) {
          throw new Error(
            "Não foi possível carregar o teste diagnóstico."
          );
        }

        const { data: perguntasData, error: erroPerguntas } =
          await supabase
            .from("perguntas")
            .select(
              `
                id,
                enunciado,
                ordem,
                alternativas (
                  id,
                  texto
                )
              `
            )
            .eq("questionario_id", QUESTIONARIO_ID)
            .order("ordem", { ascending: true });

        if (erroPerguntas) {
          throw new Error(
            `Erro ao carregar perguntas: ${erroPerguntas.message}`
          );
        }

        const perguntasOrganizadas: Pergunta[] = (
          perguntasData ?? []
        ).map((pergunta: any) => ({
          id: Number(pergunta.id),
          enunciado: pergunta.enunciado,
          ordem: Number(pergunta.ordem),
          alternativas: (pergunta.alternativas ?? [])
            .map((alternativa: any) => ({
              id: Number(alternativa.id),
              texto: alternativa.texto,
            }))
            .sort((a: Alternativa, b: Alternativa) => a.id - b.id),
        }));

        if (perguntasOrganizadas.length === 0) {
          throw new Error(
            "O teste diagnóstico ainda não possui perguntas."
          );
        }

        setPerguntas(perguntasOrganizadas);
      } catch (erro) {
        console.error(
          "Erro ao carregar diagnóstico:",
          erro
        );

        setErro(
          erro instanceof Error
            ? erro.message
            : "Não foi possível carregar o diagnóstico."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDiagnostico();
  }, [router]);

  function seleccionarResposta(
    perguntaId: number,
    alternativaId: number
  ) {
    if (enviando || resultado) {
      return;
    }

    setRespostas((actual) => ({
      ...actual,
      [perguntaId]: alternativaId,
    }));

    setErro("");
  }

  async function iniciarAvaliacao(): Promise<number | null> {
    const resposta = await fetch(
      "/api/diagnostico/iniciar",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionarioId: QUESTIONARIO_ID,
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok || !dados.sucesso) {
      throw new Error(
        dados.erro ||
          "Não foi possível iniciar a avaliação."
      );
    }

    return Number(dados.avaliacaoId);
  }

  async function finalizarAvaliacao(
    idAvaliacao: number
  ) {
    const respostasFormatadas = Object.entries(
      respostas
    ).map(([perguntaId, alternativaId]) => ({
      perguntaId: Number(perguntaId),
      alternativaId: Number(alternativaId),
    }));

    const resposta = await fetch(
      "/api/diagnostico/finalizar",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avaliacaoId: idAvaliacao,
          questionarioId: QUESTIONARIO_ID,
          respostas: respostasFormatadas,
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok || !dados.sucesso) {
      throw new Error(
        dados.erro ||
          "Não foi possível finalizar a avaliação."
      );
    }

    return dados.resultado as Resultado;
  }

  async function submeterDiagnostico() {
    setErro("");

    if (Object.keys(respostas).length !== perguntas.length) {
      setErro(
        "Responda a todas as perguntas antes de concluir o diagnóstico."
      );
      return;
    }

    setEnviando(true);

    try {
      const idAvaliacao =
        avaliacaoId ?? (await iniciarAvaliacao());

      if (!idAvaliacao) {
        throw new Error(
          "Não foi possível identificar a avaliação."
        );
      }

      setAvaliacaoId(idAvaliacao);

      const resultadoFinal =
        await finalizarAvaliacao(idAvaliacao);

      setResultado(resultadoFinal);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (erro) {
      console.error(
        "Erro ao concluir diagnóstico:",
        erro
      );

      setErro(
        erro instanceof Error
          ? erro.message
          : "Ocorreu um erro ao concluir o diagnóstico."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-20">
        <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-800" />
            <p className="text-sm font-medium text-gray-500">
              A preparar o seu diagnóstico...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (resultado) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800 transition hover:text-blue-950"
            >
              <FaArrowLeft />
              Voltar ao dashboard
            </Link>
          </div>

          <section className="overflow-hidden rounded-3xl bg-blue-950 shadow-xl">
            <div className="px-6 py-10 text-center sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-lg">
                <FaCheckCircle className="text-3xl" />
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-blue-200">
                Diagnóstico concluído
              </p>

              <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
                O seu resultado
              </h1>

              <div className="mt-8 text-6xl font-black text-white">
                {resultado.percentagem}%
              </div>

              <p className="mt-2 text-blue-100">
                {resultado.respostasCorrectas} de{" "}
                {resultado.totalPerguntas} respostas correctas
              </p>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
                <FaGraduationCap className="text-xl" />
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-800">
                  Nível identificado
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {resultado.tituloNivel}
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {resultado.descricaoNivel}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-blue-50 p-5">
              <p className="text-sm font-semibold text-blue-950">
                Recomendação
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-700">
                {resultado.recomendacao}
              </p>

              {resultado.cursoTitulo && (
                <div className="mt-5">
                  <Link
                    href={`/dashboard/cursos/${resultado.cursoId}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                  >
                    Explorar curso recomendado
                    <FaChevronRight className="text-xs" />
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/cursos"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Explorar cursos
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
              >
                Voltar ao dashboard
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const respondidas = Object.keys(respostas).length;
  const progressoPerguntas =
    perguntas.length > 0
      ? Math.round(
          (respondidas / perguntas.length) * 100
        )
      : 0;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800 transition hover:text-blue-950"
          >
            <FaArrowLeft />
            Voltar ao dashboard
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl bg-blue-950 shadow-xl">
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-950 shadow-lg">
                <FaShieldAlt className="text-xl" />
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-200">
                  Avaliação opcional
                </p>

                <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  Teste Diagnóstico de Cibersegurança
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                  Responda a 5 perguntas para descobrir o
                  seu nível actual de conhecimentos em
                  cibersegurança e receber uma recomendação
                  de aprendizagem.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-blue-200">
                <span>
                  {respondidas} de {perguntas.length} respondidas
                </span>

                <span>{progressoPerguntas}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-blue-900">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{
                    width: `${progressoPerguntas}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {erro && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {erro}
          </div>
        )}

        <div className="mt-6 space-y-5">
          {perguntas.map((pergunta, indice) => {
            const respostaSeleccionada =
              respostas[pergunta.id];

            return (
              <section
                key={pergunta.id}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-900">
                    {indice + 1}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Pergunta {indice + 1}
                    </p>

                    <h2 className="mt-2 text-lg font-bold leading-7 text-gray-900">
                      {pergunta.enunciado}
                    </h2>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {pergunta.alternativas.map(
                    (alternativa, alternativaIndice) => {
                      const seleccionada =
                        respostaSeleccionada ===
                        alternativa.id;

                      return (
                        <button
                          key={alternativa.id}
                          type="button"
                          disabled={enviando}
                          onClick={() =>
                            seleccionarResposta(
                              pergunta.id,
                              alternativa.id
                            )
                          }
                          className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                            seleccionada
                              ? "border-blue-700 bg-blue-50 ring-2 ring-blue-100"
                              : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                          } ${
                            enviando
                              ? "cursor-not-allowed opacity-70"
                              : ""
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                              seleccionada
                                ? "bg-blue-900 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {String.fromCharCode(
                              65 + alternativaIndice
                            )}
                          </span>

                          <span className="pt-1 text-sm leading-6 text-gray-700">
                            {alternativa.texto}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-blue-950">
                Terminou de responder?
              </h2>

              <p className="mt-1 text-sm text-blue-800">
                O resultado será calculado automaticamente
                depois de submeter o diagnóstico.
              </p>
            </div>

            <button
              type="button"
              onClick={submeterDiagnostico}
              disabled={
                enviando ||
                respondidas !== perguntas.length
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando
                ? "A calcular resultado..."
                : "Concluir diagnóstico"}
              {!enviando && (
                <FaChevronRight className="text-xs" />
              )}
            </button>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-gray-400">
          Este diagnóstico é opcional e não impede o acesso
          aos conteúdos do SICSI.
        </p>
      </div>
    </main>
  );
}
