"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { criarClienteSupabase } from "@/lib/supabase/client";

import {
  FaArrowRight,
  FaBookOpen,
  FaCheckCircle,
  FaClock,
  FaGraduationCap,
  FaLayerGroup,
  FaSearch,
  FaSpinner,
} from "react-icons/fa";

interface Curso {
  id: number;
  titulo: string;
  descricao: string;
  nivel: string;
}

interface Inscricao {
  curso_id: number;
}

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [inscrevendo, setInscrevendo] = useState<number | null>(null);

  const [pesquisa, setPesquisa] = useState("");
  const [filtro, setFiltro] = useState<
    "todos" | "inscritos" | "disponiveis"
  >("todos");

  /*
   * ============================================================
   * CARREGAR CURSOS E INSCRIÇÕES
   * ============================================================
   */

  useEffect(() => {
    async function carregarDados() {
      const supabase = criarClienteSupabase();

      try {
        /*
         * --------------------------------------------------------
         * UTILIZADOR
         * --------------------------------------------------------
         */

        const {
          data: { user },
          error: erroUtilizador,
        } = await supabase.auth.getUser();

        if (erroUtilizador || !user) {
          return;
        }

        /*
         * --------------------------------------------------------
         * CURSOS ACTIVOS
         * --------------------------------------------------------
         */

        const {
          data: cursosData,
          error: cursosError,
        } = await supabase
          .from("cursos")
          .select("id, titulo, descricao, nivel")
          .eq("ativo", true)
          .order("id", { ascending: true });

        if (cursosError) {
          console.error(
            "Erro ao carregar cursos:",
            cursosError.message
          );

          return;
        }

        /*
         * --------------------------------------------------------
         * INSCRIÇÕES DO ESTUDANTE
         * --------------------------------------------------------
         */

        const {
          data: inscricoesData,
          error: inscricoesError,
        } = await supabase
          .from("inscricoes")
          .select("curso_id")
          .eq("utilizador_id", user.id);

        if (inscricoesError) {
          console.error(
            "Erro ao carregar inscrições:",
            inscricoesError.message
          );
        }

        setCursos(cursosData || []);
        setInscricoes(inscricoesData || []);
      } catch (erro) {
        console.error(
          "Erro inesperado ao carregar cursos:",
          erro
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  /*
   * ============================================================
   * VERIFICAR INSCRIÇÃO
   * ============================================================
   */

  function estaInscrito(cursoId: number) {
    return inscricoes.some(
      (inscricao) =>
        inscricao.curso_id === cursoId
    );
  }

  /*
   * ============================================================
   * INSCRIÇÃO
   * ============================================================
   */

  async function inscrever(cursoId: number) {
    if (estaInscrito(cursoId)) {
      return;
    }

    setInscrevendo(cursoId);

    try {
      const supabase = criarClienteSupabase();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("A sua sessão terminou. Inicie sessão novamente.");
        return;
      }

      const { error } = await supabase
        .from("inscricoes")
        .insert({
          utilizador_id: user.id,
          curso_id: cursoId,
        });

      if (error) {
        console.error(
          "Erro ao efectuar inscrição:",
          error.message
        );

        alert(
          "Não foi possível efectuar a inscrição."
        );

        return;
      }

      /*
       * Actualizar estado local imediatamente.
       */

      setInscricoes((estadoAtual) => [
        ...estadoAtual,
        {
          curso_id: cursoId,
        },
      ]);
    } catch (erro) {
      console.error(
        "Erro inesperado ao efectuar inscrição:",
        erro
      );

      alert(
        "Ocorreu um erro ao efectuar a inscrição."
      );
    } finally {
      setInscrevendo(null);
    }
  }

  /*
   * ============================================================
   * FILTRAGEM
   * ============================================================
   */

  const cursosFiltrados = cursos.filter((curso) => {
    const correspondePesquisa =
      curso.titulo
        .toLowerCase()
        .includes(pesquisa.toLowerCase()) ||
      curso.descricao
        .toLowerCase()
        .includes(pesquisa.toLowerCase());

    if (!correspondePesquisa) {
      return false;
    }

    const inscrito = estaInscrito(curso.id);

    if (
      filtro === "inscritos" &&
      !inscrito
    ) {
      return false;
    }

    if (
      filtro === "disponiveis" &&
      inscrito
    ) {
      return false;
    }

    return true;
  });

  const totalInscritos = cursos.filter(
    (curso) => estaInscrito(curso.id)
  ).length;

  const totalDisponiveis =
    cursos.length - totalInscritos;

  /*
   * ============================================================
   * NÍVEL
   * ============================================================
   */

  function obterEstiloNivel(nivel: string) {
    const nivelNormalizado =
      nivel.toLowerCase();

    if (
      nivelNormalizado.includes("bás") ||
      nivelNormalizado.includes("bas")
    ) {
      return {
        fundo: "bg-emerald-50",
        texto: "text-emerald-700",
        borda: "border-emerald-100",
      };
    }

    if (
      nivelNormalizado.includes("inter")
    ) {
      return {
        fundo: "bg-amber-50",
        texto: "text-amber-700",
        borda: "border-amber-100",
      };
    }

    if (
      nivelNormalizado.includes("avan")
    ) {
      return {
        fundo: "bg-red-50",
        texto: "text-red-700",
        borda: "border-red-100",
      };
    }

    return {
      fundo: "bg-blue-50",
      texto: "text-blue-700",
      borda: "border-blue-100",
    };
  }

  /*
   * ============================================================
   * CARREGAMENTO
   * ============================================================
   */

  if (carregando) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4">

          <div className="text-center">

            <FaSpinner
              className="
                mx-auto
                animate-spin
                text-3xl
                text-blue-800
              "
            />

            <p className="mt-4 text-sm font-medium text-gray-500">
              A carregar os cursos...
            </p>

          </div>

        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-gray-50">

      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          px-4
          pb-12
          pt-20
          sm:px-6
          lg:px-8
          lg:pt-10
        "
      >

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
                absolute
                -right-20
                -top-20
                h-64
                w-64
                rounded-full
                bg-blue-800/40
                blur-3xl
              "
            />

            <div className="relative">

              <div className="flex items-start gap-4">

                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-white
                    text-blue-950
                    shadow-md
                  "
                >
                  <FaGraduationCap />
                </div>

                <div>
                  <p className="text-sm font-medium text-blue-200">
                    Área de aprendizagem
                  </p>

                  <h1
                    className="
                      mt-1
                      text-2xl
                      font-bold
                      tracking-tight
                      text-white
                      sm:text-3xl
                    "
                  >
                    Meus cursos
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
                    Explore os cursos disponíveis,
                    inscreva-se e continue a desenvolver
                    os seus conhecimentos em cibersegurança.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ====================================================
            ESTATÍSTICAS
        ==================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-50
                  text-blue-800
                "
              >
                <FaLayerGroup />
              </div>

              <span className="text-2xl font-bold text-gray-900">
                {cursos.length}
              </span>

            </div>

            <p className="mt-4 text-sm font-medium text-gray-500">
              Cursos disponíveis
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-indigo-50
                  text-indigo-700
                "
              >
                <FaBookOpen />
              </div>

              <span className="text-2xl font-bold text-gray-900">
                {totalInscritos}
              </span>

            </div>

            <p className="mt-4 text-sm font-medium text-gray-500">
              Meus cursos
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-emerald-50
                  text-emerald-600
                "
              >
                <FaCheckCircle />
              </div>

              <span className="text-2xl font-bold text-gray-900">
                {totalDisponiveis}
              </span>

            </div>

            <p className="mt-4 text-sm font-medium text-gray-500">
              Ainda disponíveis
            </p>
          </div>

        </section>

        {/* ====================================================
            PESQUISA + FILTROS
        ==================================================== */}

        <section className="mt-8">

          <div
            className="
              flex
              flex-col
              gap-4
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >

            {/* Pesquisa */}

            <div className="relative w-full lg:max-w-md">

              <FaSearch
                className="
                  pointer-events-none
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                type="search"
                value={pesquisa}
                onChange={(e) =>
                  setPesquisa(e.target.value)
                }
                placeholder="Pesquisar cursos..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  py-3
                  pl-11
                  pr-4
                  text-sm
                  text-gray-900
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-blue-600
                  focus:ring-4
                  focus:ring-blue-100
                "
              />

            </div>

            {/* Filtros */}

            <div
              className="
                flex
                w-full
                gap-2
                overflow-x-auto
                pb-1
                lg:w-auto
              "
            >

              <button
                type="button"
                onClick={() => setFiltro("todos")}
                className={`
                  shrink-0
                  rounded-xl
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  transition
                  ${
                    filtro === "todos"
                      ? "bg-blue-900 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                Todos
              </button>

              <button
                type="button"
                onClick={() =>
                  setFiltro("inscritos")
                }
                className={`
                  shrink-0
                  rounded-xl
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  transition
                  ${
                    filtro === "inscritos"
                      ? "bg-blue-900 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                Meus cursos
              </button>

              <button
                type="button"
                onClick={() =>
                  setFiltro("disponiveis")
                }
                className={`
                  shrink-0
                  rounded-xl
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  transition
                  ${
                    filtro === "disponiveis"
                      ? "bg-blue-900 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                Disponíveis
              </button>

            </div>

          </div>
        </section>

        {/* ====================================================
            LISTA DE CURSOS
        ==================================================== */}

        <section className="mt-6">

          {cursosFiltrados.length === 0 ? (

            <div
              className="
                rounded-3xl
                border
                border-gray-100
                bg-white
                px-6
                py-14
                text-center
                shadow-sm
              "
            >

              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-gray-100
                  text-gray-400
                "
              >
                <FaSearch />
              </div>

              <h2 className="mt-5 text-lg font-bold text-gray-900">
                Nenhum curso encontrado
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Não encontrámos cursos que correspondam
                aos critérios seleccionados.
              </p>

            </div>

          ) : (

            <div
              className="
                grid
                gap-5
                sm:grid-cols-2
                xl:grid-cols-3
              "
            >

              {cursosFiltrados.map((curso) => {

                const inscrito =
                  estaInscrito(curso.id);

                const estiloNivel =
                  obterEstiloNivel(curso.nivel);

                return (
                  <article
                    key={curso.id}
                    className="
                      group
                      flex
                      flex-col
                      overflow-hidden
                      rounded-3xl
                      border
                      border-gray-100
                      bg-white
                      shadow-sm
                      transition-all
                      duration-200
                      hover:-translate-y-1
                      hover:shadow-xl
                    "
                  >

                    {/* Cabeçalho do cartão */}

                    <div
                      className="
                        relative
                        flex
                        h-36
                        items-center
                        justify-center
                        overflow-hidden
                        bg-blue-950
                      "
                    >

                      <div
                        className="
                          absolute
                          -right-8
                          -top-8
                          h-32
                          w-32
                          rounded-full
                          bg-blue-800/50
                          blur-2xl
                        "
                      />

                      <div
                        className="
                          relative
                          flex
                          h-16
                          w-16
                          items-center
                          justify-center
                          rounded-2xl
                          bg-white
                          text-2xl
                          text-blue-950
                          shadow-lg
                          transition-transform
                          duration-300
                          group-hover:scale-105
                        "
                      >
                        <FaBookOpen />
                      </div>

                      {/* Estado */}

                      <div className="absolute right-4 top-4">

                        {inscrito ? (
                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              bg-emerald-500
                              px-3
                              py-1.5
                              text-xs
                              font-bold
                              text-white
                            "
                          >
                            <FaCheckCircle />
                            Inscrito
                          </span>
                        ) : (
                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              bg-white/95
                              px-3
                              py-1.5
                              text-xs
                              font-bold
                              text-blue-900
                            "
                          >
                            <FaClock />
                            Disponível
                          </span>
                        )}

                      </div>

                    </div>

                    {/* Conteúdo */}

                    <div className="flex flex-1 flex-col p-6">

                      <div className="flex items-start justify-between gap-3">

                        <h2
                          className="
                            text-lg
                            font-bold
                            leading-snug
                            text-gray-900
                          "
                        >
                          {curso.titulo}
                        </h2>

                      </div>

                      <span
                        className={`
                          mt-3
                          inline-flex
                          w-fit
                          rounded-full
                          border
                          px-3
                          py-1
                          text-xs
                          font-bold
                          ${estiloNivel.fundo}
                          ${estiloNivel.texto}
                          ${estiloNivel.borda}
                        `}
                      >
                        {curso.nivel}
                      </span>

                      <p
                        className="
                          mt-4
                          line-clamp-3
                          flex-1
                          text-sm
                          leading-relaxed
                          text-gray-500
                        "
                      >
                        {curso.descricao}
                      </p>

                      {/* Acção */}

                      <div className="mt-6">

                        {inscrito ? (

                          <Link
                            href={`/dashboard/cursos/${curso.id}`}
                            className="
                              group/button
                              flex
                              w-full
                              items-center
                              justify-center
                              gap-2
                              rounded-xl
                              bg-blue-900
                              px-4
                              py-3
                              text-sm
                              font-bold
                              text-white
                              shadow-sm
                              transition
                              hover:bg-blue-800
                              hover:shadow-md
                            "
                          >
                            Continuar curso

                            <FaArrowRight
                              className="
                                text-xs
                                transition-transform
                                group-hover/button:translate-x-1
                              "
                            />
                          </Link>

                        ) : (

                          <button
                            type="button"
                            onClick={() =>
                              inscrever(curso.id)
                            }
                            disabled={
                              inscrevendo === curso.id
                            }
                            className="
                              flex
                              w-full
                              items-center
                              justify-center
                              gap-2
                              rounded-xl
                              border-2
                              border-blue-900
                              bg-white
                              px-4
                              py-3
                              text-sm
                              font-bold
                              text-blue-900
                              transition
                              hover:bg-blue-900
                              hover:text-white
                              disabled:cursor-not-allowed
                              disabled:opacity-60
                            "
                          >
                            {inscrevendo ===
                            curso.id ? (
                              <>
                                <FaSpinner className="animate-spin" />
                                A inscrever...
                              </>
                            ) : (
                              <>
                                Inscrever-me
                                <FaArrowRight className="text-xs" />
                              </>
                            )}
                          </button>

                        )}

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

        </section>

        {/* ====================================================
            NOTA INFORMATIVA
        ==================================================== */}

        <section
          className="
            mt-8
            rounded-2xl
            border
            border-blue-100
            bg-blue-50
            p-5
            sm:p-6
          "
        >

          <div className="flex items-start gap-4">

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-white
                text-blue-800
                shadow-sm
              "
            >
              <FaGraduationCap />
            </div>

            <div>
              <h3 className="font-bold text-blue-950">
                Aprenda ao seu ritmo
              </h3>

              <p className="mt-1 text-sm leading-relaxed text-blue-800">
                Cada curso será composto por módulos,
                conteúdos, avaliações e simulações práticas.
                O seu progresso será acompanhado ao longo
                da aprendizagem.
              </p>
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}