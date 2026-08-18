"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaBookOpen,
  FaEdit,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTrash,
  FaTimes,
  FaSave,
} from "react-icons/fa";

import { supabase } from "@/lib/supabase";

interface Curso {
  id: number;
  titulo: string;
}

interface Modulo {
  id: number;
  curso_id: number;
  titulo: string;
  curso?: Curso | null;
}

interface Conteudo {
  id: number;
  modulo_id: number;
  titulo: string;
  descricao: string;
  tipo: string;
  conteudo_url: string | null;
  ordem: number;
  criado_em: string;
  modulo?: {
    id: number;
    titulo: string;
    curso?: {
      id: number;
      titulo: string;
    } | null;
  } | null;
}

interface FormularioConteudo {
  modulo_id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  conteudo_url: string;
  ordem: string;
}

const formularioInicial: FormularioConteudo = {
  modulo_id: "",
  titulo: "",
  descricao: "",
  tipo: "",
  conteudo_url: "",
  ordem: "1",
};

export default function ConteudosPage() {
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);

  const [pesquisa, setPesquisa] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);

  const [conteudoSelecionado, setConteudoSelecionado] =
    useState<Conteudo | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioConteudo>(formularioInicial);

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] =
    useState<"sucesso" | "erro">("sucesso");

  const [eliminandoId, setEliminandoId] =
    useState<number | null>(null);

  // =========================================================
  // CONFIRMAÇÃO DE ELIMINAÇÃO
  // =========================================================

  const [
    modalConfirmacaoAberto,
    setModalConfirmacaoAberto,
  ] = useState(false);

  const [
    conteudoParaEliminar,
    setConteudoParaEliminar,
  ] = useState<Conteudo | null>(null);

  // =========================================================
  // MENSAGENS
  // =========================================================

  function mostrarMensagem(
    texto: string,
    tipo: "sucesso" | "erro"
  ) {
    setMensagem(texto);
    setTipoMensagem(tipo);

    window.setTimeout(() => {
      setMensagem("");
    }, 4000);
  }

  // =========================================================
  // CARREGAR DADOS
  // =========================================================

  async function carregarDados() {
    try {
      setCarregando(true);

      const [
        { data: dadosConteudos, error: erroConteudos },
        { data: dadosModulos, error: erroModulos },
      ] = await Promise.all([
        supabase
          .from("conteudos")
          .select(`
            id,
            modulo_id,
            titulo,
            descricao,
            tipo,
            conteudo_url,
            ordem,
            criado_em,
            modulo:modulos (
              id,
              titulo,
              curso:cursos (
                id,
                titulo
              )
            )
          `)
          .order("modulo_id", { ascending: true })
          .order("ordem", { ascending: true }),

        supabase
          .from("modulos")
          .select(`
            id,
            curso_id,
            titulo,
            curso:cursos (
              id,
              titulo
            )
          `)
          .order("curso_id", { ascending: true })
          .order("ordem", { ascending: true }),
      ]);

      if (erroConteudos) {
        console.error(
          "Erro ao carregar conteúdos:",
          erroConteudos
        );

        mostrarMensagem(
          "Não foi possível carregar os conteúdos.",
          "erro"
        );

        return;
      }

      if (erroModulos) {
        console.error(
          "Erro ao carregar módulos:",
          erroModulos
        );

        mostrarMensagem(
          "Não foi possível carregar os módulos.",
          "erro"
        );

        return;
      }

      const conteudosNormalizados: Conteudo[] = (
        (dadosConteudos ?? []) as any[]
      ).map((conteudo) => {
        const moduloBruto = Array.isArray(conteudo.modulo)
          ? conteudo.modulo[0] ?? null
          : conteudo.modulo ?? null;

        let moduloNormalizado: Conteudo["modulo"] = null;

        if (moduloBruto) {
          const cursoBruto = Array.isArray(
            moduloBruto.curso
          )
            ? moduloBruto.curso[0] ?? null
            : moduloBruto.curso ?? null;

          moduloNormalizado = {
            id: Number(moduloBruto.id),
            titulo: String(
              moduloBruto.titulo ?? ""
            ),
            curso: cursoBruto
              ? {
                  id: Number(cursoBruto.id),
                  titulo: String(
                    cursoBruto.titulo ?? ""
                  ),
                }
              : null,
          };
        }

        return {
          id: Number(conteudo.id),
          modulo_id: Number(conteudo.modulo_id),
          titulo: String(conteudo.titulo ?? ""),
          descricao: String(
            conteudo.descricao ?? ""
          ),
          tipo: String(conteudo.tipo ?? ""),
          conteudo_url: conteudo.conteudo_url
            ? String(conteudo.conteudo_url)
            : null,
          ordem: Number(
            conteudo.ordem ?? 0
          ),
          criado_em: String(
            conteudo.criado_em ?? ""
          ),
          modulo: moduloNormalizado,
        };
      });

      const modulosNormalizados: Modulo[] = (
        (dadosModulos ?? []) as any[]
      ).map((modulo) => {
        const cursoBruto = Array.isArray(
          modulo.curso
        )
          ? modulo.curso[0] ?? null
          : modulo.curso ?? null;

        return {
          id: Number(modulo.id),
          curso_id: Number(modulo.curso_id),
          titulo: String(modulo.titulo ?? ""),
          curso: cursoBruto
            ? {
                id: Number(cursoBruto.id),
                titulo: String(
                  cursoBruto.titulo ?? ""
                ),
              }
            : null,
        };
      });

      setConteudos(conteudosNormalizados);
      setModulos(modulosNormalizados);
    } catch (erro) {
      console.error(
        "Erro inesperado ao carregar dados:",
        erro
      );

      mostrarMensagem(
        "Ocorreu um erro inesperado ao carregar os dados.",
        "erro"
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  // =========================================================
  // PESQUISA
  // =========================================================

  const conteudosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      return conteudos;
    }

    return conteudos.filter((conteudo) => {
      const tituloModulo =
        conteudo.modulo?.titulo ?? "";

      const tituloCurso =
        conteudo.modulo?.curso?.titulo ?? "";

      return (
        conteudo.titulo
          .toLowerCase()
          .includes(termo) ||
        conteudo.descricao
          .toLowerCase()
          .includes(termo) ||
        conteudo.tipo
          .toLowerCase()
          .includes(termo) ||
        tituloModulo
          .toLowerCase()
          .includes(termo) ||
        tituloCurso
          .toLowerCase()
          .includes(termo)
      );
    });
  }, [conteudos, pesquisa]);

  // =========================================================
  // NOVO CONTEÚDO
  // =========================================================

  function abrirNovoConteudo() {
    setModoEdicao(false);
    setConteudoSelecionado(null);
    setFormulario(formularioInicial);
    setModalAberto(true);
  }

  // =========================================================
  // EDITAR CONTEÚDO
  // =========================================================

  function abrirEditarConteudo(
    conteudo: Conteudo
  ) {
    setModoEdicao(true);
    setConteudoSelecionado(conteudo);

    setFormulario({
      modulo_id: String(conteudo.modulo_id),
      titulo: conteudo.titulo,
      descricao: conteudo.descricao,
      tipo: conteudo.tipo,
      conteudo_url:
        conteudo.conteudo_url ?? "",
      ordem: String(conteudo.ordem),
    });

    setModalAberto(true);
  }

  // =========================================================
  // FECHAR MODAL
  // =========================================================

  function fecharModal() {
    if (guardando) {
      return;
    }

    setModalAberto(false);
    setConteudoSelecionado(null);
    setFormulario(formularioInicial);
  }

  // =========================================================
  // ALTERAR FORMULÁRIO
  // =========================================================

  function alterarFormulario(
    campo: keyof FormularioConteudo,
    valor: string
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  // =========================================================
  // GUARDAR CONTEÚDO
  // =========================================================

  async function guardarConteudo() {
    if (guardando) {
      return;
    }

    const moduloId = Number(
      formulario.modulo_id
    );

    const ordem = Number(
      formulario.ordem
    );

    if (!formulario.modulo_id) {
      mostrarMensagem(
        "Seleccione um módulo.",
        "erro"
      );
      return;
    }

    if (!formulario.titulo.trim()) {
      mostrarMensagem(
        "Informe o título do conteúdo.",
        "erro"
      );
      return;
    }

    if (!formulario.descricao.trim()) {
      mostrarMensagem(
        "Informe a descrição do conteúdo.",
        "erro"
      );
      return;
    }

    const tipoNormalizado =
      formulario.tipo
        .trim()
        .toUpperCase();

    if (
      !["TEXTO", "VIDEO", "PDF"].includes(
        tipoNormalizado
      )
    ) {
      mostrarMensagem(
        "Seleccione um tipo de conteúdo válido: Texto, Vídeo ou PDF.",
        "erro"
      );
      return;
    }

    if (
      !Number.isInteger(moduloId) ||
      moduloId <= 0
    ) {
      mostrarMensagem(
        "O módulo seleccionado é inválido.",
        "erro"
      );
      return;
    }

    if (
      !Number.isInteger(ordem) ||
      ordem <= 0
    ) {
      mostrarMensagem(
        "A ordem deve ser um número inteiro maior que zero.",
        "erro"
      );
      return;
    }

    try {
      setGuardando(true);

      const dados = {
        modulo_id: moduloId,
        titulo:
          formulario.titulo.trim(),
        descricao:
          formulario.descricao.trim(),
        tipo: tipoNormalizado,
        conteudo_url:
          formulario.conteudo_url.trim() ||
          null,
        ordem,
      };

      console.log(
        "Dados enviados para criação/actualização:",
        dados
      );

      if (
        modoEdicao &&
        conteudoSelecionado
      ) {
        const { error } =
          await supabase
            .from("conteudos")
            .update(dados)
            .eq(
              "id",
              conteudoSelecionado.id
            );

        if (error) {
          console.error(
            "Erro ao actualizar conteúdo:",
            error
          );

          mostrarMensagem(
            `Não foi possível actualizar o conteúdo. ${error.message}`,
            "erro"
          );

          return;
        }

        mostrarMensagem(
          "Conteúdo actualizado com sucesso.",
          "sucesso"
        );
      } else {
        const { error } =
          await supabase
            .from("conteudos")
            .insert(dados);

        if (error) {
          console.error(
            "Erro ao criar conteúdo:",
            error
          );

          mostrarMensagem(
            `Não foi possível criar o conteúdo. ${error.message}`,
            "erro"
          );

          return;
        }

        mostrarMensagem(
          "Conteúdo criado com sucesso.",
          "sucesso"
        );
      }

      fecharModal();
      await carregarDados();
    } catch (erro) {
      console.error(
        "Erro inesperado ao guardar conteúdo:",
        erro
      );

      mostrarMensagem(
        "Ocorreu um erro inesperado ao guardar o conteúdo.",
        "erro"
      );
    } finally {
      setGuardando(false);
    }
  }

  // =========================================================
  // ABRIR CONFIRMAÇÃO DE ELIMINAÇÃO
  // =========================================================

  function abrirConfirmacaoEliminacao(
    conteudo: Conteudo
  ) {
    if (eliminandoId !== null) {
      return;
    }

    setConteudoParaEliminar(conteudo);
    setModalConfirmacaoAberto(true);
  }

  // =========================================================
  // FECHAR CONFIRMAÇÃO
  // =========================================================

  function fecharConfirmacaoEliminacao() {
    if (eliminandoId !== null) {
      return;
    }

    setModalConfirmacaoAberto(false);
    setConteudoParaEliminar(null);
  }

  // =========================================================
  // ELIMINAR CONTEÚDO
  // =========================================================

  async function confirmarEliminacaoConteudo() {
    if (!conteudoParaEliminar) {
      return;
    }

    if (eliminandoId !== null) {
      return;
    }

    const conteudo =
      conteudoParaEliminar;

    try {
      setEliminandoId(conteudo.id);

      const { error } =
        await supabase
          .from("conteudos")
          .delete()
          .eq("id", conteudo.id);

      if (error) {
        console.error(
          "Erro ao eliminar conteúdo:",
          error
        );

        mostrarMensagem(
          `Não foi possível eliminar o conteúdo. ${error.message}`,
          "erro"
        );

        return;
      }

      setModalConfirmacaoAberto(false);
      setConteudoParaEliminar(null);

      mostrarMensagem(
        "Conteúdo eliminado com sucesso.",
        "sucesso"
      );

      await carregarDados();
    } catch (erro) {
      console.error(
        "Erro inesperado ao eliminar conteúdo:",
        erro
      );

      mostrarMensagem(
        "Ocorreu um erro inesperado ao eliminar o conteúdo.",
        "erro"
      );
    } finally {
      setEliminandoId(null);
    }
  }

  // =========================================================
  // NOME DO TIPO
  // =========================================================

  function obterNomeTipo(tipo: string) {
    switch (tipo.toUpperCase()) {
      case "TEXTO":
        return "Texto";

      case "VIDEO":
        return "Vídeo";

      case "PDF":
        return "PDF";

      default:
        return tipo;
    }
  }

  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-50 p-6 lg:p-8">

      {/* =====================================================
          MENSAGEM
      ===================================================== */}

      {mensagem && (
        <div
          className={`fixed right-6 top-6 z-[100] flex max-w-md items-start gap-4 rounded-2xl border px-5 py-4 shadow-xl ${
            tipoMensagem === "sucesso"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex-1 font-semibold">
            {mensagem}
          </div>

          <button
            type="button"
            onClick={() => setMensagem("")}
            className="text-gray-500 transition hover:text-gray-900"
            aria-label="Fechar mensagem"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <section className="mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestão de Conteúdos
            </h1>

            <p className="mt-2 text-gray-600">
              Organize os conteúdos de aprendizagem associados
              aos módulos dos cursos do SICSI.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNovoConteudo}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-900"
          >
            <FaPlus />
            Novo Conteúdo
          </button>

        </div>
      </section>

      {/* =====================================================
          PESQUISA
      ===================================================== */}

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
              placeholder="Pesquisar conteúdos..."
              aria-label="Pesquisar conteúdos"
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
                carregando
                  ? "animate-spin"
                  : ""
              }
            />

            Actualizar
          </button>

        </div>

        <div className="mt-5">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
            {conteudosFiltrados.length}{" "}
            {conteudosFiltrados.length === 1
              ? "conteúdo"
              : "conteúdos"}
          </span>
        </div>

      </section>

      {/* =====================================================
          CONTEÚDO
      ===================================================== */}

      {carregando ? (

        <section className="rounded-3xl bg-white p-12 text-center shadow-sm">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-800" />

          <p className="mt-4 font-medium text-gray-600">
            A carregar conteúdos...
          </p>

        </section>

      ) : conteudosFiltrados.length === 0 ? (

        <section className="rounded-3xl bg-white p-12 text-center shadow-sm">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100">
            <FaBookOpen className="text-3xl text-blue-800" />
          </div>

          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Nenhum conteúdo encontrado
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-gray-600">
            {pesquisa
              ? "Nenhum conteúdo corresponde à pesquisa realizada."
              : "Ainda não existem conteúdos registados no SICSI."}
          </p>

          {!pesquisa && (
            <button
              type="button"
              onClick={abrirNovoConteudo}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white transition hover:bg-blue-900"
            >
              <FaPlus />
              Criar primeiro conteúdo
            </button>
          )}

        </section>

      ) : (

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px]">

              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">

                  <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Curso
                  </th>

                  <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Módulo
                  </th>

                  <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Conteúdo
                  </th>

                  <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Tipo
                  </th>

                  <th className="px-6 py-5 text-center text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Ordem
                  </th>

                  <th className="px-6 py-5 text-right text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Acções
                  </th>

                </tr>
              </thead>

              <tbody>

                {conteudosFiltrados.map(
                  (conteudo) => (

                    <tr
                      key={conteudo.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >

                      <td className="px-6 py-5">
                        <div className="font-semibold text-gray-900">
                          {conteudo.modulo?.curso
                            ?.titulo ??
                            "Curso não encontrado"}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="font-semibold text-gray-900">
                          {conteudo.modulo?.titulo ??
                            "Módulo não encontrado"}
                        </div>
                      </td>

                      <td className="max-w-md px-6 py-5">

                        <div className="font-semibold text-gray-900">
                          {conteudo.titulo}
                        </div>

                        <p className="mt-1 truncate text-sm text-gray-500">
                          {conteudo.descricao}
                        </p>

                        {conteudo.conteudo_url && (
                          <a
                            href={
                              conteudo.conteudo_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block max-w-md truncate text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            Abrir recurso externo
                          </a>
                        )}

                      </td>

                      <td className="px-6 py-5">

                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                            conteudo.tipo ===
                            "VIDEO"
                              ? "bg-red-100 text-red-700"
                              : conteudo.tipo ===
                                "PDF"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {obterNomeTipo(
                            conteudo.tipo
                          )}
                        </span>

                      </td>

                      <td className="px-6 py-5 text-center">

                        <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">
                          {conteudo.ordem}
                        </span>

                      </td>

                      <td className="px-6 py-5">

                        <div className="flex items-center justify-end gap-2">

                          {/* EDITAR */}

                          <button
                            type="button"
                            onClick={() =>
                              abrirEditarConteudo(
                                conteudo
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            <FaEdit />
                            Editar
                          </button>

                          {/* ELIMINAR */}

                          <button
                            type="button"
                            onClick={() =>
                              abrirConfirmacaoEliminacao(
                                conteudo
                              )
                            }
                            disabled={
                              eliminandoId ===
                              conteudo.id
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <FaTrash />

                            {eliminandoId ===
                            conteudo.id
                              ? "A eliminar..."
                              : "Eliminar"}
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

      {/* =====================================================
          MODAL — CRIAR / EDITAR CONTEÚDO
      ===================================================== */}

      {modalAberto && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* Cabeçalho */}

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>

                <h2 className="text-2xl font-bold text-gray-900">
                  {modoEdicao
                    ? "Editar conteúdo"
                    : "Novo conteúdo"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {modoEdicao
                    ? "Actualize as informações do conteúdo."
                    : "Adicione um novo recurso de aprendizagem ao SICSI."}
                </p>

              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={guardando}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Fechar"
              >
                <FaTimes />
              </button>

            </div>

            {/* Corpo */}

            <div className="max-h-[calc(90vh-170px)] overflow-y-auto px-6 py-6">

              <div className="space-y-6">

                {/* Módulo */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Módulo *
                  </label>

                  <select
                    value={
                      formulario.modulo_id
                    }
                    onChange={(e) =>
                      alterarFormulario(
                        "modulo_id",
                        e.target.value
                      )
                    }
                    disabled={guardando}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >

                    <option value="">
                      Seleccionar módulo
                    </option>

                    {modulos.map(
                      (modulo) => (
                        <option
                          key={modulo.id}
                          value={modulo.id}
                        >
                          {modulo.curso
                            ?.titulo
                            ? `${modulo.curso.titulo} — ${modulo.titulo}`
                            : modulo.titulo}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* Título */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Título *
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.titulo
                    }
                    onChange={(e) =>
                      alterarFormulario(
                        "titulo",
                        e.target.value
                      )
                    }
                    disabled={guardando}
                    placeholder="Ex.: O que é Cibersegurança"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />

                </div>

                {/* Descrição */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Descrição *
                  </label>

                  <textarea
                    value={
                      formulario.descricao
                    }
                    onChange={(e) =>
                      alterarFormulario(
                        "descricao",
                        e.target.value
                      )
                    }
                    disabled={guardando}
                    rows={5}
                    placeholder="Descreva brevemente este conteúdo."
                    className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />

                </div>

                {/* Tipo e ordem */}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      Tipo *
                    </label>

                    <select
                      value={
                        formulario.tipo
                      }
                      onChange={(e) =>
                        alterarFormulario(
                          "tipo",
                          e.target.value
                        )
                      }
                      disabled={guardando}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >

                      <option value="">
                        Seleccionar tipo
                      </option>

                      <option value="TEXTO">
                        Texto
                      </option>

                      <option value="VIDEO">
                        Vídeo
                      </option>

                      <option value="PDF">
                        PDF
                      </option>

                    </select>

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      Ordem *
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        formulario.ordem
                      }
                      onChange={(e) =>
                        alterarFormulario(
                          "ordem",
                          e.target.value
                        )
                      }
                      disabled={guardando}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />

                  </div>

                </div>

                {/* URL */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    URL do conteúdo
                  </label>

                  <input
                    type="url"
                    value={
                      formulario.conteudo_url
                    }
                    onChange={(e) =>
                      alterarFormulario(
                        "conteudo_url",
                        e.target.value
                      )
                    }
                    disabled={guardando}
                    placeholder="https://exemplo.com/recurso"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />

                  <p className="mt-2 text-sm text-gray-500">
                    Opcional. Pode apontar para um
                    vídeo, PDF, artigo ou outro recurso
                    externo de aprendizagem.
                  </p>

                </div>

              </div>

            </div>

            {/* Rodapé */}

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-5 sm:flex-row sm:justify-end">

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
                onClick={guardarConteudo}
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {guardando ? (
                  <>
                    <FaSyncAlt className="animate-spin" />
                    A guardar...
                  </>
                ) : (
                  <>
                    <FaSave />
                    {modoEdicao
                      ? "Guardar alterações"
                      : "Criar conteúdo"}
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          MODAL — CONFIRMAÇÃO DE ELIMINAÇÃO
      ===================================================== */}

      {modalConfirmacaoAberto &&
        conteudoParaEliminar && (

          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmacao-conteudo"
          >

            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

              {/* Cabeçalho */}

              <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-5">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100">
                  <FaTrash className="text-xl text-red-600" />
                </div>

                <div>

                  <h2
                    id="titulo-confirmacao-conteudo"
                    className="text-xl font-bold text-gray-900"
                  >
                    Eliminar conteúdo
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Confirmação necessária
                  </p>

                </div>

              </div>

              {/* Corpo */}

              <div className="px-6 py-6">

                <p className="text-gray-700">
                  Tem a certeza de que pretende
                  eliminar este conteúdo?
                </p>

                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-4">

                  <p className="font-bold text-red-800">
                    "{conteudoParaEliminar.titulo}"
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    Esta acção não poderá ser desfeita.
                  </p>

                </div>

                <p className="mt-4 text-sm leading-6 text-gray-500">
                  O conteúdo será removido da lista
                  de aprendizagem do SICSI.
                </p>

              </div>

              {/* Acções */}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    fecharConfirmacaoEliminacao
                  }
                  disabled={
                    eliminandoId !== null
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaTimes />
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    confirmarEliminacaoConteudo
                  }
                  disabled={
                    eliminandoId !== null
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {eliminandoId !== null ? (
                    <>
                      <FaSyncAlt className="animate-spin" />
                      A eliminar...
                    </>
                  ) : (
                    <>
                      <FaTrash />
                      Sim, eliminar
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