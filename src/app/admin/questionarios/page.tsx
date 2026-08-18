"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaBook,
  FaClipboardList,
  FaEdit,
  FaPlus,
  FaQuestionCircle,
  FaSearch,
  FaSyncAlt,
  FaTrash,
} from "react-icons/fa";

import { supabase } from "@/lib/supabase";

import PrimaryButton from "@/components/admin/buttons/PrimaryButton";
import SearchInput from "@/components/admin/forms/SearchInput";
import ConfirmDialog from "@/components/admin/modals/ConfirmDialog";
import LoadingSpinner from "@/components/admin/layout/LoadingSpinner";
import Toast from "@/components/admin/layout/Toast";

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

interface Questionario {
  id: number;
  modulo_id: number;
  titulo: string;
  descricao: string;
  pontuacao_minima: number;
  criado_em: string;
  modulo?: Modulo | null;
}

interface FormularioQuestionario {
  modulo_id: string;
  titulo: string;
  descricao: string;
  pontuacao_minima: string;
}

type ToastTipo = "sucesso" | "erro" | "aviso" | "info";

const formularioInicial: FormularioQuestionario = {
  modulo_id: "",
  titulo: "",
  descricao: "",
  pontuacao_minima: "70",
};

export default function QuestionariosPage() {
  const [questionarios, setQuestionarios] = useState<Questionario[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);

  const [pesquisa, setPesquisa] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);

  const [questionarioSelecionado, setQuestionarioSelecionado] =
    useState<Questionario | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioQuestionario>(formularioInicial);

  /*
   * ==========================================
   * CONFIRMAÇÃO DE ELIMINAÇÃO
   * ==========================================
   */

  const [dialogAberto, setDialogAberto] = useState(false);

  const [questionarioParaEliminar, setQuestionarioParaEliminar] =
    useState<Questionario | null>(null);

  /*
   * ==========================================
   * TOAST
   * ==========================================
   */

  const [toastAberto, setToastAberto] = useState(false);
  const [toastMensagem, setToastMensagem] = useState("");
  const [toastTipo, setToastTipo] =
    useState<ToastTipo>("sucesso");

  function mostrarToast(
    mensagem: string,
    tipo: ToastTipo = "sucesso"
  ) {
    setToastMensagem(mensagem);
    setToastTipo(tipo);
    setToastAberto(true);
  }

  function fecharToast() {
    setToastAberto(false);
  }

  /*
   * ==========================================
   * CARREGAR DADOS
   * ==========================================
   */

  async function carregarDados() {
    try {
      setCarregando(true);

      const [
        { data: dadosQuestionarios, error: erroQuestionarios },
        { data: dadosModulos, error: erroModulos },
      ] = await Promise.all([
        supabase
          .from("questionarios")
          .select(`
            id,
            modulo_id,
            titulo,
            descricao,
            pontuacao_minima,
            criado_em,
            modulo:modulos (
              id,
              curso_id,
              titulo,
              curso:cursos (
                id,
                titulo
              )
            )
          `)
          .order("criado_em", { ascending: false }),

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

      if (erroQuestionarios) {
        console.error(
          "Erro ao carregar questionários:",
          erroQuestionarios
        );

        mostrarToast(
          "Não foi possível carregar os questionários.",
          "erro"
        );

        return;
      }

      if (erroModulos) {
        console.error(
          "Erro ao carregar módulos:",
          erroModulos
        );

        mostrarToast(
          "Não foi possível carregar os módulos.",
          "erro"
        );

        return;
      }

      /*
       * O Supabase pode devolver relações como
       * objectos ou arrays dependendo da relação.
       *
       * Aqui normalizamos os dados.
       */

      const questionariosNormalizados: Questionario[] = (
        (dadosQuestionarios ?? []) as any[]
      ).map((questionario) => {
        const moduloBruto = Array.isArray(questionario.modulo)
          ? questionario.modulo[0] ?? null
          : questionario.modulo ?? null;

        let moduloNormalizado: Modulo | null = null;

        if (moduloBruto) {
          const cursoBruto = Array.isArray(moduloBruto.curso)
            ? moduloBruto.curso[0] ?? null
            : moduloBruto.curso ?? null;

          moduloNormalizado = {
            id: Number(moduloBruto.id),
            curso_id: Number(moduloBruto.curso_id),
            titulo: moduloBruto.titulo ?? "",
            curso: cursoBruto
              ? {
                  id: Number(cursoBruto.id),
                  titulo: cursoBruto.titulo ?? "",
                }
              : null,
          };
        }

        return {
          id: Number(questionario.id),
          modulo_id: Number(questionario.modulo_id),
          titulo: questionario.titulo ?? "",
          descricao: questionario.descricao ?? "",
          pontuacao_minima:
            Number(questionario.pontuacao_minima ?? 70),
          criado_em: questionario.criado_em ?? "",
          modulo: moduloNormalizado,
        };
      });

      const modulosNormalizados: Modulo[] = (
        (dadosModulos ?? []) as any[]
      ).map((modulo) => {
        const cursoBruto = Array.isArray(modulo.curso)
          ? modulo.curso[0] ?? null
          : modulo.curso ?? null;

        return {
          id: Number(modulo.id),
          curso_id: Number(modulo.curso_id),
          titulo: modulo.titulo ?? "",
          curso: cursoBruto
            ? {
                id: Number(cursoBruto.id),
                titulo: cursoBruto.titulo ?? "",
              }
            : null,
        };
      });

      setQuestionarios(questionariosNormalizados);
      setModulos(modulosNormalizados);
    } catch (erro) {
      console.error(
        "Erro inesperado ao carregar questionários:",
        erro
      );

      mostrarToast(
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

  /*
   * ==========================================
   * PESQUISA
   * ==========================================
   */

  const questionariosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      return questionarios;
    }

    return questionarios.filter((questionario) => {
      const tituloModulo =
        questionario.modulo?.titulo ?? "";

      const tituloCurso =
        questionario.modulo?.curso?.titulo ?? "";

      return (
        questionario.titulo
          .toLowerCase()
          .includes(termo) ||
        questionario.descricao
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
  }, [questionarios, pesquisa]);

  /*
   * ==========================================
   * NOVO QUESTIONÁRIO
   * ==========================================
   */

  function abrirNovoQuestionario() {
    setModoEdicao(false);
    setQuestionarioSelecionado(null);
    setFormulario(formularioInicial);
    setModalAberto(true);
  }

  /*
   * ==========================================
   * EDITAR QUESTIONÁRIO
   * ==========================================
   */

  function abrirEditarQuestionario(
    questionario: Questionario
  ) {
    setModoEdicao(true);
    setQuestionarioSelecionado(questionario);

    setFormulario({
      modulo_id: String(questionario.modulo_id),
      titulo: questionario.titulo,
      descricao: questionario.descricao,
      pontuacao_minima: String(
        questionario.pontuacao_minima
      ),
    });

    setModalAberto(true);
  }

  /*
   * ==========================================
   * FECHAR MODAL
   * ==========================================
   */

  function fecharModal() {
    if (guardando) {
      return;
    }

    setModalAberto(false);
    setModoEdicao(false);
    setQuestionarioSelecionado(null);
    setFormulario(formularioInicial);
  }

  /*
   * ==========================================
   * ALTERAR FORMULÁRIO
   * ==========================================
   */

  function alterarFormulario(
    campo: keyof FormularioQuestionario,
    valor: string
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  /*
   * ==========================================
   * GUARDAR QUESTIONÁRIO
   * ==========================================
   */

  async function guardarQuestionario(
    evento: React.FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (!formulario.modulo_id) {
      mostrarToast(
        "Seleccione o módulo do questionário.",
        "aviso"
      );

      return;
    }

    if (!formulario.titulo.trim()) {
      mostrarToast(
        "Introduza o título do questionário.",
        "aviso"
      );

      return;
    }

    if (!formulario.descricao.trim()) {
      mostrarToast(
        "Introduza a descrição do questionário.",
        "aviso"
      );

      return;
    }

    const pontuacaoMinima = Number(
      formulario.pontuacao_minima
    );

    if (
      Number.isNaN(pontuacaoMinima) ||
      pontuacaoMinima < 0 ||
      pontuacaoMinima > 100
    ) {
      mostrarToast(
        "A pontuação mínima deve estar entre 0 e 100.",
        "aviso"
      );

      return;
    }

    try {
      setGuardando(true);

      const dados = {
        modulo_id: Number(formulario.modulo_id),
        titulo: formulario.titulo.trim(),
        descricao: formulario.descricao.trim(),
        pontuacao_minima: pontuacaoMinima,
      };

      if (
        modoEdicao &&
        questionarioSelecionado
      ) {
        const { data, error } = await supabase
          .from("questionarios")
          .update(dados)
          .eq("id", questionarioSelecionado.id)
          .select(`
            id,
            modulo_id,
            titulo,
            descricao,
            pontuacao_minima,
            criado_em
          `)
          .single();

        if (error) {
          console.error(
            "Erro ao actualizar questionário:",
            error
          );

          mostrarToast(
            "Não foi possível actualizar o questionário.",
            "erro"
          );

          return;
        }

        const moduloSelecionado =
          modulos.find(
            (modulo) =>
              modulo.id === Number(
                formulario.modulo_id
              )
          ) ?? null;

        const questionarioActualizado: Questionario = {
          ...(data as Questionario),
          modulo: moduloSelecionado,
        };

        setQuestionarios((anteriores) =>
          anteriores.map((questionario) =>
            questionario.id ===
            questionarioSelecionado.id
              ? questionarioActualizado
              : questionario
          )
        );

        mostrarToast(
          "Questionário actualizado com sucesso!",
          "sucesso"
        );
      } else {
        const { data, error } = await supabase
          .from("questionarios")
          .insert(dados)
          .select(`
            id,
            modulo_id,
            titulo,
            descricao,
            pontuacao_minima,
            criado_em
          `)
          .single();

        if (error) {
          console.error(
            "Erro ao criar questionário:",
            error
          );

          mostrarToast(
            "Não foi possível criar o questionário.",
            "erro"
          );

          return;
        }

        const moduloSelecionado =
          modulos.find(
            (modulo) =>
              modulo.id === Number(
                formulario.modulo_id
              )
          ) ?? null;

        const novoQuestionario: Questionario = {
          ...(data as Questionario),
          modulo: moduloSelecionado,
        };

        setQuestionarios((anteriores) => [
          novoQuestionario,
          ...anteriores,
        ]);

        mostrarToast(
          "Questionário criado com sucesso!",
          "sucesso"
        );
      }

      setModalAberto(false);
      setModoEdicao(false);
      setQuestionarioSelecionado(null);
      setFormulario(formularioInicial);
    } catch (erro) {
      console.error(
        "Erro inesperado ao guardar questionário:",
        erro
      );

      mostrarToast(
        "Ocorreu um erro ao guardar o questionário.",
        "erro"
      );
    } finally {
      setGuardando(false);
    }
  }

  /*
   * ==========================================
   * PEDIR ELIMINAÇÃO
   *
   * IMPORTANTE:
   * Não usamos window.confirm().
   * O SICSI abre o ConfirmDialog.
   * ==========================================
   */

  function pedirEliminacao(
    questionario: Questionario
  ) {
    setQuestionarioParaEliminar(questionario);
    setDialogAberto(true);
  }

  /*
   * ==========================================
   * CANCELAR ELIMINAÇÃO
   * ==========================================
   */

  function cancelarEliminacao() {
    if (guardando) {
      return;
    }

    setDialogAberto(false);
    setQuestionarioParaEliminar(null);
  }

  /*
   * ==========================================
   * ELIMINAR QUESTIONÁRIO
   * ==========================================
   */

  async function eliminarQuestionario() {
    if (!questionarioParaEliminar) {
      return;
    }

    try {
      setGuardando(true);

      /*
       * Primeiro verificamos se existem perguntas
       * associadas ao questionário.
       */

      const {
        count: quantidadePerguntas,
        error: erroPerguntas,
      } = await supabase
        .from("perguntas")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq(
          "questionario_id",
          questionarioParaEliminar.id
        );

      if (erroPerguntas) {
        console.error(
          "Erro ao verificar perguntas:",
          erroPerguntas
        );

        mostrarToast(
          "Não foi possível verificar as perguntas associadas.",
          "erro"
        );

        return;
      }

      /*
       * Se existirem perguntas, não eliminamos
       * automaticamente os registos relacionados.
       */

      if ((quantidadePerguntas ?? 0) > 0) {
        mostrarToast(
          "Não é possível eliminar este questionário enquanto existirem perguntas associadas.",
          "aviso"
        );

        setDialogAberto(false);
        setQuestionarioParaEliminar(null);

        return;
      }

      const { error } = await supabase
        .from("questionarios")
        .delete()
        .eq(
          "id",
          questionarioParaEliminar.id
        );

      if (error) {
        console.error(
          "Erro ao eliminar questionário:",
          error
        );

        mostrarToast(
          "Não foi possível eliminar o questionário.",
          "erro"
        );

        return;
      }

      setQuestionarios((anteriores) =>
        anteriores.filter(
          (questionario) =>
            questionario.id !==
            questionarioParaEliminar.id
        )
      );

      mostrarToast(
        "Questionário eliminado com sucesso.",
        "sucesso"
      );

      setDialogAberto(false);
      setQuestionarioParaEliminar(null);
    } catch (erro) {
      console.error(
        "Erro inesperado ao eliminar questionário:",
        erro
      );

      mostrarToast(
        "Ocorreu um erro ao eliminar o questionário.",
        "erro"
      );
    } finally {
      setGuardando(false);
    }
  }

  /*
   * ==========================================
   * RENDER
   * ==========================================
   */

  return (
    <main className="space-y-8">
      {/* ========================================
          TOAST
      ======================================== */}

      <Toast
        aberto={toastAberto}
        mensagem={toastMensagem}
        tipo={toastTipo}
        aoFechar={fecharToast}
      />

      {/* ========================================
          CABEÇALHO
      ======================================== */}

      <section className="rounded-3xl bg-white p-6 shadow-lg md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-xl text-blue-900">
                <FaQuestionCircle />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestão de Questionários
                </h1>

                <p className="mt-1 text-gray-600">
                  Crie e administre os questionários
                  dos módulos do SICSI.
                </p>
              </div>
            </div>
          </div>

          <PrimaryButton
            onClick={abrirNovoQuestionario}
          >
            <span className="flex items-center gap-2">
              <FaPlus />
              Novo Questionário
            </span>
          </PrimaryButton>
        </div>
      </section>

      {/* ========================================
          PESQUISA E ESTATÍSTICAS
      ======================================== */}

      <section className="rounded-3xl bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-xl">
            <SearchInput
              valor={pesquisa}
              aoAlterar={setPesquisa}
              placeholder="Pesquisar questionários..."
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

        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
            {questionariosFiltrados.length}{" "}
            {questionariosFiltrados.length === 1
              ? "questionário"
              : "questionários"}
          </span>

          <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
            {modulos.length}{" "}
            {modulos.length === 1
              ? "módulo disponível"
              : "módulos disponíveis"}
          </span>
        </div>
      </section>

      {/* ========================================
          CONTEÚDO
      ======================================== */}

      {carregando ? (
        <section className="flex min-h-[350px] items-center justify-center rounded-3xl bg-white shadow-lg">
          <LoadingSpinner
            tamanho="grande"
            mensagem="A carregar questionários..."
          />
        </section>
      ) : questionariosFiltrados.length === 0 ? (
        <section className="rounded-3xl bg-white p-12 text-center shadow-lg">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100">
            <FaClipboardList className="text-3xl text-blue-800" />
          </div>

          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Nenhum questionário encontrado
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-gray-600">
            {pesquisa
              ? "Nenhum questionário corresponde à pesquisa realizada."
              : "Ainda não existem questionários registados no SICSI."}
          </p>

          {!pesquisa && (
            <button
              type="button"
              onClick={abrirNovoQuestionario}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white transition hover:bg-blue-900"
            >
              <FaPlus />
              Criar primeiro questionário
            </button>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl bg-white shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Módulo
                  </th>

                  <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Questionário
                  </th>

                  <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Descrição
                  </th>

                  <th className="px-6 py-5 text-center text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Aprovação
                  </th>

                  <th className="px-6 py-5 text-right text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Acções
                  </th>
                </tr>
              </thead>

              <tbody>
                {questionariosFiltrados.map(
                  (questionario) => (
                    <tr
                      key={questionario.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      {/* Módulo */}

                      <td className="px-6 py-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                            <FaBook />
                          </div>

                          <div>
                            <div className="font-semibold text-gray-900">
                              {questionario.modulo
                                ?.titulo ??
                                "Módulo não encontrado"}
                            </div>

                            <div className="mt-1 text-sm text-gray-500">
                              ID do módulo:{" "}
                              {
                                questionario.modulo_id
                              }
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Questionário */}

                      <td className="px-6 py-5">
                        <div className="font-semibold text-gray-900">
                          {questionario.titulo}
                        </div>

                        <div className="mt-1 text-sm text-gray-500">
                          ID: {questionario.id}
                        </div>
                      </td>

                      {/* Descrição */}

                      <td className="max-w-md px-6 py-5">
                        <p className="truncate text-gray-600">
                          {questionario.descricao}
                        </p>
                      </td>

                      {/* Aprovação */}

                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex min-w-[70px] items-center justify-center rounded-full bg-green-100 px-3 py-1.5 text-sm font-bold text-green-800">
                          {
                            questionario.pontuacao_minima
                          }
                          %
                        </span>
                      </td>

                      {/* Acções */}

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              abrirEditarQuestionario(
                                questionario
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
                          >
                            <FaEdit />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              pedirEliminacao(
                                questionario
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
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

      {/* ========================================
          MODAL NOVO / EDITAR QUESTIONÁRIO
      ======================================== */}

      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(evento) => {
            if (
              evento.target === evento.currentTarget &&
              !guardando
            ) {
              fecharModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5 md:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {modoEdicao
                      ? "Editar Questionário"
                      : "Novo Questionário"}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Configure os dados principais do
                    questionário.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={guardando}
                  className="rounded-xl px-3 py-2 text-2xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={guardarQuestionario}
              className="space-y-6 p-6 md:p-8"
            >
              {/* Módulo */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Módulo *
                </label>

                <select
                  value={formulario.modulo_id}
                  onChange={(evento) =>
                    alterarFormulario(
                      "modulo_id",
                      evento.target.value
                    )
                  }
                  disabled={guardando}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                  required
                >
                  <option value="">
                    Seleccione o módulo
                  </option>

                  {modulos.map((modulo) => (
                    <option
                      key={modulo.id}
                      value={modulo.id}
                    >
                      {modulo.curso?.titulo
                        ? `${modulo.curso.titulo} — `
                        : ""}
                      {modulo.titulo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Título */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Título *
                </label>

                <input
                  type="text"
                  value={formulario.titulo}
                  onChange={(evento) =>
                    alterarFormulario(
                      "titulo",
                      evento.target.value
                    )
                  }
                  placeholder="Ex.: Segunda Avaliação"
                  disabled={guardando}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                  required
                />
              </div>

              {/* Descrição */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Descrição *
                </label>

                <textarea
                  value={formulario.descricao}
                  onChange={(evento) =>
                    alterarFormulario(
                      "descricao",
                      evento.target.value
                    )
                  }
                  placeholder="Descreva o objectivo deste questionário..."
                  rows={4}
                  disabled={guardando}
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                  required
                />
              </div>

              {/* Pontuação */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Pontuação mínima para aprovação *
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      formulario.pontuacao_minima
                    }
                    onChange={(evento) =>
                      alterarFormulario(
                        "pontuacao_minima",
                        evento.target.value
                      )
                    }
                    disabled={guardando}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                    required
                  />

                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-semibold text-gray-500">
                    %
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  O estudante deverá atingir esta
                  percentagem para ser considerado
                  aprovado.
                </p>
              </div>

              {/* Botões */}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={guardando}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-6 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardando && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}

                  {modoEdicao
                    ? "Guardar alterações"
                    : "Criar Questionário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================
          CONFIRMAÇÃO DE ELIMINAÇÃO
          
          ESTE É O PONTO PRINCIPAL DA ALTERAÇÃO.
          
          Não existe window.confirm().
          O SICSI apresenta o seu próprio diálogo.
      ======================================== */}

      <ConfirmDialog
        aberto={dialogAberto}
        titulo="Eliminar questionário"
        mensagem={
          questionarioParaEliminar
            ? `Tem a certeza que pretende eliminar o questionário "${questionarioParaEliminar.titulo}"? As perguntas e alternativas associadas poderão impedir a eliminação enquanto existirem registos relacionados.`
            : "Tem a certeza que pretende eliminar este questionário?"
        }
        textoConfirmar="Eliminar questionário"
        textoCancelar="Cancelar"
        carregando={guardando}
        aoConfirmar={eliminarQuestionario}
        aoCancelar={cancelarEliminacao}
      />
    </main>
  );
}