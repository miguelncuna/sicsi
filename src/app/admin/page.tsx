"use client";

import { useEffect, useState } from "react";
import { criarClienteSupabase } from "@/lib/supabase/client";

import {
  FaBook,
  FaUsers,
  FaCertificate,
  FaComments,
  FaArrowRight,
  FaShieldAlt,
  FaExclamationTriangle,
} from "react-icons/fa";

interface PerfilAdministrador {
  id: string;
  nome_completo: string;
  email: string;
  papel: string;
}

interface Indicador {
  titulo: string;
  valor: number;
  descricao: string;
  icon: React.ReactNode;
  iconClass: string;
  bgClass: string;
}

export default function AdminPage() {
  const [perfil, setPerfil] =
    useState<PerfilAdministrador | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState<string | null>(null);

  const [totalCursos, setTotalCursos] =
    useState(0);

  const [totalEstudantes, setTotalEstudantes] =
    useState(0);

  const [totalCertificados, setTotalCertificados] =
    useState(0);

  const [totalFeedbacks, setTotalFeedbacks] =
    useState(0);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        setCarregando(true);
        setErro(null);

        const supabase =
          criarClienteSupabase();

        /*
         * ============================================================
         * UTILIZADOR AUTENTICADO
         * ============================================================
         */

        const {
          data: { user },
          error: erroUtilizador,
        } = await supabase.auth.getUser();

        if (erroUtilizador || !user) {
          throw new Error(
            "Não foi possível identificar o administrador autenticado."
          );
        }

        /*
         * ============================================================
         * PERFIL DO ADMINISTRADOR
         * ============================================================
         */

        const {
          data: perfilData,
          error: erroPerfil,
        } = await supabase
          .from("perfis")
          .select(
            "id, nome_completo, email, papel"
          )
          .eq("id", user.id)
          .single();

        if (erroPerfil || !perfilData) {
          throw new Error(
            `Não foi possível carregar o perfil do administrador${
              erroPerfil?.message
                ? `: ${erroPerfil.message}`
                : "."
            }`
          );
        }

        if (perfilData.papel !== "ADMIN") {
          throw new Error(
            "O utilizador autenticado não possui permissões de administrador."
          );
        }

        setPerfil(perfilData);

        /*
         * ============================================================
         * CONSULTAS
         * ============================================================
         */

        const [
          resultadoCursos,
          resultadoEstudantes,
          resultadoCertificados,
          resultadoFeedbacks,
        ] = await Promise.all([
          supabase
            .from("cursos")
            .select("*", {
              count: "exact",
              head: true,
            }),

          supabase
            .from("perfis")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("papel", "ESTUDANTE"),

          supabase
            .from("certificados")
            .select("*", {
              count: "exact",
              head: true,
            }),

          supabase
            .from("feedbacks")
            .select("*", {
              count: "exact",
              head: true,
            }),
        ]);

        /*
         * ============================================================
         * RESULTADOS
         * ============================================================
         */

        if (resultadoCursos.error) {
          console.error(
            "Erro ao contar cursos:",
            resultadoCursos.error.message
          );
        }

        if (resultadoEstudantes.error) {
          console.error(
            "Erro ao contar estudantes:",
            resultadoEstudantes.error.message
          );
        }

        if (resultadoCertificados.error) {
          console.error(
            "Erro ao contar certificados:",
            resultadoCertificados.error.message
          );
        }

        if (resultadoFeedbacks.error) {
          console.error(
            "Erro ao contar feedbacks:",
            resultadoFeedbacks.error.message
          );
        }

        setTotalCursos(
          resultadoCursos.count ?? 0
        );

        setTotalEstudantes(
          resultadoEstudantes.count ?? 0
        );

        setTotalCertificados(
          resultadoCertificados.count ?? 0
        );

        setTotalFeedbacks(
          resultadoFeedbacks.count ?? 0
        );
      } catch (erro) {
        console.error(
          "Erro ao carregar Dashboard:",
          erro
        );

        setErro(
          erro instanceof Error
            ? erro.message
            : "Ocorreu um erro ao carregar o painel administrativo."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDashboard();
  }, []);

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (carregando) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4">
        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-900" />

          <p className="mt-4 text-sm text-gray-500">
            A carregar o painel administrativo...
          </p>

        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * ERRO
   * ============================================================
   */

  if (erro) {
    return (
      <div className="w-full px-4 py-4 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-8">

          <div className="flex flex-col gap-4 sm:flex-row">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <FaExclamationTriangle />
            </div>

            <div className="min-w-0">

              <h1 className="text-lg font-bold text-red-800 sm:text-xl">
                Não foi possível carregar o painel
              </h1>

              <p className="mt-2 break-words text-sm leading-6 text-red-700">
                {erro}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-[0.98]"
              >
                Tentar novamente
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }

  const nomeAdministrador =
    perfil?.nome_completo?.trim() ||
    "Administrador";

  const indicadores: Indicador[] = [
    {
      titulo: "Cursos",
      valor: totalCursos,
      descricao: "Cursos registados",
      icon: <FaBook />,
      iconClass: "text-blue-700",
      bgClass: "bg-blue-50",
    },
    {
      titulo: "Estudantes",
      valor: totalEstudantes,
      descricao: "Estudantes registados",
      icon: <FaUsers />,
      iconClass: "text-emerald-700",
      bgClass: "bg-emerald-50",
    },
    {
      titulo: "Certificados",
      valor: totalCertificados,
      descricao: "Certificados emitidos",
      icon: <FaCertificate />,
      iconClass: "text-violet-700",
      bgClass: "bg-violet-50",
    },
    {
      titulo: "Feedbacks",
      valor: totalFeedbacks,
      descricao: "Feedbacks recebidos",
      icon: <FaComments />,
      iconClass: "text-rose-700",
      bgClass: "bg-rose-50",
    },
  ];

  /*
   * ============================================================
   * DASHBOARD
   * ============================================================
   */

  return (
    <main className="min-w-0 w-full overflow-x-hidden bg-gray-50/70">

      <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6 md:px-6 lg:px-8 xl:px-10">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 shadow-lg sm:rounded-3xl">

          {/* Elementos decorativos */}

          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl sm:h-64 sm:w-64" />

          <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl sm:h-64 sm:w-64" />

          <div className="relative p-5 sm:p-7 md:p-8 lg:p-10">

            <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">

              {/* TEXTO */}

              <div className="min-w-0">

                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100 backdrop-blur-sm">

                  <FaShieldAlt className="text-blue-200" />

                  <span>
                    Administração SICSI
                  </span>

                </div>

                <h1 className="max-w-3xl text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[2.65rem]">

                  Olá, {nomeAdministrador}! 👋

                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">

                  Bem-vindo ao centro de controlo do
                  SICSI. Acompanhe os principais
                  indicadores e mantenha a plataforma
                  sob controlo.

                </p>

              </div>

              {/* CONTA */}

              <div className="w-full shrink-0 xl:max-w-xs">

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md sm:p-5">

                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-200">
                    Conta
                  </p>

                  <p className="mt-2 break-all text-sm font-semibold text-white sm:text-base">
                    {perfil?.email}
                  </p>

                  <div className="mt-3 flex items-center gap-2">

                    <span className="h-2 w-2 rounded-full bg-emerald-400" />

                    <span className="text-xs text-blue-100">
                      Administrador activo
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ======================================================
            INDICADORES
        ====================================================== */}

        <section className="mt-6 sm:mt-8">

          <div className="mb-4 flex flex-col gap-1 sm:mb-5">

            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Visão geral
            </h2>

            <p className="text-sm text-gray-500">
              Indicadores principais da plataforma.
            </p>

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {indicadores.map(
              (indicador) => (
                <article
                  key={indicador.titulo}
                  className="group min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${indicador.bgClass} ${indicador.iconClass} text-lg`}
                    >
                      {indicador.icon}
                    </div>

                    <FaArrowRight
                      className="mt-1 text-sm text-gray-300 transition group-hover:translate-x-1 group-hover:text-gray-500"
                    />

                  </div>

                  <div className="mt-5">

                    <p className="text-sm font-medium text-gray-500">
                      {indicador.titulo}
                    </p>

                    <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                      {indicador.valor}
                    </p>

                    <p className="mt-2 text-xs text-gray-400 sm:text-sm">
                      {indicador.descricao}
                    </p>

                  </div>

                </article>
              )
            )}

          </div>

        </section>

        {/* ======================================================
            BLOCO INFORMATIVO
        ====================================================== */}

        <section className="mt-6 sm:mt-8">

          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">

            <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:justify-between md:p-7">

              <div className="flex min-w-0 items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                  <FaShieldAlt />
                </div>

                <div className="min-w-0">

                  <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                    Centro de controlo
                  </h3>

                  <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
                    Utilize o menu administrativo para
                    gerir os conteúdos, cursos,
                    estudantes, simulações e restantes
                    recursos do SICSI.
                  </p>

                </div>

              </div>

              <div className="hidden shrink-0 md:block">

                <div className="rounded-xl bg-gray-50 px-4 py-3 text-right">

                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Estado
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-600">
                    Sistema activo
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}