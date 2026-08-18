"use client";

import { useMemo, useState } from "react";

import { criarClienteSupabase } from "@/lib/supabase/client";

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

type Simulacao = {
  id: number;
  modulo_id: number;
  titulo: string;
  descricao: string;
  nivel: string;
};

type Questionario = {
  id: number;
  modulo_id: number;
  titulo: string;
  descricao: string;
  pontuacao_minima: number;
};

type ResultadoInicial = {
  id: number;
  tentativa: number | null;
  pontuacao: number | null;
  total_perguntas: number | null;
  respostas_correctas: number | null;
  aprovado: boolean | null;
  concluido: boolean | null;
  concluido_em: string | null;
};

type Props = {
  simulacao: Simulacao;
  questionario: Questionario;
  perguntas: Pergunta[];
  cursoId: number;
  resultadoInicial: ResultadoInicial | null;
};

export default function SimulacaoCliente({
  simulacao,
  questionario,
  perguntas,
  cursoId,
  resultadoInicial,
}: Props) {
  const simulacaoJaConcluida = resultadoInicial?.concluido === true;

  const [perguntaActual, setPerguntaActual] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [finalizado, setFinalizado] = useState(simulacaoJaConcluida);
  const [pontuacao, setPontuacao] = useState(
    Number(resultadoInicial?.pontuacao ?? 0)
  );
  const [aGuardar, setAGuardar] = useState(false);
  const [erroGravacao, setErroGravacao] = useState<string | null>(null);

  const pergunta = perguntas[perguntaActual];

  const progresso = useMemo(() => {
    if (perguntas.length === 0) return 0;
    return Math.round(((perguntaActual + 1) / perguntas.length) * 100);
  }, [perguntaActual, perguntas.length]);

  function seleccionarResposta(alternativaId: number) {
    if (finalizado || !pergunta || aGuardar) return;

    setRespostas((estadoAnterior) => ({
      ...estadoAnterior,
      [pergunta.id]: alternativaId,
    }));
  }

  function avancar() {
    if (
      perguntaActual < perguntas.length - 1 &&
      respostas[pergunta?.id]
    ) {
      setPerguntaActual((valor) => valor + 1);
    }
  }

  function voltar() {
    if (perguntaActual > 0 && !aGuardar) {
      setPerguntaActual((valor) => valor - 1);
    }
  }

  async function finalizar() {
    if (!pergunta || aGuardar) return;

    const respondeuTudo = perguntas.every((item) => respostas[item.id]);

    if (!respondeuTudo) return;

    setAGuardar(true);
    setErroGravacao(null);

    try {
      const supabase = criarClienteSupabase();

      const {
        data: { user },
        error: erroUtilizador,
      } = await supabase.auth.getUser();

      if (erroUtilizador || !user) {
        throw new Error(
          "Não foi possível identificar o utilizador autenticado."
        );
      }

      let respostasCorrectas = 0;

      perguntas.forEach((item) => {
        const alternativaCorrecta = item.alternativas.find(
          (alternativa) => alternativa.correta
        );

        if (
          alternativaCorrecta &&
          respostas[item.id] === alternativaCorrecta.id
        ) {
          respostasCorrectas++;
        }
      });

      const resultado =
        perguntas.length > 0
          ? Math.round((respostasCorrectas / perguntas.length) * 100)
          : 0;

      const aprovado = resultado >= questionario.pontuacao_minima;

      const { data: tentativasAnteriores, error: erroTentativas } =
        await supabase
          .from("simulacoes_utilizador")
          .select("tentativa")
          .eq("utilizador_id", user.id)
          .eq("simulacao_id", simulacao.id)
          .order("tentativa", { ascending: false })
          .limit(1);

      if (erroTentativas) {
        throw new Error(
          `Erro ao consultar tentativas anteriores: ${erroTentativas.message}`
        );
      }

      const ultimaTentativa = Number(
        tentativasAnteriores?.[0]?.tentativa ?? 0
      );
      const novaTentativa = ultimaTentativa + 1;

      const { data: resultadoSimulacao, error: erroResultado } =
        await supabase
          .from("simulacoes_utilizador")
          .insert({
            utilizador_id: user.id,
            simulacao_id: simulacao.id,
            pontuacao: resultado,
            total_perguntas: perguntas.length,
            respostas_correctas: respostasCorrectas,
            aprovado,
            concluido: true,
            tentativa: novaTentativa,
            iniciado_em: new Date().toISOString(),
            concluido_em: new Date().toISOString(),
          })
          .select("id")
          .single();

      if (erroResultado || !resultadoSimulacao) {
        throw new Error(
          `Erro ao guardar a simulação: ${
            erroResultado?.message ?? "O resultado não foi criado."
          }`
        );
      }

      setPontuacao(resultado);
      setFinalizado(true);
    } catch (erro) {
      console.error("Erro ao finalizar simulação:", erro);
      setErroGravacao(
        erro instanceof Error
          ? erro.message
          : "Ocorreu um erro ao guardar a simulação."
      );
    } finally {
      setAGuardar(false);
    }
  }

  function voltarParaCurso() {
    window.location.href = `/dashboard/cursos/${cursoId}`;
  }

  function voltarParaSimulacoes() {
    window.location.href = `/dashboard/simulacoes?curso=${cursoId}`;
  }

  if (perguntas.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
              🛡️
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Simulação sem perguntas
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Esta simulação ainda não possui perguntas disponíveis.
            </p>
            <button
              type="button"
              onClick={voltarParaCurso}
              className="mt-8 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Voltar ao curso
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (finalizado) {
    const aprovou =
      resultadoInicial?.aprovado === true ||
      pontuacao >= questionario.pontuacao_minima;

    const respostasCorrectas =
      Number(resultadoInicial?.respostas_correctas ?? 0) ||
      perguntas.filter((item) => {
        const resposta = respostas[item.id];
        return item.alternativas.some(
          (alternativa) =>
            alternativa.id === resposta && alternativa.correta
        );
      }).length;

    const totalPerguntas =
      Number(resultadoInicial?.total_perguntas ?? perguntas.length) ||
      perguntas.length;

    const tentativa = resultadoInicial?.tentativa ?? null;

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div
              className={`px-6 py-12 text-center text-white sm:px-10 ${
                aprovou
                  ? "bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950"
                  : "bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950"
              }`}
            >
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
                  aprovou ? "bg-white/20" : "bg-white/20"
                }`}
              >
                {aprovou ? "✓" : "!"}
              </div>

              <p className="mt-6 text-sm font-medium text-white/80">
                Resultado da simulação
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {aprovou
                  ? "Simulação concluída com sucesso"
                  : "Simulação concluída"}
              </h1>

              <p className="mt-3 text-white/80">{simulacao.titulo}</p>
            </div>

            <div className="p-6 sm:p-10">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <p className="text-sm text-slate-500">Pontuação</p>
                  <p className="mt-2 text-4xl font-bold text-slate-900">
                    {pontuacao}%
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <p className="text-sm text-slate-500">
                    Respostas correctas
                  </p>
                  <p className="mt-2 text-4xl font-bold text-slate-900">
                    {respostasCorrectas}/{totalPerguntas}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <p className="text-sm text-slate-500">Mínimo exigido</p>
                  <p className="mt-2 text-4xl font-bold text-slate-900">
                    {questionario.pontuacao_minima}%
                  </p>
                </div>
              </div>

              <div
                className={`mt-8 rounded-2xl border p-5 ${
                  aprovou
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <h2
                  className={`font-bold ${
                    aprovou ? "text-emerald-900" : "text-amber-900"
                  }`}
                >
                  {aprovou ? "Excelente trabalho!" : "Continue a praticar!"}
                </h2>

                <p
                  className={`mt-1 text-sm leading-6 ${
                    aprovou ? "text-emerald-800" : "text-amber-800"
                  }`}
                >
                  {aprovou
                    ? "A simulação foi concluída e o seu resultado foi guardado."
                    : "A simulação foi concluída, mas a pontuação mínima não foi atingida."}
                </p>

                {tentativa !== null && (
                  <p className="mt-2 text-xs font-medium text-slate-600">
                    Tentativa {tentativa} · Resultado guardado no seu progresso.
                  </p>
                )}
              </div>

              {aprovou && (
                <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <h2 className="font-bold text-blue-900">
                    Próximo passo
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    A simulação já foi concluída. Volte ao curso para acompanhar
                    o desbloqueio da certificação.
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={voltarParaCurso}
                  className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Voltar ao curso
                </button>
                <button
                  type="button"
                  onClick={voltarParaSimulacoes}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Ver simulações
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const respostaSeleccionada = pergunta
    ? respostas[pergunta.id]
    : undefined;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              Simulação
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {simulacao.nivel}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {simulacao.titulo}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            {simulacao.descricao}
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-700">
              Pergunta {perguntaActual + 1} de {perguntas.length}
            </span>
            <span className="text-sm font-medium text-slate-500">
              {progresso}%
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {erroGravacao && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">
              Não foi possível guardar a simulação.
            </p>
            <p className="mt-1 text-sm leading-6 text-red-800">
              {erroGravacao}
            </p>
          </div>
        )}

        {pergunta && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Questão {pergunta.ordem}
              </p>
              <h2 className="mt-3 text-xl font-semibold leading-8 text-slate-900 sm:text-2xl">
                {pergunta.enunciado}
              </h2>
            </div>

            <div className="space-y-3">
              {pergunta.alternativas.map((alternativa, indice) => {
                const seleccionada =
                  respostaSeleccionada === alternativa.id;

                return (
                  <button
                    key={alternativa.id}
                    type="button"
                    onClick={() => seleccionarResposta(alternativa.id)}
                    disabled={aGuardar}
                    className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                      seleccionada
                        ? "border-slate-900 bg-slate-900 text-white shadow-md"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        seleccionada
                          ? "bg-white text-slate-900"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {String.fromCharCode(65 + indice)}
                    </span>
                    <span className="pt-1 text-sm leading-6">
                      {alternativa.texto}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={voltar}
                disabled={perguntaActual === 0 || aGuardar}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Anterior
              </button>

              {perguntaActual === perguntas.length - 1 ? (
                <button
                  type="button"
                  onClick={finalizar}
                  disabled={!respostaSeleccionada || aGuardar}
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {aGuardar ? "A guardar..." : "Finalizar simulação"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={avancar}
                  disabled={!respostaSeleccionada || aGuardar}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima →
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}