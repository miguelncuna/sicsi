
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  FaArrowLeft,
  FaArrowRight,
  FaBookOpen,
  FaCheckCircle,
  FaFileAlt,
  FaFilePdf,
  FaLock,
  FaPlay,
} from "react-icons/fa";

import {
  criarClienteSupabaseServidor,
} from "@/lib/supabase/server";

import BotaoConcluirConteudo from "@/components/dashboard/BotaoConcluirConteudo";

type PaginaProps = {
  params: Promise<{
    id: string;
    conteudoId: string;
  }>;
};

type Curso = {
  id: number;
  titulo: string;
  descricao: string;
};

type Modulo = {
  id: number;
  titulo: string;
  ordem: number;
};

type Conteudo = {
  id: number;
  modulo_id: number;
  titulo: string;
  descricao: string;
  tipo: string;
  conteudo_url: string | null;
  ordem: number;
};

type ConteudoNavegacao = Conteudo & {
  modulo_titulo: string;
  modulo_ordem: number;
};

function obterUrlYouTube(
  url: string | null
) {
  if (!url) {
    return null;
  }

  try {
    const urlObj = new URL(url);

    if (
      urlObj.hostname.includes("youtu.be")
    ) {
      const videoId = urlObj.pathname
        .replace("/", "")
        .trim();

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (
      urlObj.hostname.includes("youtube.com") ||
      urlObj.hostname.includes(
        "www.youtube-nocookie.com"
      )
    ) {
      const videoId =
        urlObj.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      const partes =
        urlObj.pathname
          .split("/")
          .filter(Boolean);

      if (
        partes[0] === "shorts" &&
        partes[1]
      ) {
        return `https://www.youtube.com/embed/${partes[1]}`;
      }

      if (
        partes[0] === "embed" &&
        partes[1]
      ) {
        return `https://www.youtube.com/embed/${partes[1]}`;
      }
    }

    return url;
  } catch {
    return url;
  }
}

function obterIconeTipo(tipo: string) {
  switch (tipo.toUpperCase()) {
    case "VIDEO":
      return <FaPlay />;

    case "PDF":
      return <FaFilePdf />;

    case "TEXTO":
      return <FaFileAlt />;

    default:
      return <FaFileAlt />;
  }
}

function obterNomeTipo(tipo: string) {
  switch (tipo.toUpperCase()) {
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

export default async function ConteudoPage({
  params,
}: PaginaProps) {
  const { id, conteudoId } =
    await params;

  const cursoId = Number(id);
  const idDoConteudo =
    Number(conteudoId);

  if (
    !Number.isInteger(cursoId) ||
    !Number.isInteger(idDoConteudo)
  ) {
    notFound();
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
   * 2. PERFIL
   * ============================================================
   */

  const {
    data: perfil,
    error: erroPerfil,
  } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (
    erroPerfil ||
    !perfil ||
    perfil.papel !== "ESTUDANTE"
  ) {
    redirect("/dashboard");
  }

  /*
   * ============================================================
   * 3. CURSO
   * ============================================================
   */

  const {
    data: curso,
    error: erroCurso,
  } = await supabase
    .from("cursos")
    .select(
      "id, titulo, descricao"
    )
    .eq("id", cursoId)
    .single();

  if (
    erroCurso ||
    !curso
  ) {
    notFound();
  }

  const cursoAtual =
    curso as Curso;

  /*
   * ============================================================
   * 4. CONTEÚDO ACTUAL
   * ============================================================
   */

  const {
    data: conteudoAtual,
    error: erroConteudoAtual,
  } = await supabase
    .from("conteudos")
    .select(`
      id,
      modulo_id,
      titulo,
      descricao,
      tipo,
      conteudo_url,
      ordem,
      modulos!inner (
        id,
        titulo,
        ordem,
        curso_id
      )
    `)
    .eq("id", idDoConteudo)
    .eq(
      "modulos.curso_id",
      cursoId
    )
    .single();

  if (
    erroConteudoAtual ||
    !conteudoAtual
  ) {
    notFound();
  }

  const moduloDoConteudo =
    Array.isArray(
      conteudoAtual.modulos
    )
      ? conteudoAtual.modulos[0]
      : conteudoAtual.modulos;

  if (!moduloDoConteudo) {
    notFound();
  }

  const conteudo: Conteudo & {
    modulo: Modulo;
  } = {
    id: conteudoAtual.id,
    modulo_id:
      conteudoAtual.modulo_id,
    titulo:
      conteudoAtual.titulo,
    descricao:
      conteudoAtual.descricao,
    tipo:
      conteudoAtual.tipo,
    conteudo_url:
      conteudoAtual.conteudo_url,
    ordem:
      conteudoAtual.ordem,
    modulo: {
      id: moduloDoConteudo.id,
      titulo:
        moduloDoConteudo.titulo,
      ordem:
        moduloDoConteudo.ordem,
    },
  };

  /*
   * ============================================================
   * 5. TODOS OS MÓDULOS E CONTEÚDOS
   * ============================================================
   */

  const {
    data: modulos,
    error: erroModulos,
  } = await supabase
    .from("modulos")
    .select(`
      id,
      titulo,
      ordem,
      conteudos (
        id,
        modulo_id,
        titulo,
        descricao,
        tipo,
        conteudo_url,
        ordem
      )
    `)
    .eq("curso_id", cursoId)
    .order("ordem", {
      ascending: true,
    });

  if (
    erroModulos ||
    !modulos
  ) {
    notFound();
  }

  /*
   * ============================================================
   * 6. ORDEM GLOBAL DOS CONTEÚDOS
   * ============================================================
   */

  const listaConteudos: ConteudoNavegacao[] =
    modulos
      .flatMap((modulo) => {
        const conteudosDoModulo =
          Array.isArray(
            modulo.conteudos
          )
            ? modulo.conteudos
            : [];

        return conteudosDoModulo.map(
          (item) => ({
            id: item.id,
            modulo_id:
              item.modulo_id,
            titulo:
              item.titulo,
            descricao:
              item.descricao,
            tipo:
              item.tipo,
            conteudo_url:
              item.conteudo_url,
            ordem:
              item.ordem,
            modulo_titulo:
              modulo.titulo,
            modulo_ordem:
              modulo.ordem,
          })
        );
      })
      .sort((a, b) => {
        if (
          a.modulo_ordem !==
          b.modulo_ordem
        ) {
          return (
            a.modulo_ordem -
            b.modulo_ordem
          );
        }

        return (
          a.ordem -
          b.ordem
        );
      });

  /*
   * ============================================================
   * 7. POSIÇÃO ACTUAL
   * ============================================================
   */

  const indiceAtual =
    listaConteudos.findIndex(
      (item) =>
        item.id ===
        conteudo.id
    );

  if (indiceAtual === -1) {
    notFound();
  }

  const conteudoAnterior =
    indiceAtual > 0
      ? listaConteudos[
          indiceAtual - 1
        ]
      : null;

  const conteudoProximo =
    indiceAtual <
    listaConteudos.length - 1
      ? listaConteudos[
          indiceAtual + 1
        ]
      : null;

  const numeroAtual =
    indiceAtual + 1;

  const totalConteudos =
    listaConteudos.length;

  /*
   * ============================================================
   * 8. PROGRESSO REAL DO UTILIZADOR
   * ============================================================
   */

  const {
    data: progresso,
  } = await supabase
    .from("progresso_utilizador")
    .select(
      "concluido, concluido_em"
    )
    .eq(
      "utilizador_id",
      user.id
    )
    .eq(
      "conteudo_id",
      conteudo.id
    )
    .maybeSingle();

  const concluido =
    progresso?.concluido === true;

  /*
   * ============================================================
   * 9. VISUALIZADOR
   * ============================================================
   */

  const tipo =
    conteudo.tipo.toUpperCase();

  const urlYouTube =
    tipo === "VIDEO"
      ? obterUrlYouTube(
          conteudo.conteudo_url
        )
      : null;

  const percentagemNavegacao =
    totalConteudos > 0
      ? Math.round(
          (numeroAtual /
            totalConteudos) *
            100
        )
      : 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">

        {/* ======================================================
            CABEÇALHO
        ====================================================== */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <Link
            href={`/dashboard/cursos/${cursoAtual.id}`}
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-slate-700
              shadow-sm
              transition
              hover:border-blue-200
              hover:bg-blue-50
              hover:text-blue-800
            "
          >
            <FaArrowLeft />
            Voltar ao curso
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-blue-100
                text-blue-800
              "
            >
              <FaBookOpen />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Curso
              </p>

              <p className="max-w-[280px] truncate text-sm font-semibold text-slate-800 sm:max-w-md">
                {cursoAtual.titulo}
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================
            PROGRESSO DE NAVEGAÇÃO
        ====================================================== */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Conteúdo
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {numeroAtual} de{" "}
                {totalConteudos}
              </p>
            </div>

            <div className="w-full sm:max-w-xs">

              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>
                  Navegação
                </span>

                <span>
                  {percentagemNavegacao}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="
                    h-full
                    rounded-full
                    bg-blue-800
                    transition-all
                  "
                  style={{
                    width: `${percentagemNavegacao}%`,
                  }}
                />
              </div>

            </div>

          </div>
        </div>

        {/* ======================================================
            CONTEÚDO PRINCIPAL
        ====================================================== */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* CABEÇALHO DO CONTEÚDO */}

          <div className="border-b border-slate-200 px-5 py-6 sm:px-8 sm:py-7">

            <div className="mb-4 flex flex-wrap items-center gap-3">

              <span
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-blue-50
                  px-3
                  py-1.5
                  text-xs
                  font-bold
                  uppercase
                  tracking-wide
                  text-blue-800
                "
              >
                {obterIconeTipo(
                  conteudo.tipo
                )}

                {obterNomeTipo(
                  conteudo.tipo
                )}
              </span>

              {concluido && (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-emerald-50
                    px-3
                    py-1.5
                    text-xs
                    font-bold
                    text-emerald-700
                  "
                >
                  <FaCheckCircle />
                  Concluído
                </span>
              )}

            </div>

            <p className="mb-2 text-sm font-semibold text-blue-800">
              Módulo{" "}
              {conteudo.modulo.ordem}
              {" · "}
              {conteudo.modulo.titulo}
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {conteudo.titulo}
            </h1>

            {conteudo.descricao && (
              <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                {conteudo.descricao}
              </p>
            )}

          </div>

          {/* ====================================================
              VISUALIZADOR
          ==================================================== */}

          <div className="bg-slate-100 p-4 sm:p-6 lg:p-8">

            {/* VIDEO */}

            {tipo === "VIDEO" &&
            urlYouTube ? (
              <div className="overflow-hidden rounded-2xl bg-black shadow-lg">

                <div className="aspect-video w-full">

                  <iframe
                    src={urlYouTube}
                    title={
                      conteudo.titulo
                    }
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />

                </div>

              </div>
            ) : null}

            {/* PDF */}

            {tipo === "PDF" &&
            conteudo.conteudo_url ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">

                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-3">
                    <FaFilePdf className="text-red-600" />

                    <span className="text-sm font-semibold text-slate-700">
                      Documento PDF
                    </span>
                  </div>

                  <a
                    href={
                      conteudo.conteudo_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      text-sm
                      font-semibold
                      text-blue-800
                      hover:underline
                    "
                  >
                    Abrir em nova janela
                  </a>

                </div>

                <iframe
                  src={
                    conteudo.conteudo_url
                  }
                  title={
                    conteudo.titulo
                  }
                  className="
                    h-[70vh]
                    min-h-[500px]
                    w-full
                    bg-white
                  "
                />

              </div>
            ) : null}

            {/* TEXTO */}

            {tipo === "TEXTO" ? (
              <article
                className="
                  mx-auto
                  max-w-4xl
                  rounded-2xl
                  bg-white
                  p-6
                  shadow-sm
                  sm:p-8
                  lg:p-10
                "
              >

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                  <FaFileAlt className="text-2xl" />
                </div>

                <h2 className="mb-6 text-xl font-bold text-slate-900">
                  {conteudo.titulo}
                </h2>

                <div className="whitespace-pre-line text-base leading-8 text-slate-700">
                  {conteudo.descricao ||
                    "Este conteúdo ainda não possui texto disponível."}
                </div>

              </article>
            ) : null}

            {/* CONTEÚDO DESCONHECIDO */}

            {tipo !== "VIDEO" &&
            tipo !== "PDF" &&
            tipo !== "TEXTO" ? (
              <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm">

                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <FaLock className="text-2xl" />
                </div>

                <h2 className="text-xl font-bold text-slate-900">
                  Conteúdo indisponível
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Não foi possível apresentar
                  este conteúdo porque o tipo
                  ou endereço do recurso ainda
                  não está disponível.
                </p>

              </div>
            ) : null}

          </div>

          {/* ====================================================
              RODAPÉ
          ==================================================== */}

          <div className="border-t border-slate-200 bg-white px-5 py-5 sm:px-8">

            {/* ESTADO E BOTÃO DE CONCLUSÃO */}

            <div
              className={`
                mb-5
                flex
                flex-col
                gap-4
                rounded-2xl
                border
                px-4
                py-4
                sm:flex-row
                sm:items-center
                sm:justify-between

                ${
                  concluido
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-blue-100 bg-blue-50"
                }
              `}
            >

              <div>
                <p
                  className={`
                    text-sm
                    font-bold
                    ${
                      concluido
                        ? "text-emerald-800"
                        : "text-blue-900"
                    }
                  `}
                >
                  {concluido
                    ? "Conteúdo concluído"
                    : "Conteúdo em aprendizagem"}
                </p>

                <p
                  className={`
                    mt-1
                    text-xs
                    leading-5
                    ${
                      concluido
                        ? "text-emerald-700"
                        : "text-blue-700"
                    }
                  `}
                >
                  {concluido
                    ? "O seu progresso foi registado com sucesso."
                    : "Quando terminar este conteúdo, marque-o como concluído para actualizar o seu progresso."}
                </p>
              </div>

              <BotaoConcluirConteudo
                conteudoId={
                  conteudo.id
                }
                cursoId={
                  cursoAtual.id
                }
                inicialmenteConcluido={
                  concluido
                }
              />

            </div>

            {/* ==================================================
                NAVEGAÇÃO
            ================================================== */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              {/* ANTERIOR */}

              {conteudoAnterior ? (
                <Link
                  href={`/dashboard/cursos/${cursoAtual.id}/conteudo/${conteudoAnterior.id}`}
                  className="
                    group
                    flex
                    min-h-[86px]
                    items-center
                    gap-4
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-4
                    transition
                    hover:border-blue-200
                    hover:bg-blue-50
                  "
                >

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-100
                      text-slate-600
                      transition
                      group-hover:bg-blue-100
                      group-hover:text-blue-800
                    "
                  >
                    <FaArrowLeft />
                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Anterior
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-slate-800">
                      {conteudoAnterior.titulo}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Módulo{" "}
                      {
                        conteudoAnterior.modulo_ordem
                      }
                    </p>

                  </div>

                </Link>
              ) : (
                <div
                  className="
                    flex
                    min-h-[86px]
                    items-center
                    gap-4
                    rounded-2xl
                    border
                    border-slate-100
                    bg-slate-50
                    px-4
                    py-4
                    opacity-60
                  "
                >

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-200
                      text-slate-400
                    "
                  >
                    <FaArrowLeft />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Anterior
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Primeiro conteúdo
                    </p>
                  </div>

                </div>
              )}

              {/* PRÓXIMO */}

              {conteudoProximo ? (
                <Link
                  href={`/dashboard/cursos/${cursoAtual.id}/conteudo/${conteudoProximo.id}`}
                  className="
                    group
                    flex
                    min-h-[86px]
                    items-center
                    justify-between
                    gap-4
                    rounded-2xl
                    border
                    border-blue-200
                    bg-blue-800
                    px-4
                    py-4
                    text-white
                    shadow-sm
                    transition
                    hover:bg-blue-900
                  "
                >

                  <div className="min-w-0">

                    <p className="text-xs font-bold uppercase tracking-wide text-blue-200">
                      Próximo
                    </p>

                    <p className="mt-1 truncate text-sm font-bold">
                      {conteudoProximo.titulo}
                    </p>

                    <p className="mt-1 text-xs text-blue-200">
                      Módulo{" "}
                      {
                        conteudoProximo.modulo_ordem
                      }
                    </p>

                  </div>

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-white/10
                      transition
                      group-hover:bg-white/20
                    "
                  >
                    <FaArrowRight />
                  </div>

                </Link>
              ) : (
                <div
                  className="
                    flex
                    min-h-[86px]
                    items-center
                    justify-between
                    gap-4
                    rounded-2xl
                    border
                    border-emerald-100
                    bg-emerald-50
                    px-4
                    py-4
                  "
                >

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                      Final do curso
                    </p>

                    <p className="mt-1 text-sm font-bold text-emerald-800">
                      Último conteúdo
                    </p>
                  </div>

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-emerald-100
                      text-emerald-600
                    "
                  >
                    <FaCheckCircle />
                  </div>

                </div>
              )}

            </div>

          </div>

        </section>

        {/* ======================================================
            RODAPÉ
        ====================================================== */}

        <div className="mt-5 pb-4 text-center text-xs text-slate-400">
          SICSI · Sistema de Consciencialização em
          Segurança da Informação
        </div>

      </div>
    </main>
  );
}