import { notFound, redirect } from "next/navigation";

import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

import SimulacaoCliente from "./SimulacaoCliente";

type Props = {
  params: Promise<{
    id: string;
  }>;
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

export default async function SimulacaoPage({ params }: Props) {
  const { id } = await params;
  const simulacaoId = Number(id);

  if (!Number.isInteger(simulacaoId) || simulacaoId <= 0) {
    notFound();
  }

  const supabase = await criarClienteSupabaseServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil, error: erroPerfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (erroPerfil || !perfil || perfil.papel !== "ESTUDANTE") {
    redirect("/dashboard");
  }

  const { data: simulacao, error: erroSimulacao } = await supabase
    .from("simulacoes")
    .select(`
      id,
      modulo_id,
      titulo,
      descricao,
      nivel
    `)
    .eq("id", simulacaoId)
    .single();

  if (erroSimulacao || !simulacao) {
    notFound();
  }

  const { data: modulo, error: erroModulo } = await supabase
    .from("modulos")
    .select("id, curso_id")
    .eq("id", simulacao.modulo_id)
    .single();

  if (erroModulo || !modulo) {
    notFound();
  }

  const cursoId = Number(modulo.curso_id);

  const { data: questionario, error: erroQuestionario } = await supabase
    .from("questionarios")
    .select(`
      id,
      modulo_id,
      titulo,
      descricao,
      pontuacao_minima
    `)
    .eq("modulo_id", simulacao.modulo_id)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (erroQuestionario) {
    console.error(
      "Erro ao carregar questionário:",
      erroQuestionario.message
    );
  }

  if (!questionario) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
            <h1 className="text-2xl font-bold text-amber-900">
              Questionário indisponível
            </h1>
            <p className="mt-3 text-sm leading-6 text-amber-800">
              Esta simulação ainda não possui um questionário associado ao seu módulo.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { data: perguntas, error: erroPerguntas } = await supabase
    .from("perguntas")
    .select(`
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
    `)
    .eq("questionario_id", questionario.id)
    .order("ordem", { ascending: true });

  if (erroPerguntas) {
    console.error("Erro ao carregar perguntas:", erroPerguntas.message);

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
            <h1 className="text-2xl font-bold text-red-900">
              Não foi possível carregar a simulação
            </h1>
            <p className="mt-3 text-sm leading-6 text-red-800">
              Ocorreu um problema ao carregar as perguntas. Tente novamente mais tarde.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * IMPORTANTE:
   * Se o estudante já concluiu esta simulação, não criamos uma nova tentativa.
   * Carregamos o último resultado concluído e entregamo-lo ao componente cliente.
   */
  const { data: resultadoConcluido, error: erroResultado } = await supabase
    .from("simulacoes_utilizador")
    .select(`
      id,
      tentativa,
      pontuacao,
      total_perguntas,
      respostas_correctas,
      aprovado,
      concluido,
      concluido_em
    `)
    .eq("utilizador_id", user.id)
    .eq("simulacao_id", simulacao.id)
    .eq("concluido", true)
    .order("tentativa", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (erroResultado) {
    console.error(
      "Erro ao carregar resultado anterior da simulação:",
      erroResultado.message
    );
  }

  const listaPerguntas = (perguntas ?? []).map((pergunta) => ({
    id: pergunta.id,
    questionario_id: pergunta.questionario_id,
    enunciado: pergunta.enunciado,
    ordem: pergunta.ordem,
    alternativas: (pergunta.alternativas ?? []).map((alternativa) => ({
      id: alternativa.id,
      pergunta_id: alternativa.pergunta_id,
      texto: alternativa.texto,
      correta: alternativa.correta,
    })),
  }));

  return (
    <SimulacaoCliente
      simulacao={{
        id: simulacao.id,
        modulo_id: simulacao.modulo_id,
        titulo: simulacao.titulo,
        descricao: simulacao.descricao ?? "",
        nivel: simulacao.nivel ?? "",
      }}
      questionario={{
        id: questionario.id,
        modulo_id: questionario.modulo_id,
        titulo: questionario.titulo,
        descricao: questionario.descricao ?? "",
        pontuacao_minima: questionario.pontuacao_minima ?? 0,
      }}
      perguntas={listaPerguntas}
      cursoId={cursoId}
      resultadoInicial={(resultadoConcluido ?? null) as ResultadoInicial | null}
    />
  );
}