"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaCommentDots,
  FaSearch,
  FaStar,
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaFilter,
  FaUser,
  FaBook,
  FaFileAlt,
  FaSyncAlt,
} from "react-icons/fa";

type TipoFeedback = "curso" | "conteudo" | "geral" | string;

type Utilizador = {
  id: string;
  nome_completo: string | null;
  email: string | null;
  foto_url: string | null;
};

type Curso = {
  id: number;
  titulo: string;
};

type Conteudo = {
  id: number;
  titulo: string;
};

type Feedback = {
  id: number;
  utilizador_id: string;
  tipo: TipoFeedback;
  curso_id: number | null;
  conteudo_id: number | null;
  classificacao: number;
  comentario: string;
  criado_em: string;
  utilizador: Utilizador | null;
  curso: Curso | null;
  conteudo: Conteudo | null;
};

type TipoModal = "visualizar" | "editar" | null;

export default function ComentariosFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [pesquisa, setPesquisa] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [classificacaoFiltro, setClassificacaoFiltro] =
    useState("todas");

  const [modal, setModal] = useState<TipoModal>(null);
  const [selecionado, setSelecionado] =
    useState<Feedback | null>(null);

  const [classificacao, setClassificacao] = useState(5);
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] =
    useState<number | null>(null);

  async function carregarFeedbacks() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        "/api/admin/comentarios-feedbacks",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.erro ||
            "Não foi possível carregar os comentários e feedbacks."
        );
      }

      setFeedbacks(dados.feedbacks ?? []);
    } catch (error) {
      console.error(
        "Erro ao carregar feedbacks:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao carregar os feedbacks."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarFeedbacks();
  }, []);

  const feedbacksFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return feedbacks.filter((feedback) => {
      const correspondePesquisa =
        !termo ||
        feedback.comentario
          .toLowerCase()
          .includes(termo) ||
        feedback.utilizador?.nome_completo
          ?.toLowerCase()
          .includes(termo) ||
        feedback.utilizador?.email
          ?.toLowerCase()
          .includes(termo) ||
        feedback.curso?.titulo
          ?.toLowerCase()
          .includes(termo) ||
        feedback.conteudo?.titulo
          ?.toLowerCase()
          .includes(termo);

      const correspondeTipo =
        tipo === "todos" ||
        feedback.tipo === tipo;

      const correspondeClassificacao =
        classificacaoFiltro === "todas" ||
        feedback.classificacao ===
          Number(classificacaoFiltro);

      return (
        correspondePesquisa &&
        correspondeTipo &&
        correspondeClassificacao
      );
    });
  }, [
    feedbacks,
    pesquisa,
    tipo,
    classificacaoFiltro,
  ]);

  const total = feedbacks.length;

  const media =
    total > 0
      ? (
          feedbacks.reduce(
            (totalAtual, feedback) =>
              totalAtual + feedback.classificacao,
            0
          ) / total
        ).toFixed(1)
      : "0.0";

  /*
   * ==========================================================
   * ESTATÍSTICAS POR CLASSIFICAÇÃO
   * ==========================================================
   */

  const cincoEstrelas = feedbacks.filter(
    (feedback) =>
      feedback.classificacao === 5
  ).length;

  const quatroEstrelas = feedbacks.filter(
    (feedback) =>
      feedback.classificacao === 4
  ).length;

  function abrirVisualizacao(
    feedback: Feedback
  ) {
    setSelecionado(feedback);
    setModal("visualizar");
  }

  function abrirEdicao(
    feedback: Feedback
  ) {
    setSelecionado(feedback);
    setClassificacao(
      feedback.classificacao
    );
    setComentario(feedback.comentario);
    setModal("editar");
  }

  function fecharModal() {
    if (guardando) return;

    setModal(null);
    setSelecionado(null);
    setComentario("");
    setClassificacao(5);
  }

  async function guardarAlteracoes() {
    if (!selecionado || guardando) {
      return;
    }

    const comentarioLimpo =
      comentario.trim();

    if (
      classificacao < 1 ||
      classificacao > 5
    ) {
      alert(
        "A classificação deve estar entre 1 e 5."
      );
      return;
    }

    if (!comentarioLimpo) {
      alert(
        "O comentário não pode estar vazio."
      );
      return;
    }

    if (comentarioLimpo.length > 2000) {
      alert(
        "O comentário não pode ultrapassar 2000 caracteres."
      );
      return;
    }

    try {
      setGuardando(true);

      const resposta = await fetch(
        `/api/admin/comentarios-feedbacks/${selecionado.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classificacao,
            comentario: comentarioLimpo,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.erro ||
            "Não foi possível guardar as alterações."
        );
      }

      await carregarFeedbacks();
      fecharModal();
    } catch (error) {
      console.error(
        "Erro ao actualizar feedback:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao guardar as alterações."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarFeedback(
    feedback: Feedback
  ) {
    if (eliminandoId !== null) {
      return;
    }

    const confirmado = window.confirm(
      `Tem a certeza que deseja eliminar o feedback de "${
        feedback.utilizador?.nome_completo ||
        "este utilizador"
      }"?\n\nEsta operação não pode ser desfeita.`
    );

    if (!confirmado) return;

    try {
      setEliminandoId(feedback.id);

      const resposta = await fetch(
        `/api/admin/comentarios-feedbacks/${feedback.id}`,
        {
          method: "DELETE",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.erro ||
            "Não foi possível eliminar o feedback."
        );
      }

      setFeedbacks((anteriores) =>
        anteriores.filter(
          (item) =>
            item.id !== feedback.id
        )
      );
    } catch (error) {
      console.error(
        "Erro ao eliminar feedback:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao eliminar o feedback."
      );
    } finally {
      setEliminandoId(null);
    }
  }

  function limparFiltros() {
    setPesquisa("");
    setTipo("todos");
    setClassificacaoFiltro("todas");
  }

  function nomeTipo(tipoFeedback: string) {
    switch (tipoFeedback) {
      case "curso":
        return "Curso";

      case "conteudo":
        return "Conteúdo";

      case "geral":
        return "Geral";

      default:
        return tipoFeedback;
    }
  }

  function dataFormatada(data: string) {
    try {
      return new Intl.DateTimeFormat(
        "pt-PT",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      ).format(new Date(data));
    } catch {
      return data;
    }
  }

  function mostrarEstrelas(
    valor: number
  ) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(
          (numero) => (
            <FaStar
              key={numero}
              className={
                numero <= valor
                  ? "text-yellow-400"
                  : "text-slate-200"
              }
            />
          )
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans md:p-8">
      <div className="mx-auto max-w-[1500px]">

        {/* CABEÇALHO */}

        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1f3b8f] text-white shadow-sm">
              <FaCommentDots size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Comentários & Feedbacks
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Consulte e faça a gestão das opiniões dos utilizadores.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={carregarFeedbacks}
            disabled={carregando}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <FaSyncAlt
              className={
                carregando
                  ? "animate-spin"
                  : ""
              }
            />

            Actualizar
          </button>
        </div>

        {/* ERRO */}

        {erro && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <span>{erro}</span>

            <button
              type="button"
              onClick={carregarFeedbacks}
              className="font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* ESTATÍSTICAS */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total de feedbacks
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Classificação média
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {media}
              </span>

              <FaStar className="text-yellow-400" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              5 estrelas
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {cincoEstrelas}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              4 estrelas
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {quatroEstrelas}
            </p>
          </div>
        </div>

        {/* FILTROS */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FaFilter className="text-[#1f3b8f]" />

            <h2 className="text-sm font-bold text-slate-800">
              Pesquisa e filtros
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_220px_auto]">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={pesquisa}
                onChange={(evento) =>
                  setPesquisa(
                    evento.target.value
                  )
                }
                placeholder="Pesquisar utilizador, email ou comentário..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#1f3b8f] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={tipo}
              onChange={(evento) =>
                setTipo(evento.target.value)
              }
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-[#1f3b8f]"
            >
              <option value="todos">
                Todos os tipos
              </option>

              <option value="curso">
                Curso
              </option>

              <option value="conteudo">
                Conteúdo
              </option>

              <option value="geral">
                Geral
              </option>
            </select>

            <select
              value={classificacaoFiltro}
              onChange={(evento) =>
                setClassificacaoFiltro(
                  evento.target.value
                )
              }
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-[#1f3b8f]"
            >
              <option value="todas">
                Todas as classificações
              </option>

              <option value="5">
                5 estrelas
              </option>

              <option value="4">
                4 estrelas
              </option>

              <option value="3">
                3 estrelas
              </option>

              <option value="2">
                2 estrelas
              </option>

              <option value="1">
                1 estrela
              </option>
            </select>

            <button
              type="button"
              onClick={limparFiltros}
              className="h-12 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* TABELA */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Lista de comentários e feedbacks
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {feedbacksFiltrados.length} resultado(s)
            </p>
          </div>

          {carregando ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <FaSyncAlt className="animate-spin" />
                A carregar feedbacks...
              </div>
            </div>
          ) : feedbacksFiltrados.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FaCommentDots size={24} />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Nenhum feedback encontrado
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Não existem comentários ou feedbacks correspondentes aos filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Utilizador
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Tipo
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Classificação
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Comentário
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Data
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Acções
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {feedbacksFiltrados.map(
                    (feedback) => (
                      <tr
                        key={feedback.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {feedback.utilizador
                              ?.foto_url ? (
                              <img
                                src={
                                  feedback
                                    .utilizador
                                    .foto_url
                                }
                                alt=""
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#1f3b8f]">
                                <FaUser />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {feedback
                                  .utilizador
                                  ?.nome_completo ||
                                  "Utilizador"}
                              </p>

                              <p className="truncate text-xs text-slate-500">
                                {feedback
                                  .utilizador
                                  ?.email ||
                                  feedback.utilizador_id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#1f3b8f]">
                            {nomeTipo(
                              feedback.tipo
                            )}
                          </span>

                          {feedback.curso && (
                            <p className="mt-2 flex max-w-[220px] items-center gap-1 truncate text-xs text-slate-500">
                              <FaBook className="shrink-0" />
                              {
                                feedback.curso
                                  .titulo
                              }
                            </p>
                          )}

                          {feedback.conteudo && (
                            <p className="mt-1 flex max-w-[220px] items-center gap-1 truncate text-xs text-slate-500">
                              <FaFileAlt className="shrink-0" />
                              {
                                feedback
                                  .conteudo
                                  .titulo
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          {mostrarEstrelas(
                            feedback.classificacao
                          )}

                          <p className="mt-1 text-xs text-slate-500">
                            {feedback.classificacao}/5
                          </p>
                        </td>

                        <td className="max-w-[380px] px-6 py-5">
                          <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                            {feedback.comentario}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500">
                          {dataFormatada(
                            feedback.criado_em
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              title="Visualizar"
                              onClick={() =>
                                abrirVisualizacao(
                                  feedback
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1f3b8f] transition hover:bg-blue-100"
                            >
                              <FaEye />
                            </button>

                            <button
                              type="button"
                              title="Editar"
                              onClick={() =>
                                abrirEdicao(
                                  feedback
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                            >
                              <FaEdit />
                            </button>

                            <button
                              type="button"
                              title="Eliminar"
                              disabled={
                                eliminandoId ===
                                feedback.id
                              }
                              onClick={() =>
                                eliminarFeedback(
                                  feedback
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {eliminandoId ===
                              feedback.id ? (
                                <FaSyncAlt className="animate-spin" />
                              ) : (
                                <FaTrash />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* MODAL */}

      {modal && selecionado && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(evento) => {
            if (
              evento.target ===
              evento.currentTarget
            ) {
              fecharModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {modal === "visualizar"
                    ? "Detalhes do feedback"
                    : "Editar feedback"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Feedback #{selecionado.id}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={guardando}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Utilizador
                </p>

                <div className="flex items-center gap-3">
                  {selecionado.utilizador
                    ?.foto_url ? (
                    <img
                      src={
                        selecionado
                          .utilizador
                          .foto_url
                      }
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-[#1f3b8f]">
                      <FaUser />
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-slate-900">
                      {selecionado.utilizador
                        ?.nome_completo ||
                        "Utilizador"}
                    </p>

                    <p className="text-sm text-slate-500">
                      {selecionado.utilizador
                        ?.email ||
                        selecionado.utilizador_id}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Tipo
                </p>

                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-[#1f3b8f]">
                  {nomeTipo(
                    selecionado.tipo
                  )}
                </span>
              </div>

              {selecionado.curso && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">
                    Curso
                  </p>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FaBook className="text-[#1f3b8f]" />

                    {
                      selecionado.curso
                        .titulo
                    }
                  </div>
                </div>
              )}

              {selecionado.conteudo && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">
                    Conteúdo
                  </p>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FaFileAlt className="text-[#1f3b8f]" />

                    {
                      selecionado
                        .conteudo.titulo
                    }
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Classificação
                </p>

                {modal === "editar" ? (
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(
                      (numero) => (
                        <button
                          key={numero}
                          type="button"
                          onClick={() =>
                            setClassificacao(
                              numero
                            )
                          }
                          className="text-3xl transition hover:scale-110"
                        >
                          <FaStar
                            className={
                              numero <=
                              classificacao
                                ? "text-yellow-400"
                                : "text-slate-200"
                            }
                          />
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  mostrarEstrelas(
                    selecionado.classificacao
                  )
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Comentário
                </label>

                {modal === "editar" ? (
                  <>
                    <textarea
                      value={comentario}
                      onChange={(evento) =>
                        setComentario(
                          evento.target.value
                        )
                      }
                      maxLength={2000}
                      rows={7}
                      className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-[#1f3b8f] focus:ring-2 focus:ring-blue-100"
                    />

                    <p className="mt-2 text-right text-xs text-slate-400">
                      {comentario.length}/2000
                    </p>
                  </>
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                    {selecionado.comentario}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Registado em
                </p>

                <p className="text-sm text-slate-500">
                  {dataFormatada(
                    selecionado.criado_em
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={fecharModal}
                disabled={guardando}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {modal === "visualizar"
                  ? "Fechar"
                  : "Cancelar"}
              </button>

              {modal === "editar" && (
                <button
                  type="button"
                  onClick={guardarAlteracoes}
                  disabled={
                    guardando ||
                    !comentario.trim()
                  }
                  className="rounded-xl bg-[#1f3b8f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#193276] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardando
                    ? "A guardar..."
                    : "Guardar alterações"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}