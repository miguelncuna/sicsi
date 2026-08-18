"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaBook,
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
  descricao: string;
  ordem: number;
  criado_em: string;
}

interface FormularioModulo {
  curso_id: string;
  titulo: string;
  descricao: string;
  ordem: string;
}

const formularioInicial: FormularioModulo = {
  curso_id: "",
  titulo: "",
  descricao: "",
  ordem: "1",
};

export default function ModulosPage() {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);

  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [moduloSelecionado, setModuloSelecionado] =
    useState<Modulo | null>(null);

  // =========================================================
  // CONFIRMAÇÃO DE ELIMINAÇÃO
  // =========================================================

  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] =
    useState(false);

  const [moduloParaEliminar, setModuloParaEliminar] =
    useState<Modulo | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioModulo>(formularioInicial);

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] =
    useState<"sucesso" | "erro" | "">("");

  // =========================================================
  // CARREGAR CURSOS
  // =========================================================

  async function carregarCursos() {
    const { data, error } = await supabase
      .from("cursos")
      .select("id, titulo")
      .order("titulo", { ascending: true });

    if (error) {
      console.error("Erro ao carregar cursos:", error);

      mostrarMensagem(
        "Não foi possível carregar os cursos disponíveis.",
        "erro"
      );

      return;
    }

    setCursos((data ?? []) as Curso[]);
  }

  // =========================================================
  // CARREGAR MÓDULOS
  // =========================================================

  async function carregarModulos() {
    try {
      setCarregando(true);

      const { data, error } = await supabase
        .from("modulos")
        .select(
          `
            id,
            curso_id,
            titulo,
            descricao,
            ordem,
            criado_em
          `
        )
        .order("curso_id", { ascending: true })
        .order("ordem", { ascending: true });

      if (error) {
        console.error("Erro ao carregar módulos:", error);

        mostrarMensagem(
          "Não foi possível carregar os módulos.",
          "erro"
        );

        return;
      }

      setModulos((data ?? []) as Modulo[]);
    } catch (erro) {
      console.error(
        "Erro inesperado ao carregar módulos:",
        erro
      );

      mostrarMensagem(
        "Ocorreu um erro inesperado ao carregar os módulos.",
        "erro"
      );
    } finally {
      setCarregando(false);
    }
  }

  // =========================================================
  // CARREGAR DADOS INICIAIS
  // =========================================================

  useEffect(() => {
    carregarCursos();
    carregarModulos();
  }, []);

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
      setTipoMensagem("");
    }, 4000);
  }

  // =========================================================
  // PESQUISA
  // =========================================================

  const modulosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      return modulos;
    }

    return modulos.filter((modulo) => {
      const curso = cursos.find(
        (item) => item.id === modulo.curso_id
      );

      const tituloCurso = curso?.titulo ?? "";

      return (
        modulo.titulo.toLowerCase().includes(termo) ||
        modulo.descricao.toLowerCase().includes(termo) ||
        tituloCurso.toLowerCase().includes(termo)
      );
    });
  }, [modulos, pesquisa, cursos]);

  // =========================================================
  // ABRIR NOVO MÓDULO
  // =========================================================

  function abrirNovoModulo() {
    setModuloSelecionado(null);

    setFormulario({
      ...formularioInicial,
      ordem: calcularProximaOrdem(),
    });

    setModalAberto(true);
  }

  // =========================================================
  // CALCULAR PRÓXIMA ORDEM
  // =========================================================

  function calcularProximaOrdem(cursoId?: number) {
    if (!cursoId) {
      return "1";
    }

    const modulosDoCurso = modulos.filter(
      (modulo) => modulo.curso_id === cursoId
    );

    if (modulosDoCurso.length === 0) {
      return "1";
    }

    const maiorOrdem = Math.max(
      ...modulosDoCurso.map((modulo) => modulo.ordem)
    );

    return String(maiorOrdem + 1);
  }

  // =========================================================
  // ABRIR EDIÇÃO
  // =========================================================

  function abrirEditarModulo(modulo: Modulo) {
    setModuloSelecionado(modulo);

    setFormulario({
      curso_id: String(modulo.curso_id),
      titulo: modulo.titulo,
      descricao: modulo.descricao,
      ordem: String(modulo.ordem),
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
    setModuloSelecionado(null);
    setFormulario(formularioInicial);
  }

  // =========================================================
  // ALTERAR FORMULÁRIO
  // =========================================================

  function alterarFormulario(
    campo: keyof FormularioModulo,
    valor: string
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    // Quando o curso muda, sugerimos automaticamente
    // a próxima ordem disponível.
    if (campo === "curso_id" && valor) {
      const cursoId = Number(valor);

      setFormulario((anterior) => ({
        ...anterior,
        curso_id: valor,
        ordem: calcularProximaOrdem(cursoId),
      }));
    }
  }

  // =========================================================
  // GUARDAR MÓDULO
  // =========================================================

  async function guardarModulo(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const cursoId = Number(formulario.curso_id);
    const ordem = Number(formulario.ordem);

    // =======================================================
    // VALIDAÇÕES
    // =======================================================

    if (!cursoId) {
      mostrarMensagem(
        "Seleccione um curso.",
        "erro"
      );
      return;
    }

    if (!formulario.titulo.trim()) {
      mostrarMensagem(
        "Introduza o título do módulo.",
        "erro"
      );
      return;
    }

    if (!formulario.descricao.trim()) {
      mostrarMensagem(
        "Introduza a descrição do módulo.",
        "erro"
      );
      return;
    }

    if (!Number.isInteger(ordem) || ordem < 1) {
      mostrarMensagem(
        "A ordem deve ser um número inteiro maior que zero.",
        "erro"
      );
      return;
    }

    try {
      setGuardando(true);

      // =====================================================
      // EDITAR
      // =====================================================

      if (moduloSelecionado) {
        const { error } = await supabase
          .from("modulos")
          .update({
            curso_id: cursoId,
            titulo: formulario.titulo.trim(),
            descricao: formulario.descricao.trim(),
            ordem,
          })
          .eq("id", moduloSelecionado.id);

        if (error) {
          console.error(
            "Erro ao actualizar módulo:",
            error
          );

          mostrarMensagem(
            "Não foi possível actualizar o módulo.",
            "erro"
          );

          return;
        }

        mostrarMensagem(
          "Módulo actualizado com sucesso.",
          "sucesso"
        );
      }

      // =====================================================
      // NOVO
      // =====================================================

      else {
        const { error } = await supabase
          .from("modulos")
          .insert({
            curso_id: cursoId,
            titulo: formulario.titulo.trim(),
            descricao: formulario.descricao.trim(),
            ordem,
          });

        if (error) {
          console.error(
            "Erro ao criar módulo:",
            error
          );

          mostrarMensagem(
            "Não foi possível criar o módulo.",
            "erro"
          );

          return;
        }

        mostrarMensagem(
          "Módulo criado com sucesso.",
          "sucesso"
        );
      }

      fecharModal();
      await carregarModulos();
    } catch (erro) {
      console.error(
        "Erro inesperado ao guardar módulo:",
        erro
      );

      mostrarMensagem(
        "Ocorreu um erro inesperado.",
        "erro"
      );
    } finally {
      setGuardando(false);
    }
  }

  // =========================================================
  // ABRIR CONFIRMAÇÃO DE ELIMINAÇÃO
  // =========================================================

  function abrirConfirmacaoEliminacao(modulo: Modulo) {
    setModuloParaEliminar(modulo);
    setModalConfirmacaoAberto(true);
  }

  // =========================================================
  // FECHAR CONFIRMAÇÃO DE ELIMINAÇÃO
  // =========================================================

  function fecharConfirmacaoEliminacao() {
    if (eliminando !== null) {
      return;
    }

    setModalConfirmacaoAberto(false);
    setModuloParaEliminar(null);
  }

  // =========================================================
  // ELIMINAR MÓDULO
  // =========================================================

  async function confirmarEliminacaoModulo() {
    if (!moduloParaEliminar) {
      return;
    }

    const modulo = moduloParaEliminar;

    try {
      setEliminando(modulo.id);

      const { error } = await supabase
        .from("modulos")
        .delete()
        .eq("id", modulo.id);

      if (error) {
        console.error(
          "Erro ao eliminar módulo:",
          error
        );

        mostrarMensagem(
          "Não foi possível eliminar o módulo.",
          "erro"
        );

        return;
      }

      setModalConfirmacaoAberto(false);
      setModuloParaEliminar(null);

      mostrarMensagem(
        "Módulo eliminado com sucesso.",
        "sucesso"
      );

      await carregarModulos();
    } catch (erro) {
      console.error(
        "Erro inesperado ao eliminar módulo:",
        erro
      );

      mostrarMensagem(
        "Ocorreu um erro inesperado ao eliminar o módulo.",
        "erro"
      );
    } finally {
      setEliminando(null);
    }
  }

  // =========================================================
  // CURSO PELO ID
  // =========================================================

  function obterNomeCurso(cursoId: number) {
    return (
      cursos.find((curso) => curso.id === cursoId)?.titulo ??
      "Curso não encontrado"
    );
  }

  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <main className="p-6 lg:p-8">

      {/* =====================================================
          MENSAGEM
      ===================================================== */}

      {mensagem && (
        <div
          className={`mb-6 flex items-center justify-between rounded-2xl border px-5 py-4 shadow-sm ${
            tipoMensagem === "sucesso"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span className="font-semibold">
            {mensagem}
          </span>

          <button
            type="button"
            onClick={() => {
              setMensagem("");
              setTipoMensagem("");
            }}
            className="ml-4 opacity-70 transition hover:opacity-100"
            aria-label="Fechar mensagem"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <section className="mb-8 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
                <FaBook className="text-2xl text-blue-800" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestão de Módulos
                </h1>

                <p className="mt-1 text-gray-600">
                  Organize e administre os módulos dos cursos do SICSI.
                </p>
              </div>

            </div>
          </div>

          <button
            type="button"
            onClick={abrirNovoModulo}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-900"
          >
            <FaPlus />
            Novo Módulo
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
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar módulos..."
              aria-label="Pesquisar módulos"
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
            />

          </div>

          <button
            type="button"
            onClick={async () => {
              await carregarCursos();
              await carregarModulos();

              mostrarMensagem(
                "Lista actualizada com sucesso.",
                "sucesso"
              );
            }}
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

        <div className="mt-5">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
            {modulosFiltrados.length}{" "}
            {modulosFiltrados.length === 1
              ? "módulo"
              : "módulos"}
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
            A carregar módulos...
          </p>

        </section>

      ) : modulosFiltrados.length === 0 ? (

        <section className="rounded-3xl bg-white p-12 text-center shadow-sm">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100">
            <FaBook className="text-3xl text-blue-800" />
          </div>

          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Nenhum módulo encontrado
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-gray-600">
            {pesquisa
              ? "Nenhum módulo corresponde à pesquisa realizada."
              : "Ainda não existem módulos registados no SICSI."}
          </p>

          {!pesquisa && (
            <button
              type="button"
              onClick={abrirNovoModulo}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white transition hover:bg-blue-900"
            >
              <FaPlus />
              Criar primeiro módulo
            </button>
          )}

        </section>

      ) : (

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">

                  <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Curso
                  </th>

                  <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Módulo
                  </th>

                  <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Descrição
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

                {modulosFiltrados.map((modulo) => (

                  <tr
                    key={modulo.id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >

                    <td className="px-6 py-5">
                      <div className="font-semibold text-gray-900">
                        {obterNomeCurso(modulo.curso_id)}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="font-semibold text-gray-900">
                        {modulo.titulo}
                      </div>
                    </td>

                    <td className="max-w-md px-6 py-5">
                      <p className="truncate text-gray-600">
                        {modulo.descricao}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">
                        {modulo.ordem}
                      </span>
                    </td>

                    <td className="px-6 py-5">

                      <div className="flex items-center justify-end gap-2">

                        {/* EDITAR */}

                        <button
                          type="button"
                          onClick={() =>
                            abrirEditarModulo(modulo)
                          }
                          title="Editar módulo"
                          aria-label="Editar módulo"
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-blue-700 transition hover:bg-blue-50"
                        >
                          <FaEdit />
                        </button>

                        {/* ELIMINAR */}

                        <button
                          type="button"
                          onClick={() =>
                            abrirConfirmacaoEliminacao(modulo)
                          }
                          disabled={
                            eliminando === modulo.id
                          }
                          title="Eliminar módulo"
                          aria-label="Eliminar módulo"
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {eliminando === modulo.id ? (
                            <FaSyncAlt className="animate-spin" />
                          ) : (
                            <FaTrash />
                          )}
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </section>

      )}

      {/* =====================================================
          MODAL — NOVO / EDITAR MÓDULO
      ===================================================== */}

      {modalAberto && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">

            {/* Cabeçalho do modal */}

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {moduloSelecionado
                    ? "Editar módulo"
                    : "Novo módulo"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {moduloSelecionado
                    ? "Actualize as informações do módulo."
                    : "Adicione um novo módulo a um curso."}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={guardando}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
                aria-label="Fechar"
              >
                <FaTimes />
              </button>

            </div>

            {/* Formulário */}

            <form
              onSubmit={guardarModulo}
              className="space-y-5 p-6"
            >

              {/* Curso */}

              <div>

                <label
                  htmlFor="curso_id"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Curso *
                </label>

                <select
                  id="curso_id"
                  value={formulario.curso_id}
                  onChange={(e) =>
                    alterarFormulario(
                      "curso_id",
                      e.target.value
                    )
                  }
                  disabled={guardando}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                >

                  <option value="">
                    Seleccione um curso
                  </option>

                  {cursos.map((curso) => (
                    <option
                      key={curso.id}
                      value={curso.id}
                    >
                      {curso.titulo}
                    </option>
                  ))}

                </select>

                {cursos.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    Não existem cursos disponíveis.
                  </p>
                )}

              </div>

              {/* Título */}

              <div>

                <label
                  htmlFor="titulo"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Título do módulo *
                </label>

                <input
                  id="titulo"
                  type="text"
                  value={formulario.titulo}
                  onChange={(e) =>
                    alterarFormulario(
                      "titulo",
                      e.target.value
                    )
                  }
                  placeholder="Ex.: Introdução à Cibersegurança"
                  disabled={guardando}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                />

              </div>

              {/* Descrição */}

              <div>

                <label
                  htmlFor="descricao"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Descrição *
                </label>

                <textarea
                  id="descricao"
                  value={formulario.descricao}
                  onChange={(e) =>
                    alterarFormulario(
                      "descricao",
                      e.target.value
                    )
                  }
                  placeholder="Descreva brevemente o conteúdo deste módulo..."
                  rows={5}
                  disabled={guardando}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                />

              </div>

              {/* Ordem */}

              <div>

                <label
                  htmlFor="ordem"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Ordem *
                </label>

                <input
                  id="ordem"
                  type="number"
                  min="1"
                  value={formulario.ordem}
                  onChange={(e) =>
                    alterarFormulario(
                      "ordem",
                      e.target.value
                    )
                  }
                  disabled={guardando}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Define a posição deste módulo dentro do curso.
                </p>

              </div>

              {/* Botões */}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    guardando ||
                    cursos.length === 0
                  }
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
                      {moduloSelecionado
                        ? "Guardar alterações"
                        : "Criar módulo"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          MODAL — CONFIRMAÇÃO DE ELIMINAÇÃO
      ===================================================== */}

      {modalConfirmacaoAberto && moduloParaEliminar && (

        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-confirmacao-eliminacao"
        >

          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* Cabeçalho */}

            <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-5">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100">
                <FaTrash className="text-xl text-red-600" />
              </div>

              <div>
                <h2
                  id="titulo-confirmacao-eliminacao"
                  className="text-xl font-bold text-gray-900"
                >
                  Eliminar módulo
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Confirmação necessária
                </p>
              </div>

            </div>

            {/* Conteúdo */}

            <div className="px-6 py-6">

              <p className="text-gray-700">
                Tem a certeza de que deseja eliminar o módulo:
              </p>

              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-4">

                <p className="font-bold text-red-800">
                  "{moduloParaEliminar.titulo}"
                </p>

                <p className="mt-1 text-sm text-red-700">
                  Esta acção não poderá ser desfeita.
                </p>

              </div>

              <p className="mt-4 text-sm leading-6 text-gray-500">
                As perguntas, conteúdos ou outros registos
                associados a este módulo poderão impedir a
                eliminação enquanto existirem relações na base
                de dados.
              </p>

            </div>

            {/* Acções */}

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-5 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={fecharConfirmacaoEliminacao}
                disabled={eliminando !== null}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaTimes />
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarEliminacaoModulo}
                disabled={eliminando !== null}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {eliminando !== null ? (
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