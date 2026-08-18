import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FaArrowRight,
  FaCheckCircle,
  FaLock,
  FaPlayCircle,
  FaShieldAlt,
} from "react-icons/fa";

import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

type Simulacao = {
  id: number;
  modulo_id: number;
  titulo: string;
  descricao: string;
  nivel: string;
  criado_em: string | null;
  modulo?: {
    id: number;
    titulo: string;
    curso_id: number;
  } | null;
};

type Props = {
  searchParams: Promise<{
    curso?: string;
  }>;
};

function obterClasseNivel(nivel: string) {
  const valor = nivel
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (valor === "FACIL") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  }

  if (valor === "MEDIO") {
    return "bg-amber-50 text-amber-700 border border-amber-100";
  }

  if (valor === "DIFICIL") {
    return "bg-red-50 text-red-700 border border-red-100";
  }

  return "bg-slate-50 text-slate-600 border border-slate-100";
}

function obterNomeNivel(nivel: string) {
  const valor = nivel
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (valor === "FACIL") {
    return "Fácil";
  }

  if (valor === "MEDIO") {
    return "Médio";
  }

  if (valor === "DIFICIL") {
    return "Difícil";
  }

  return nivel;
}

export default async function SimulacoesPage({
  searchParams,
}: Props) {
  const parametros = await searchParams;

  const cursoId = parametros.curso
    ? Number(parametros.curso)
    : null;

  if (
    parametros.curso &&
    (!Number.isInteger(cursoId) || cursoId! <= 0)
  ) {
    redirect("/dashboard/simulacoes");
  }

  const supabase =
    await criarClienteSupabaseServidor();

  /*
   * ============================================================
   * 1. UTILIZADOR AUTENTICADO
   * ============================================================
   */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /*
   * ============================================================
   * 2. VERIFICAR PERFIL
   * ============================================================
   */

  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (!perfil || perfil.papel !== "ESTUDANTE") {
    redirect("/dashboard");
  }

  /*
   * ============================================================
   * 3. CARREGAR SIMULAÇÕES
   * ============================================================
   */

  let consulta = supabase
    .from("simulacoes")
    .select(`
      id,
      modulo_id,
      titulo,
      descricao,
      nivel,
      criado_em,
      modulos!inner (
        id,
        titulo,
        curso_id
      )
    `)
    .order("criado_em", {
      ascending: false,
    });

  if (cursoId) {
    consulta = consulta.eq(
      "modulos.curso_id",
      cursoId
    );
  }

  const {
    data: simulacoes,
    error: erroSimulacoes,
  } = await consulta;

  if (erroSimulacoes) {
    console.error(
      "Erro ao carregar simulações:",
      erroSimulacoes.message
    );
  }

  const listaSimulacoes =
    (simulacoes ?? []) as unknown as Simulacao[];

  /*
   * ============================================================
   * 4. INTERFACE
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-10">

        {/* ====================================================
            CABEÇALHO
        ==================================================== */}

        <section className="overflow-hidden rounded-3xl bg-blue-950 shadow-xl">
          <div className="relative px-6 py-8 sm:px-8 sm:py-10 lg:px-10">

            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-800/40 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-blue-700/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl text-blue-950 shadow-lg sm:h-20 sm:w-20">
                  <FaShieldAlt />
                </div>

                <div>
                  <p className="mb-1 text-sm font-medium text-blue-200">
                    Área do estudante
                  </p>

                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Simulações
                  </h1>

                  <p className="mt-1 text-sm text-blue-100 sm:text-base">
                    Pratique a identificação de riscos e tome decisões seguras.
                  </p>
                </div>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-200">
                  Disponíveis
                </p>

                <p className="mt-1 text-2xl font-bold text-white">
                  {listaSimulacoes.length}
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ====================================================
            INTRODUÇÃO
        ==================================================== */}

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Simulações de cibersegurança
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Teste os seus conhecimentos através de
              cenários práticos de segurança da informação.
            </p>
          </div>
        </section>

        {/* ====================================================
            ERRO
        ==================================================== */}

        {erroSimulacoes && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span className="mt-0.5 font-bold">
              !
            </span>

            <p>
              Não foi possível carregar as simulações.
              Tente actualizar a página.
            </p>
          </div>
        )}

        {/* ====================================================
            SEM SIMULAÇÕES
        ==================================================== */}

        {!erroSimulacoes &&
          listaSimulacoes.length === 0 && (
            <section className="rounded-3xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-700">
                <FaShieldAlt />
              </div>

              <h2 className="mt-5 text-xl font-bold text-gray-900">
                Nenhuma simulação disponível
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Ainda não existem simulações disponíveis
                para este curso.
              </p>

              <Link
                href="/dashboard/cursos"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900"
              >
                Voltar aos cursos
                <FaArrowRight className="text-xs" />
              </Link>

            </section>
          )}

        {/* ====================================================
            LISTA
        ==================================================== */}

        {listaSimulacoes.length > 0 && (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

            {listaSimulacoes.map(
              (simulacao, indice) => (
                <article
                  key={simulacao.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >

                  {/* TOPO */}

                  <div className="border-b border-gray-100 bg-blue-950 p-6 text-white">

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl">
                        <FaShieldAlt />
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${obterClasseNivel(
                          simulacao.nivel
                        )}`}
                      >
                        {obterNomeNivel(
                          simulacao.nivel
                        )}
                      </span>

                    </div>

                    <div className="mt-5 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white">
                        {indice + 1}
                      </span>

                      <span className="text-xs font-medium text-blue-200">
                        Simulação
                      </span>
                    </div>

                    <h2 className="mt-3 text-xl font-bold leading-7">
                      {simulacao.titulo}
                    </h2>

                  </div>

                  {/* CONTEÚDO */}

                  <div className="flex flex-1 flex-col p-6">

                    {simulacao.modulo && (
                      <div className="mb-4">

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Módulo
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-700">
                          {simulacao.modulo.titulo}
                        </p>

                      </div>
                    )}

                    <p className="flex-1 text-sm leading-6 text-gray-500">
                      {simulacao.descricao}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">

                      <div>

                        <p className="text-xs text-gray-400">
                          Simulação
                        </p>

                        <p className="mt-1 text-2xl font-bold text-blue-900">
                          {indice + 1}
                        </p>

                      </div>

                      <Link
                        href={`/dashboard/simulacoes/${simulacao.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900"
                      >
                        Iniciar

                        <FaArrowRight className="text-xs" />
                      </Link>

                    </div>

                  </div>

                </article>
              )
            )}

          </section>
        )}

        {/* ====================================================
            INFORMAÇÃO
        ==================================================== */}

        <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">

          <div className="flex gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
              <FaShieldAlt />
            </div>

            <div>

              <h2 className="font-semibold text-blue-900">
                Aprenda praticando
              </h2>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                As simulações apresentam situações
                relacionadas com ameaças de cibersegurança,
                permitindo desenvolver a capacidade de
                identificar riscos e tomar decisões seguras.
              </p>

            </div>

          </div>

        </section>

        <div className="pb-4 pt-6 text-center text-xs text-gray-400">
          SICSI · Sistema de Consciencialização em Segurança da Informação
        </div>

      </div>
    </main>
  );
}