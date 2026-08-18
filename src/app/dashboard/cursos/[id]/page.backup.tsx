"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  FaArrowLeft,
  FaBook,
  FaBookOpen,
  FaCheckCircle,
  FaChevronDown,
  FaChevronRight,
  FaCircle,
  FaFilePdf,
  FaPlayCircle,
  FaSpinner,
} from "react-icons/fa";

import { supabase } from "@/lib/supabase";

import {
  calcularProgressoCurso,
  estadoProgressoParaClasses,
  estadoProgressoParaTexto,
  type ModuloParaProgresso,
  type ProgressoConteudo,
  type ResultadoProgressoCurso,
} from "@/lib/progresso/calcularProgresso";

/* ============================================================
 * TIPOS
 * ============================================================
 */

interface Curso {
  id: number;
  titulo: string;
  descricao: string;
}

interface Conteudo {
  id: number;
  modulo_id: number;
  titulo: string;
  descricao: string;
  tipo: string;
  conteudo_url: string | null;
  ordem: number;
}

interface Modulo {
  id: number;
  curso_id: number;
  titulo: string;
  descricao: string;
  ordem: number;
  conteudos: Conteudo[];
}

/* ============================================================
 * PÁGINA
 * ============================================================
 */

export default function CursoPage() {
  const params = useParams();

  const idCurso = Number(params.id);

  const [curso, setCurso] =
    useState<Curso | null>(null);

  const [modulos, setModulos] =
    useState<Modulo[]>([]);

  const [progressoConteudos, setProgressoConteudos] =
    useState<ProgressoConteudo[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [moduloAberto, setModuloAberto] =
    useState<number | null>(null);

  /* ==========================================================
   * CARREGAR CURSO
   * ==========================================================
   */

  async function carregarCurso() {
    try {
      setCarregando(true);
      setErro("");

      if (
        !idCurso ||
        Number.isNaN(idCurso)
      ) {
        setErro(
          "O curso seleccionado é inválido."
        );

        return;
      }

      /* ------------------------------------------------------
       * UTILIZADOR AUTENTICADO
       * ------------------------------------------------------
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
        setErro(
          "Não foi possível identificar o utilizador autenticado."
        );

        return;
      }

      /* ------------------------------------------------------
       * CURSO
       * ------------------------------------------------------
       */

      const {
        data: dadosCurso,
        error: erroCurso,
      } = await supabase
        .from("cursos")
        .select(
          "id, titulo, descricao"
        )
        .eq("id", idCurso)
        .single();

      if (
        erroCurso ||
        !dadosCurso
      ) {
        console.error(
          "Erro ao carregar curso:",
          erroCurso
        );

        setErro(
          "Não foi possível encontrar o curso solicitado."
        );

        return;
      }

      setCurso(
        dadosCurso as Curso
      );

      /* ------------------------------------------------------
       * MÓDULOS
       * ------------------------------------------------------
       */

      const {
        data: dadosModulos,
        error: erroModulos,
      } = await supabase
        .from("modulos")
        .select(
          `
            id,
            curso_id,
            titulo,
            descricao,
            ordem
          `
        )
        .eq(
          "curso_id",
          idCurso
        )
        .order("ordem", {
          ascending: true,
        });

      if (erroModulos) {
        console.error(
          "Erro ao carregar módulos:",
          erroModulos
        );

        setErro(
          "Não foi possível carregar os módulos deste curso."
        );

        return;
      }

      const listaModulos =
        (dadosModulos ??
          []) as Modulo[];

      /* ------------------------------------------------------
       * CONTEÚDOS
       * ------------------------------------------------------
       */

      const idsModulos =
        listaModulos.map(
          (modulo) =>
            modulo.id
        );

      let listaConteudos: Conteudo[] =
        [];

      if (
        idsModulos.length > 0
      ) {
        const {
          data: dadosConteudos,
          error: erroConteudos,
        } = await supabase
          .from("conteudos")
          .select(
            `
              id,
              modulo_id,
              titulo,
              descricao,
              tipo,
              conteudo_url,
              ordem
            `
          )
          .in(
            "modulo_id",
            idsModulos
          )
          .order("ordem", {
            ascending: true,
          });

        if (erroConteudos) {
          console.error(
            "Erro ao carregar conteúdos:",
            erroConteudos
          );

          setErro(
            "Não foi possível carregar os conteúdos do curso."
          );

          return;
        }

        listaConteudos =
          (dadosConteudos ??
            []) as Conteudo[];
      }

      /* ------------------------------------------------------
       * ORGANIZAR CONTEÚDOS
       * ------------------------------------------------------
       */

      const modulosOrganizados =
        listaModulos.map(
          (modulo) => ({
            ...modulo,

            conteudos:
              listaConteudos
                .filter(
                  (conteudo) =>
                    conteudo.modulo_id ===
                    modulo.id
                )
                .sort(
                  (a, b) =>
                    a.ordem -
                    b.ordem
                ),
          })
        );

      setModulos(
        modulosOrganizados
      );

      /* ------------------------------------------------------
       * PROGRESSO DO UTILIZADOR
       * ------------------------------------------------------
       */

      const {
        data: dadosProgresso,
        error: erroProgresso,
      } = await supabase
        .from("progresso_utilizador")
        .select(
          "conteudo_id, concluido"
        )
        .eq(
          "utilizador_id",
          user.id
        );

      if (erroProgresso) {
        console.error(
          "Erro ao carregar progresso:",
          erroProgresso
        );

        /*
         * Não bloqueamos a página caso
         * o progresso não possa ser carregado.
         *
         * O curso continua disponível,
         * mas começa com progresso zero.
         */
        setProgressoConteudos([]);
      } else {
        setProgressoConteudos(
          (dadosProgresso ??
            []) as ProgressoConteudo[]
        );
      }

      /* ------------------------------------------------------
       * ABRIR PRIMEIRO MÓDULO
       * ------------------------------------------------------
       */

      if (
        modulosOrganizados.length >
        0
      ) {
        setModuloAberto(
          modulosOrganizados[0].id
        );
      }
    } catch (erro) {
      console.error(
        "Erro inesperado ao carregar curso:",
        erro
      );

      setErro(
        "Ocorreu um erro inesperado ao carregar o curso."
      );
    } finally {
      setCarregando(false);
    }
  }

  /* ==========================================================
   * INICIALIZAÇÃO
   * ==========================================================
   */

  useEffect(() => {
    carregarCurso();
  }, [idCurso]);

  /* ==========================================================
   * ESTRUTURA PARA O MOTOR DE PROGRESSO
   * ==========================================================
   */

  const modulosParaProgresso =
    useMemo<ModuloParaProgresso[]>(
      () =>
        modulos.map(
          (modulo) => ({
            id: modulo.id,
            curso_id:
              modulo.curso_id,
            titulo:
              modulo.titulo,
            ordem:
              modulo.ordem,

            conteudos:
              modulo.conteudos.map(
                (conteudo) => ({
                  id: conteudo.id,
                  modulo_id:
                    conteudo.modulo_id,
                  titulo:
                    conteudo.titulo,
                  ordem:
                    conteudo.ordem,
                })
              ),
          })
        ),
      [modulos]
    );

  /* ==========================================================
   * PROGRESSO REAL DO CURSO
   * ==========================================================
   */

  const progressoCurso =
    useMemo<ResultadoProgressoCurso>(
      () =>
        calcularProgressoCurso(
          idCurso,
          modulosParaProgresso,
          progressoConteudos
        ),
      [
        idCurso,
        modulosParaProgresso,
        progressoConteudos,
      ]
    );

  /* ==========================================================
   * ESTATÍSTICAS
   * ==========================================================
   */

  const totalConteudos =
    progressoCurso.totalConteudos;

  const conteudosConcluidos =
    progressoCurso.conteudosConcluidos;

  const percentagem =
    progressoCurso.percentagem;

  const estado =
    progressoCurso.estado;

  /* ==========================================================
   * ALTERNAR MÓDULO
   * ==========================================================
   */

  function alternarModulo(
    idModulo: number
  ) {
    setModuloAberto(
      (actual) =>
        actual === idModulo
          ? null
          : idModulo
    );
  }

  /* ==========================================================
   * ÍCONE DO TIPO DE CONTEÚDO
   * ==========================================================
   */

  function obterIconeConteudo(
    tipo: string
  ) {
    switch (
      tipo.toUpperCase()
    ) {
      case "VIDEO":
        return (
          <FaPlayCircle className="text-blue-700" />
        );

      case "PDF":
        return (
          <FaFilePdf className="text-red-600" />
        );

      case "TEXTO":
      default:
        return (
          <FaBookOpen className="text-blue-700" />
        );
    }
  }

  /* ==========================================================
   * NOME DO TIPO
   * ==========================================================
   */

  function obterNomeTipo(
    tipo: string
  ) {
    switch (
      tipo.toUpperCase()
    ) {
      case "VIDEO":
        return "Vídeo";

      case "PDF":
        return "PDF";

      case "TEXTO":
        return "Texto";

      default:
        return tipo;
    }
  }

  /* ==========================================================
   * PROGRESSO DE UM MÓDULO
   * ==========================================================
   */

  function obterProgressoModulo(
    moduloId: number
  ) {
    return (
      progressoCurso.modulos.find(
        (modulo) =>
          modulo.moduloId ===
          moduloId
      ) ?? {
        moduloId,
        titulo: "",
        ordem: 0,
        totalConteudos: 0,
        conteudosConcluidos: 0,
        percentagem: 0,
        estado:
          "NAO_INICIADO" as const,
      }
    );
  }

  /* ==========================================================
   * VERIFICAR CONTEÚDO CONCLUÍDO
   * ==========================================================
   */

  function conteudoFoiConcluido(
    conteudoId: number
  ) {
    return progressoConteudos.some(
      (item) =>
        Number(
          item.conteudo_id
        ) ===
          Number(conteudoId) &&
        item.concluido === true
    );
  }

  /* ==========================================================
   * CARREGAMENTO
   * ==========================================================
   */

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
          <div className="text-center">
            <FaSpinner className="mx-auto animate-spin text-4xl text-blue-800" />

            <p className="mt-4 text-sm font-medium text-slate-600">
              A carregar o curso...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
   * ERRO
   * ==========================================================
   */

  if (
    erro ||
    !curso
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
          <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
              <FaBook className="text-2xl text-red-600" />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Não foi possível carregar o curso
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {erro ||
                "O curso solicitado não está disponível."}
            </p>

            <Link
              href="/dashboard/cursos"
              className="
                mt-6
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-800
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-blue-900
              "
            >
              <FaArrowLeft />
              Voltar aos cursos
            </Link>

          </section>
        </div>
      </main>
    );
  }

  /* ==========================================================
   * INTERFACE
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">

        {/* ====================================================
            VOLTAR
        ==================================================== */}

        <Link
          href="/dashboard/cursos"
          className="
            mb-6
            inline-flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-slate-600
            transition
            hover:text-blue-800
          "
        >
          <FaArrowLeft />
          Voltar aos cursos
        </Link>

        {/* ====================================================
            CABEÇALHO DO CURSO
        ==================================================== */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="bg-blue-900 px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10">

            <div className="max-w-4xl">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <FaBook className="text-xl" />
                </div>

                <span className="text-sm font-semibold uppercase tracking-wider text-blue-200">
                  Curso
                </span>

              </div>

              <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                {curso.titulo}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                {curso.descricao ||
                  "Explore os conteúdos e desenvolva os seus conhecimentos em segurança da informação."}
              </p>

            </div>
          </div>

          {/* ==================================================
              PROGRESSO PRINCIPAL
          ================================================== */}

          <div className="border-b border-slate-100 px-6 py-6 sm:px-8 lg:px-10">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <h2 className="text-lg font-bold text-slate-900">
                    Progresso do curso
                  </h2>

                  <span
                    className={`
                      inline-flex
                      rounded-full
                      px-3
                      py-1
                      text-xs
                      font-bold
                      ${estadoProgressoParaClasses(
                        estado
                      )}
                    `}
                  >
                    {estadoProgressoParaTexto(
                      estado
                    )}
                  </span>

                </div>

                <p className="mt-2 text-sm text-slate-600">
                  {conteudosConcluidos} de{" "}
                  {totalConteudos}{" "}
                  {totalConteudos === 1
                    ? "conteúdo concluído"
                    : "conteúdos concluídos"}
                </p>

              </div>

              <div className="w-full lg:max-w-md">

                <div className="mb-2 flex items-center justify-between">

                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Progresso
                  </span>

                  <span className="text-lg font-bold text-blue-900">
                    {percentagem}%
                  </span>

                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-200">

                  <div
                    className="
                      h-full
                      rounded-full
                      bg-blue-800
                      transition-all
                      duration-500
                    "
                    style={{
                      width: `${percentagem}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          </div>

          {/* ==================================================
              ESTATÍSTICAS
          ================================================== */}

          <div className="grid grid-cols-2 divide-x divide-slate-100 lg:grid-cols-3">

            <div className="px-5 py-5 sm:px-8">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Módulos
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {modulos.length}
              </p>

            </div>

            <div className="px-5 py-5 sm:px-8">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Conteúdos
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {totalConteudos}
              </p>

            </div>

            <div className="col-span-2 border-t border-slate-100 px-5 py-5 sm:px-8 lg:col-span-1 lg:border-l lg:border-t-0">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Concluídos
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {conteudosConcluidos}
              </p>

            </div>

          </div>

        </section>

        {/* ====================================================
            CONTEÚDO DO CURSO
        ==================================================== */}

        <section className="mt-8">

          <div className="mb-5">

            <h2 className="text-2xl font-bold text-slate-900">
              Conteúdo do curso
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Acompanhe o seu progresso em cada módulo e conteúdo.
            </p>

          </div>

          {modulos.length === 0 ? (

            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                <FaBookOpen className="text-2xl text-blue-800" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Este curso ainda não possui módulos
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                Os conteúdos deste curso serão disponibilizados assim que os módulos forem adicionados.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {modulos.map(
                (modulo, indice) => {
                  const aberto =
                    moduloAberto ===
                    modulo.id;

                  const progressoModulo =
                    obterProgressoModulo(
                      modulo.id
                    );

                  return (
                    <article
                      key={modulo.id}
                      className="
                        overflow-hidden
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        shadow-sm
                        transition-shadow
                        hover:shadow-md
                      "
                    >

                      {/* ========================================
                          CABEÇALHO DO MÓDULO
                      ======================================== */}

                      <button
                        type="button"
                        onClick={() =>
                          alternarModulo(
                            modulo.id
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-4
                          p-5
                          text-left
                          sm:p-6
                        "
                        aria-expanded={
                          aberto
                        }
                      >

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-800">
                          {String(
                            indice + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                            <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                              {modulo.titulo}
                            </h3>

                            <span
                              className={`
                                w-fit
                                rounded-full
                                px-3
                                py-1
                                text-xs
                                font-bold
                                ${estadoProgressoParaClasses(
                                  progressoModulo.estado
                                )}
                              `}
                            >
                              {estadoProgressoParaTexto(
                                progressoModulo.estado
                              )}
                            </span>

                          </div>

                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                            {modulo.descricao}
                          </p>

                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">

                            <span className="text-xs font-semibold text-slate-500">
                              {progressoModulo.conteudosConcluidos}{" "}
                              de{" "}
                              {progressoModulo.totalConteudos}{" "}
                              concluídos
                            </span>

                            <div className="flex flex-1 items-center gap-3">

                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">

                                <div
                                  className="
                                    h-full
                                    rounded-full
                                    bg-blue-700
                                    transition-all
                                  "
                                  style={{
                                    width: `${progressoModulo.percentagem}%`,
                                  }}
                                />

                              </div>

                              <span className="w-10 text-right text-xs font-bold text-blue-800">
                                {
                                  progressoModulo.percentagem
                                }%
                              </span>

                            </div>

                          </div>

                        </div>

                        <div className="shrink-0 text-slate-400">

                          {aberto ? (
                            <FaChevronDown />
                          ) : (
                            <FaChevronRight />
                          )}

                        </div>

                      </button>

                      {/* ========================================
                          CONTEÚDOS
                      ======================================== */}

                      {aberto && (

                        <div className="border-t border-slate-100 bg-slate-50">

                          {modulo.conteudos.length ===
                          0 ? (

                            <div className="px-5 py-6 sm:px-6">

                              <p className="text-sm text-slate-500">
                                Este módulo ainda não possui conteúdos.
                              </p>

                            </div>

                          ) : (

                            <div className="divide-y divide-slate-200">

                              {modulo.conteudos.map(
                                (
                                  conteudo,
                                  conteudoIndex
                                ) => {

                                  const concluido =
                                    conteudoFoiConcluido(
                                      conteudo.id
                                    );

                                  return (
                                    <Link
                                      key={
                                        conteudo.id
                                      }

                                      /*
                                       * IMPORTANTE:
                                       * O conteúdo NÃO abre mais
                                       * conteudo_url directamente.
                                       *
                                       * Vai sempre para o nosso
                                       * visualizador.
                                       */

                                      href={`/dashboard/cursos/${idCurso}/conteudo/${conteudo.id}`}

                                      className="
                                        group
                                        flex
                                        items-center
                                        gap-4
                                        px-5
                                        py-4
                                        transition
                                        hover:bg-white
                                        sm:px-6
                                      "
                                    >

                                      {/* ÍCONE */}

                                      <div
                                        className={`
                                          flex
                                          h-10
                                          w-10
                                          shrink-0
                                          items-center
                                          justify-center
                                          rounded-xl
                                          shadow-sm
                                          ${
                                            concluido
                                              ? "bg-emerald-100"
                                              : "bg-white"
                                          }
                                        `}
                                      >

                                        {concluido ? (
                                          <FaCheckCircle className="text-emerald-600" />
                                        ) : (
                                          obterIconeConteudo(
                                            conteudo.tipo
                                          )
                                        )}

                                      </div>

                                      {/* INFORMAÇÕES */}

                                      <div className="min-w-0 flex-1">

                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">

                                          <h4 className="truncate text-sm font-semibold text-slate-900">
                                            {conteudoIndex +
                                              1}
                                            .{" "}
                                            {
                                              conteudo.titulo
                                            }
                                          </h4>

                                          <span className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                            {obterNomeTipo(
                                              conteudo.tipo
                                            )}
                                          </span>

                                        </div>

                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                          {
                                            conteudo.descricao
                                          }
                                        </p>

                                      </div>

                                      {/* ESTADO */}

                                      <div className="hidden shrink-0 sm:block">

                                        {concluido ? (

                                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                            <FaCheckCircle />
                                            Concluído
                                          </span>

                                        ) : (

                                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                                            <FaCircle className="text-[7px]" />
                                            Não iniciado
                                          </span>

                                        )}

                                      </div>

                                      {/* SETA */}

                                      <FaChevronRight className="shrink-0 text-xs text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700" />

                                    </Link>
                                  );
                                }
                              )}

                            </div>

                          )}

                        </div>

                      )}

                    </article>
                  );
                }
              )}

            </div>

          )}

        </section>

        {/* ====================================================
            INFORMAÇÃO
        ==================================================== */}

        <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-800 shadow-sm">
              <FaBookOpen />
            </div>

            <div>

              <h3 className="font-bold text-blue-950">
                Aprenda ao seu ritmo
              </h3>

              <p className="mt-1 text-sm leading-relaxed text-blue-800">
                O seu progresso é actualizado à medida que conclui os conteúdos. Ao completar todos os conteúdos, o curso passa para o estado <strong>Concluído</strong>.
              </p>

            </div>

          </div>

        </section>

        {/* ====================================================
            RODAPÉ
        ==================================================== */}

        <div className="mt-6 pb-4 text-center text-xs text-slate-400">
          SICSI · Sistema de Consciencialização em
          Segurança da Informação
        </div>

      </div>
    </main>
  );
}