"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { criarClienteSupabase } from "@/lib/supabase/client";

import {
  FaArrowRight,
  FaBookOpen,
  FaCertificate,
  FaChartLine,
  FaClipboardCheck,
  FaGraduationCap,
  FaUserGraduate,
} from "react-icons/fa";

interface Perfil {
  id: string;
  nome_completo: string;
  email: string;
  papel: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [cursosInscritos, setCursosInscritos] = useState(0);
  const [avaliacoes, setAvaliacoes] = useState(0);
  const [certificados, setCertificados] = useState(0);
  const [progresso, setProgresso] = useState(0);

  /*
   * ============================================================
   * CARREGAR DADOS DO ESTUDANTE
   * ============================================================
   */

  useEffect(() => {
    async function carregarDados() {
      const supabase = criarClienteSupabase();

      try {
        /*
         * --------------------------------------------------------
         * UTILIZADOR AUTENTICADO
         * --------------------------------------------------------
         */

        const {
          data: { user },
          error: erroUtilizador,
        } = await supabase.auth.getUser();

        if (erroUtilizador || !user) {
          router.replace("/login");
          return;
        }

        /*
         * --------------------------------------------------------
         * PERFIL
         * --------------------------------------------------------
         */

        const {
          data: perfilData,
          error: perfilError,
        } = await supabase
          .from("perfis")
          .select("id, nome_completo, email, papel")
          .eq("id", user.id)
          .single();

        if (perfilError || !perfilData) {
          console.error(
            "Erro ao carregar perfil:",
            perfilError?.message
          );

          router.replace("/login");
          return;
        }

        /*
         * --------------------------------------------------------
         * SEGURANÇA ADICIONAL
         * --------------------------------------------------------
         */

        if (perfilData.papel === "ADMIN") {
          router.replace("/admin");
          return;
        }

        if (perfilData.papel !== "ESTUDANTE") {
          router.replace("/login");
          return;
        }

        setPerfil(perfilData);

        /*
         * --------------------------------------------------------
         * CURSOS INSCRITOS
         * --------------------------------------------------------
         */

        const {
          count: totalCursos,
          error: cursosError,
        } = await supabase
          .from("inscricoes")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("utilizador_id", user.id);

        if (cursosError) {
          console.error(
            "Erro ao carregar cursos:",
            cursosError.message
          );
        }

        setCursosInscritos(totalCursos || 0);

        /*
         * --------------------------------------------------------
         * CERTIFICADOS
         * --------------------------------------------------------
         */

        const {
          count: totalCertificados,
          error: certificadosError,
        } = await supabase
          .from("certificados")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("utilizador_id", user.id);

        if (certificadosError) {
          console.error(
            "Erro ao carregar certificados:",
            certificadosError.message
          );
        }

        setCertificados(totalCertificados || 0);

        /*
         * --------------------------------------------------------
         * AVALIAÇÕES REALIZADAS
         *
         * A tabela existente é mantida.
         * --------------------------------------------------------
         */

        const {
          data: avaliacoesData,
          error: avaliacoesError,
        } = await supabase
          .from("avaliacoes_utilizador")
          .select("questionario_id")
          .eq("utilizador_id", user.id);

        if (avaliacoesError) {
          console.error(
            "Erro ao carregar avaliações:",
            avaliacoesError.message
          );
        }

        /*
         * Cada questão/resposta individual pertence a um questionário.
         * Portanto, respostas_utilizador NÃO representam avaliações.
         *
         * Uma avaliação é contabilizada através de questionario_id
         * na tabela avaliacoes_utilizador.
         *
         * Se o estudante tiver várias tentativas do mesmo questionário,
         * o questionário continua a representar apenas uma avaliação
         * no Dashboard.
         */
        const questionariosRealizados = new Set(
          (avaliacoesData || [])
            .map((avaliacao) => avaliacao.questionario_id)
            .filter((id) => id !== null && id !== undefined)
        );

        setAvaliacoes(questionariosRealizados.size);

        /*
         * --------------------------------------------------------
         * PROGRESSO
         * --------------------------------------------------------
         */

        const {
          count: concluidos,
          error: progressoError,
        } = await supabase
          .from("progresso_utilizador")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("utilizador_id", user.id)
          .eq("concluido", true);

        if (progressoError) {
          console.error(
            "Erro ao carregar progresso:",
            progressoError.message
          );
        }

        const {
          count: totalConteudos,
          error: conteudosError,
        } = await supabase
          .from("conteudos")
          .select("*", {
            count: "exact",
            head: true,
          });

        if (conteudosError) {
          console.error(
            "Erro ao carregar conteúdos:",
            conteudosError.message
          );
        }

        const percentagem =
          totalConteudos && totalConteudos > 0
            ? Math.min(
                100,
                Math.round(
                  ((concluidos || 0) / totalConteudos) * 100
                )
              )
            : 0;

        setProgresso(percentagem);
      } catch (erro) {
        console.error(
          "Erro ao carregar dashboard:",
          erro
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [router]);

  /*
   * ============================================================
   * CARREGAMENTO
   * ============================================================
   */

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div
            className="
              mx-auto mb-4 h-10 w-10
              animate-spin rounded-full
              border-4 border-blue-100
              border-t-blue-800
            "
          />

          <p className="text-sm font-medium text-gray-500">
            A carregar o seu painel...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * DADOS VISUAIS
   * ============================================================
   */

  const nome =
    perfil?.nome_completo?.trim() || "Estudante";

  const primeiroNome =
    nome.split(" ")[0] || "Estudante";

  const iniciais =
    nome
      .split(" ")
      .filter(Boolean)
      .map((parte) => parte[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-10">

        {/* ====================================================
            CABEÇALHO
        ==================================================== */}

        <section
          className="
            overflow-hidden
            rounded-3xl
            bg-blue-950
            shadow-xl
          "
        >
          <div className="relative px-6 py-8 sm:px-8 sm:py-10 lg:px-10">

            <div
              className="
                pointer-events-none
                absolute -right-20 -top-20
                h-64 w-64
                rounded-full
                bg-blue-800/40
                blur-3xl
              "
            />

            <div
              className="
                pointer-events-none
                absolute -bottom-32 -left-20
                h-72 w-72
                rounded-full
                bg-blue-700/20
                blur-3xl
              "
            />

            <div
              className="
                relative
                flex flex-col gap-6
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >

              {/* Identificação */}

              <div className="flex items-center gap-4">

                <div
                  className="
                    flex h-16 w-16
                    shrink-0
                    items-center justify-center
                    rounded-2xl
                    bg-white
                    text-lg font-bold
                    text-blue-950
                    shadow-lg
                    sm:h-20 sm:w-20
                    sm:text-xl
                  "
                >
                  {iniciais}
                </div>

                <div>
                  <p className="mb-1 text-sm font-medium text-blue-200">
                    Área do estudante
                  </p>

                  <h1
                    className="
                      text-2xl font-bold
                      tracking-tight text-white
                      sm:text-3xl
                    "
                  >
                    Olá, {primeiroNome}! 👋
                  </h1>

                  <p className="mt-1 text-sm text-blue-100 sm:text-base">
                    Continue a sua aprendizagem em cibersegurança.
                  </p>
                </div>
              </div>

              {/* Botão */}

              <Link
                href="/dashboard/cursos"
                className="
                  inline-flex
                  w-full
                  items-center justify-center
                  gap-2
                  rounded-xl
                  bg-white
                  px-5 py-3
                  text-sm font-bold
                  text-blue-950
                  shadow-md
                  transition-all duration-200
                  hover:bg-blue-50
                  hover:shadow-lg
                  active:scale-[0.98]
                  sm:w-auto
                "
              >
                Ver meus cursos
                <FaArrowRight className="text-xs" />
              </Link>

            </div>
          </div>
        </section>

        {/* ====================================================
            ESTATÍSTICAS
        ==================================================== */}

        <section className="mt-8">

          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Visão geral
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Acompanhe o seu percurso no SICSI.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* Cursos */}

            <div
              className="
                rounded-2xl
                border border-gray-100
                bg-white
                p-5
                shadow-sm
                transition-all duration-200
                hover:-translate-y-0.5
                hover:shadow-md
              "
            >
              <div className="flex items-center justify-between">

                <div
                  className="
                    flex h-11 w-11
                    items-center justify-center
                    rounded-xl
                    bg-blue-50
                    text-blue-800
                  "
                >
                  <FaBookOpen />
                </div>

                <span className="text-2xl font-bold text-gray-900">
                  {cursosInscritos}
                </span>

              </div>

              <p className="mt-4 text-sm font-medium text-gray-500">
                Cursos inscritos
              </p>
            </div>

            {/* Progresso */}

            <div
              className="
                rounded-2xl
                border border-gray-100
                bg-white
                p-5
                shadow-sm
                transition-all duration-200
                hover:-translate-y-0.5
                hover:shadow-md
              "
            >
              <div className="flex items-center justify-between">

                <div
                  className="
                    flex h-11 w-11
                    items-center justify-center
                    rounded-xl
                    bg-indigo-50
                    text-indigo-700
                  "
                >
                  <FaChartLine />
                </div>

                <span className="text-2xl font-bold text-gray-900">
                  {progresso}%
                </span>

              </div>

              <p className="mt-4 text-sm font-medium text-gray-500">
                Progresso geral
              </p>
            </div>

            {/* Avaliações */}

            <div
              className="
                rounded-2xl
                border border-gray-100
                bg-white
                p-5
                shadow-sm
                transition-all duration-200
                hover:-translate-y-0.5
                hover:shadow-md
              "
            >
              <div className="flex items-center justify-between">

                <div
                  className="
                    flex h-11 w-11
                    items-center justify-center
                    rounded-xl
                    bg-amber-50
                    text-amber-600
                  "
                >
                  <FaClipboardCheck />
                </div>

                <span className="text-2xl font-bold text-gray-900">
                  {avaliacoes}
                </span>

              </div>

              <p className="mt-4 text-sm font-medium text-gray-500">
                Avaliações realizadas
              </p>
            </div>

            {/* Certificados */}

            <div
              className="
                rounded-2xl
                border border-gray-100
                bg-white
                p-5
                shadow-sm
                transition-all duration-200
                hover:-translate-y-0.5
                hover:shadow-md
              "
            >
              <div className="flex items-center justify-between">

                <div
                  className="
                    flex h-11 w-11
                    items-center justify-center
                    rounded-xl
                    bg-emerald-50
                    text-emerald-600
                  "
                >
                  <FaCertificate />
                </div>

                <span className="text-2xl font-bold text-gray-900">
                  {certificados}
                </span>

              </div>

              <p className="mt-4 text-sm font-medium text-gray-500">
                Certificados obtidos
              </p>
            </div>

          </div>
        </section>

        {/* ====================================================
            PROGRESSO
        ==================================================== */}

        <section className="mt-8">

          <div
            className="
              rounded-3xl
              border border-gray-100
              bg-white
              p-6
              shadow-sm
              sm:p-8
            "
          >

            <div
              className="
                flex flex-col gap-5
                sm:flex-row
                sm:items-start
                sm:justify-between
              "
            >

              <div className="flex items-start gap-4">

                <div
                  className="
                    flex h-12 w-12
                    shrink-0
                    items-center justify-center
                    rounded-xl
                    bg-blue-50
                    text-blue-800
                  "
                >
                  <FaGraduationCap />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    O seu progresso
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Acompanhe a evolução da sua aprendizagem.
                  </p>
                </div>

              </div>

              <span
                className="
                  text-2xl font-bold
                  text-blue-900
                "
              >
                {progresso}%
              </span>

            </div>

            {/* Barra */}

            <div className="mt-7">

              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">

                <div
                  className="
                    h-full
                    rounded-full
                    bg-blue-800
                    transition-all
                    duration-700
                  "
                  style={{
                    width: `${progresso}%`,
                  }}
                />

              </div>

              <div
                className="
                  mt-3
                  flex items-center justify-between
                  text-xs text-gray-500
                "
              >
                <span>
                  Início
                </span>

                <span>
                  {progresso === 100
                    ? "Percurso concluído"
                    : "Continue a avançar"}
                </span>

                <span>
                  100%
                </span>
              </div>

            </div>

          </div>
        </section>

        {/* ====================================================
            DIAGNÓSTICO DE CIBERSEGURANÇA
        ==================================================== */}

        <section className="mt-8">
          <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
            <div className="bg-blue-950 px-6 py-7 sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-950">
                    <FaClipboardCheck />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                      Diagnóstico recomendado
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-white">
                      Descubra o seu nível de cibersegurança
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                      Faça um breve teste com 5 perguntas para
                      avaliar os seus conhecimentos e receber uma
                      recomendação de aprendizagem personalizada.
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/diagnostico"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-md transition hover:bg-blue-50 hover:shadow-lg"
                >
                  Fazer diagnóstico
                  <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-3 px-6 py-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <span>
                5 perguntas · rápido · personalizado
              </span>

              <span className="font-medium text-gray-400">
                Opcional — pode continuar a estudar sem o realizar.
              </span>
            </div>
          </div>
        </section>
        {/* ====================================================
            ACESSOS RÁPIDOS
        ==================================================== */}

        <section className="mt-8">

          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Acesso rápido
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Aceda rapidamente às principais áreas da sua conta.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            {/* Cursos */}

            <Link
              href="/dashboard/cursos"
              className="
                group
                rounded-2xl
                border border-gray-100
                bg-white
                p-6
                shadow-sm
                transition-all duration-200
                hover:-translate-y-0.5
                hover:border-blue-100
                hover:shadow-md
              "
            >
              <div className="flex items-center justify-between">

                <div className="flex items-center gap-4">

                  <div
                    className="
                      flex h-12 w-12
                      items-center justify-center
                      rounded-xl
                      bg-blue-50
                      text-blue-800
                    "
                  >
                    <FaBookOpen />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Meus cursos
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Continue a sua formação.
                    </p>
                  </div>

                </div>

                <FaArrowRight
                  className="
                    text-sm text-gray-300
                    transition-transform duration-200
                    group-hover:translate-x-1
                    group-hover:text-blue-800
                  "
                />

              </div>
            </Link>

            {/* Certificados */}

            <Link
              href="/dashboard/certificados"
              className="
                group
                rounded-2xl
                border border-gray-100
                bg-white
                p-6
                shadow-sm
                transition-all duration-200
                hover:-translate-y-0.5
                hover:border-emerald-100
                hover:shadow-md
              "
            >
              <div className="flex items-center justify-between">

                <div className="flex items-center gap-4">

                  <div
                    className="
                      flex h-12 w-12
                      items-center justify-center
                      rounded-xl
                      bg-emerald-50
                      text-emerald-600
                    "
                  >
                    <FaCertificate />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Certificados
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Consulte as suas conquistas.
                    </p>
                  </div>

                </div>

                <FaArrowRight
                  className="
                    text-sm text-gray-300
                    transition-transform duration-200
                    group-hover:translate-x-1
                    group-hover:text-emerald-600
                  "
                />

              </div>
            </Link>

          </div>
        </section>

        {/* ====================================================
            RODAPÉ DO DASHBOARD
        ==================================================== */}

        <footer className="mt-10 border-t border-gray-200 pt-6 text-center">

          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-500">
            <FaUserGraduate className="text-blue-800" />
            SICSI
          </div>

          <p className="mt-1 text-xs text-gray-400">
            Sistema de Consciencialização em Segurança da Informação
          </p>

        </footer>

      </div>
    </main>
  );
}