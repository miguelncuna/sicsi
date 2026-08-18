"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaBookOpen,
  FaEdit,
  FaExclamationTriangle,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTrash,
  FaTimes,
  FaSave,
  FaLayerGroup,
} from "react-icons/fa";

import { supabase } from "@/lib/supabase";

interface Modulo {
  id: number;
  titulo: string;
}

interface Simulacao {
  id: number;
  modulo_id: number;
  titulo: string;
  descricao: string;
  nivel: "FACIL" | "MEDIO" | "DIFICIL";
  criado_em: string;
  modulo?: Modulo | null;
}

interface FormularioSimulacao {
  modulo_id: string;
  titulo: string;
  descricao: string;
  nivel: "FACIL" | "MEDIO" | "DIFICIL";
}

const formularioInicial: FormularioSimulacao = {
  modulo_id: "",
  titulo: "",
  descricao: "",
  nivel: "FACIL",
};

export default function SimulacoesAdminPage() {
  const [simulacoes, setSimulacoes] = useState<Simulacao[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);

  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [modalEliminacaoAberto, setModalEliminacaoAberto] =
    useState(false);

  const [simulacaoSelecionada, setSimulacaoSelecionada] =
    useState<Simulacao | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioSimulacao>(formularioInicial);

  const [mensagem, setMensagem] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  async function carregarDados() {
    try {
      setCarregando(true);

      const [resultadoSimulacoes, resultadoModulos] =
        await Promise.all([
          supabase
            .from("simulacoes")
            .select(
              `
                id,
                modulo_id,
                titulo,
                descricao,
                nivel,
                criado_em
              `
            )
            .order("modulo_id", { ascending: true })
            .order("id", { ascending: true }),

          supabase
            .from("modulos")
            .select("id, titulo")
            .order("curso_id", { ascending: true })
            .order("ordem", { ascending: true }),
        ]);

      if (resultadoSimulacoes.error) {
        console.error(
          "Erro ao carregar simulações:",
          resultadoSimulacoes.error
        );

        mostrarMensagem(
          "erro",
          "Não foi possível carregar as simulações."
        );

        return;
      }

      if (resultadoModulos.error) {
        console.error(
          "Erro ao carregar módulos:",
          resultadoModulos.error
        );

        mostrarMensagem(
          "erro",
          "Não foi possível carregar os módulos."
        );

        return;
      }

      const dadosSimulacoes =
        (resultadoSimulacoes.data ?? []) as Simulacao[];

      const dadosModulos =
        (resultadoModulos.data ?? []) as Modulo[];

      const simulacoesComModulo = dadosSimulacoes.map((simulacao) => ({
        ...simulacao,
        modulo:
          dadosModulos.find(
            (modulo) => modulo.id === simulacao.modulo_id
          ) ?? null,
      }));

      setSimulacoes(simulacoesComModulo);
      setModulos(dadosModulos);
    } catch (erro) {
      console.error("Erro inesperado:", erro);

      mostrarMensagem(
        "erro",
        "Ocorreu um erro inesperado ao carregar os dados."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function mostrarMensagem(
    tipo: "sucesso" | "erro",
    texto: string
  ) {
    setMensagem({
      tipo,
      texto,
    });

    window.setTimeout(() => {
      setMensagem(null);
    }, 4000);
  }

  function abrirModalNovo() {
    setSimulacaoSelecionada(null);

    setFormulario({
      ...formularioInicial,
      modulo_id: modulos.length > 0 ? String(modulos[0].id) : "",
    });

    setModalAberto(true);
    setMensagem(null);
  }

  function abrirModalEditar(simulacao: Simulacao) {
    setSimulacaoSelecionada(simulacao);

    setFormulario({
      modulo_id: String(simulacao.modulo_id),
      titulo: simulacao.titulo,
      descricao: simulacao.descricao,
      nivel: simulacao.nivel,
    });

    setModalAberto(true);
    setMensagem(null);
  }

  function fecharModal() {
    if (guardando) {
      return;
    }

    setModalAberto(false);
    setSimulacaoSelecionada(null);
    setFormulario(formularioInicial);
  }

  function abrirModalEliminacao(simulacao: Simulacao) {
    setSimulacaoSelecionada(simulacao);
    setModalEliminacaoAberto(true);
    setMensagem(null);
  }

  function fecharModalEliminacao() {
    if (eliminando) {
      return;
    }

    setModalEliminacaoAberto(false);
    setSimulacaoSelecionada(null);
  }

  async function guardarSimulacao() {
    const titulo = formulario.titulo.trim();
    const descricao = formulario.descricao.trim();

    if (!formulario.modulo_id) {
      mostrarMensagem(
        "erro",
        "Seleccione o módulo da simulação."
      );
      return;
    }

    if (!titulo) {
      mostrarMensagem(
        "erro",
        "Informe o título da simulação."
      );
      return;
    }

    if (!descricao) {
      mostrarMensagem(
        "erro",
        "Informe a descrição da simulação."
      );
      return;
    }

    try {
      setGuardando(true);

      const dados = {
        modulo_id: Number(formulario.modulo_id),
        titulo,
        descricao,
        nivel: formulario.nivel,
      };

      if (simulacaoSelecionada) {
        const { error } = await supabase
          .from("simulacoes")
          .update(dados)
          .eq("id", simulacaoSelecionada.id);

        if (error) {
          console.error(
            "Erro ao actualizar simulação:",
            error
          );

          mostrarMensagem(
            "erro",
            "Não foi possível actualizar a simulação."
          );

          return;
        }

        mostrarMensagem(
          "sucesso",
          "Simulação actualizada com sucesso."
        );
      } else {
        const { error } = await supabase
          .from("simulacoes")
          .insert([dados]);

        if (error) {
          console.error(
            "Erro ao criar simulação:",
            error
          );

          mostrarMensagem(
            "erro",
            "Não foi possível criar a simulação."
          );

          return;
        }

        mostrarMensagem(
          "sucesso",
          "Simulação criada com sucesso."
        );
      }

      setModalAberto(false);
      setSimulacaoSelecionada(null);
      setFormulario(formularioInicial);

      await carregarDados();
    } catch (erro) {
      console.error(
        "Erro inesperado ao guardar simulação:",
        erro
      );

      mostrarMensagem(
        "erro",
        "Ocorreu um erro inesperado ao guardar a simulação."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarSimulacao() {
    if (!simulacaoSelecionada) {
      return;
    }

    try {
      setEliminando(true);

      const { error } = await supabase
        .from("simulacoes")
        .delete()
        .eq("id", simulacaoSelecionada.id);

      if (error) {
        console.error(
          "Erro ao eliminar simulação:",
          error
        );

        mostrarMensagem(
          "erro",
          "Não foi possível eliminar a simulação."
        );

        return;
      }

      setModalEliminacaoAberto(false);

      const tituloEliminado =
        simulacaoSelecionada.titulo;

      setSimulacaoSelecionada(null);

      mostrarMensagem(
        "sucesso",
        `A simulação "${tituloEliminado}" foi eliminada com sucesso.`
      );

      await carregarDados();
    } catch (erro) {
      console.error(
        "Erro inesperado ao eliminar simulação:",
        erro
      );

      mostrarMensagem(
        "erro",
        "Ocorreu um erro inesperado ao eliminar a simulação."
      );
    } finally {
      setEliminando(false);
    }
  }

  const simulacoesFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      return simulacoes;
    }

    return simulacoes.filter((simulacao) => {
      const tituloModulo =
        simulacao.modulo?.titulo ?? "";

      return (
        simulacao.titulo
          .toLowerCase()
          .includes(termo) ||
        simulacao.descricao
          .toLowerCase()
          .includes(termo) ||
        simulacao.nivel
          .toLowerCase()
          .includes(termo) ||
        tituloModulo
          .toLowerCase()
          .includes(termo)
      );
    });
  }, [simulacoes, pesquisa]);

  function obterTextoNivel(
    nivel: Simulacao["nivel"]
  ) {
    switch (nivel) {
      case "FACIL":
        return "Fácil";
      case "MEDIO":
        return "Médio";
      case "DIFICIL":
        return "Difícil";
      default:
        return nivel;
    }
  }

  function obterClassesNivel(
    nivel: Simulacao["nivel"]
  ) {
    switch (nivel) {
      case "FACIL":
        return "bg-green-100 text-green-800";

      case "MEDIO":
        return "bg-yellow-100 text-yellow-800";

      case "DIFICIL":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 lg:p-8">
      {/* Cabeçalho */}
      <section className="mb-8 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
                <FaBookOpen className="text-2xl text-blue-800" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestão de Simulações
                </h1>

                <p className="mt-1 text-gray-600">
                  Crie e administre simulações práticas de
                  cibersegurança do SICSI.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={abrirModalNovo}
            disabled={modulos.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaPlus />
            Nova Simulação
          </button>
        </div>

        {modulos.length === 0 && !carregando && (
          <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            É necessário existir pelo menos um módulo antes de
            criar uma simulação.
          </div>
        )}
      </section>

      {/* Mensagem */}
      {mensagem && (
        <div
          className={`mb-6 flex items-center justify-between rounded-xl border px-5 py-4 shadow-sm ${
            mensagem.tipo === "sucesso"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <p className="font-medium">
            {mensagem.texto}
          </p>

          <button
            type="button"
            onClick={() => setMensagem(null)}
            className="ml-4 rounded-lg p-1 opacity-70 transition hover:opacity-100"
            aria-label="Fechar mensagem"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Pesquisa e estatísticas */}
      <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <FaSearch className="text-gray-400" />
            </div>

            <input
              type="search"
              value={pesquisa}
              onChange={(e) =>
                setPesquisa(e.target.value)
              }
              placeholder="Pesquisar simulações..."
              aria-label="Pesquisar simulações"
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            type="button"
            onClick={carregarDados}
            disabled={carregando}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaSyncAlt
              className={
                carregando ? "animate-spin" : ""
              }
            />
            Actualizar
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
            {simulacoesFiltradas.length}{" "}
            {simulacoesFiltradas.length === 1
              ? "simulação"
              : "simulações"}
          </span>

          <span className="inline-flex items-center rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
            {modulos.length}{" "}
            {modulos.length === 1
              ? "módulo disponível"
              : "módulos disponíveis"}
          </span>
        </div>
      </section>

      {/* Conteúdo */}
      {carregando ? (
        <section className="rounded-3xl bg-white p-12 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-800" />

          <p className="mt-4 font-medium text-gray-600">
            A carregar simulações...
          </p>
        </section>
      ) : simulacoesFiltradas.length === 0 ? (
        <section className="rounded-3xl bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100">
            <FaBookOpen className="text-3xl text-blue-800" />
          </div>

          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Nenhuma simulação encontrada
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-gray-600">
            {pesquisa
              ? "Nenhuma simulação corresponde à pesquisa realizada."
              : "Ainda não existem simulações registadas no SICSI."}
          </p>

          {!pesquisa && modulos.length > 0 && (
            <button
              type="button"
              onClick={abrirModalNovo}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white transition hover:bg-blue-900"
            >
              <FaPlus />
              Criar primeira simulação
            </button>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Módulo
                  </th>

                  <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Simulação
                  </th>

                  <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Descrição
                  </th>

                  <th className="px-6 py-5 text-center text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Nível
                  </th>

                  <th className="px-6 py-5 text-right text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Acções
                  </th>
                </tr>
              </thead>

              <tbody>
                {simulacoesFiltradas.map(
                  (simulacao) => (
                    <tr
                      key={simulacao.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                            <FaLayerGroup className="text-blue-800" />
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900">
                              {simulacao.modulo
                                ?.titulo ??
                                "Módulo não encontrado"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              ID do módulo:{" "}
                              {simulacao.modulo_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {simulacao.titulo}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            ID: {simulacao.id}
                          </p>
                        </div>
                      </td>

                      <td className="max-w-md px-6 py-5">
                        <p className="truncate text-gray-600">
                          {simulacao.descricao}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold ${obterClassesNivel(
                            simulacao.nivel
                          )}`}
                        >
                          {obterTextoNivel(
                            simulacao.nivel
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              abrirModalEditar(
                                simulacao
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 font-semibold text-blue-800 transition hover:bg-blue-100"
                          >
                            <FaEdit />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              abrirModalEliminacao(
                                simulacao
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            <FaTrash />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal criar / editar */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {simulacaoSelecionada
                    ? "Editar Simulação"
                    : "Nova Simulação"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {simulacaoSelecionada
                    ? "Actualize os dados da simulação."
                    : "Preencha os dados para criar uma nova simulação."}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={guardando}
                className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Fechar"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Módulo */}
              <div>
                <label
                  htmlFor="modulo"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Módulo *
                </label>

                <select
                  id="modulo"
                  value={formulario.modulo_id}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      modulo_id: e.target.value,
                    })
                  }
                  disabled={guardando}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                >
                  <option value="">
                    Seleccione um módulo
                  </option>

                  {modulos.map((modulo) => (
                    <option
                      key={modulo.id}
                      value={modulo.id}
                    >
                      {modulo.titulo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Título */}
              <div>
                <label
                  htmlFor="titulo"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Título *
                </label>

                <input
                  id="titulo"
                  type="text"
                  value={formulario.titulo}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      titulo: e.target.value,
                    })
                  }
                  disabled={guardando}
                  placeholder="Ex.: Identificação de Phishing"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                />
              </div>

              {/* Descrição */}
              <div>
                <label
                  htmlFor="descricao"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Descrição *
                </label>

                <textarea
                  id="descricao"
                  rows={5}
                  value={formulario.descricao}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      descricao: e.target.value,
                    })
                  }
                  disabled={guardando}
                  placeholder="Descreva a situação que será apresentada ao estudante..."
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                />
              </div>

              {/* Nível */}
              <div>
                <label
                  htmlFor="nivel"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Nível de dificuldade *
                </label>

                <select
                  id="nivel"
                  value={formulario.nivel}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      nivel:
                        e.target.value as FormularioSimulacao["nivel"],
                    })
                  }
                  disabled={guardando}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                >
                  <option value="FACIL">
                    Fácil
                  </option>

                  <option value="MEDIO">
                    Médio
                  </option>

                  <option value="DIFICIL">
                    Difícil
                  </option>
                </select>
              </div>
            </div>

            {/* Rodapé */}
            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-gray-100 bg-white px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={fecharModal}
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaTimes />
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarSimulacao}
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <FaSyncAlt className="animate-spin" />
                    A guardar...
                  </>
                ) : (
                  <>
                    <FaSave />
                    {simulacaoSelecionada
                      ? "Guardar alterações"
                      : "Criar simulação"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de eliminação */}
      {modalEliminacaoAberto &&
        simulacaoSelecionada && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <FaExclamationTriangle className="text-xl text-red-600" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Eliminar simulação
                    </h2>

                    <p className="mt-2 leading-relaxed text-gray-600">
                      Tem a certeza de que deseja eliminar
                      a simulação{" "}
                      <span className="font-semibold text-gray-900">
                        &quot;
                        {
                          simulacaoSelecionada.titulo
                        }
                        &quot;
                      </span>
                      ?
                    </p>

                    <p className="mt-3 text-sm text-gray-500">
                      Esta operação não poderá ser
                      desfeita.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 p-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fecharModalEliminacao}
                  disabled={eliminando}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaTimes />
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={eliminarSimulacao}
                  disabled={eliminando}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {eliminando ? (
                    <>
                      <FaSyncAlt className="animate-spin" />
                      A eliminar...
                    </>
                  ) : (
                    <>
                      <FaTrash />
                      Eliminar simulação
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}