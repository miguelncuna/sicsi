"use client";

import { useEffect, useMemo, useState } from "react";

import {
  FaUsers,
  FaUserShield,
  FaGraduationCap,
  FaSearch,
  FaPlus,
  FaPen,
  FaTrash,
  FaTimes,
  FaSave,
  FaUser,
  FaEye,
  FaBookOpen,
  FaClipboardCheck,
  FaTrophy,
  FaCertificate,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";

type Papel = "ADMIN" | "ESTUDANTE";

interface Utilizador {
  id: string;
  nome_completo: string;
  email: string;
  papel: Papel;
  foto_url?: string | null;
  criado_em?: string | null;
}

interface Formulario {
  nome_completo: string;
  email: string;
  papel: Papel;
  foto_url: string;
  password: string;
}

interface Avaliacao {
  id: number;
  titulo: string;
  tentativa: number | null;
  pontuacao: number | null;
  aprovado: boolean;
  estado: string;
  total_perguntas: number;
  respostas_correctas: number;
  concluido_em: string | null;
}

interface Simulacao {
  id: number;
  titulo: string;
  tentativa: number | null;
  pontuacao: number | null;
  aprovado: boolean;
  concluido: boolean;
  concluido_em: string | null;
}

interface CursoHistorico {
  id: number;
  titulo: string;
  descricao: string;
  total_modulos: number;
  total_conteudos: number;
  conteudos_concluidos: number;
  percentagem: number;

  total_avaliacoes: number;
  avaliacoes_aprovadas: number;
  avaliacoes: Avaliacao[];

  total_simulacoes: number;
  simulacoes_concluidas: number;
  simulacoes: Simulacao[];

  certificado: {
    id: number;
    data_emissao: string;
  } | null;

  concluido: boolean;
}

interface Percurso {
  utilizador: Utilizador;

  resumo: {
    cursos: number;
    cursos_concluidos: number;
    avaliacoes: number;
    avaliacoes_aprovadas: number;
    simulacoes: number;
    simulacoes_aprovadas: number;
    certificados: number;
  };

  cursos: CursoHistorico[];

  certificados: {
    id: number;
    curso_id: number;
    curso_titulo: string;
    data_emissao: string;
  }[];
}

const formularioInicial: Formulario = {
  nome_completo: "",
  email: "",
  papel: "ESTUDANTE",
  foto_url: "",
  password: "",
};

export default function UtilizadoresAdminPage() {
  const [utilizadores, setUtilizadores] =
    useState<Utilizador[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [pesquisa, setPesquisa] =
    useState("");

  const [filtroPapel, setFiltroPapel] =
    useState<"TODOS" | Papel>("TODOS");

  const [modalAberto, setModalAberto] =
    useState(false);

  const [utilizadorEditando, setUtilizadorEditando] =
    useState<Utilizador | null>(null);

  const [formulario, setFormulario] =
    useState<Formulario>(formularioInicial);

  const [guardando, setGuardando] =
    useState(false);

  const [confirmarEliminar, setConfirmarEliminar] =
    useState<Utilizador | null>(null);

  const [eliminando, setEliminando] =
    useState(false);

  const [utilizadorVisualizando, setUtilizadorVisualizando] =
    useState<Utilizador | null>(null);

  const [percurso, setPercurso] =
    useState<Percurso | null>(null);

  const [carregandoPercurso, setCarregandoPercurso] =
    useState(false);

  const [erroPercurso, setErroPercurso] =
    useState("");

  /* =========================================================
     CARREGAR UTILIZADORES
  ========================================================= */

  async function carregarUtilizadores() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        "/api/admin/utilizadores",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const texto = await resposta.text();

      let dados: any = null;

      try {
        dados = texto
          ? JSON.parse(texto)
          : null;
      } catch {
        throw new Error(
          "A API devolveu uma resposta inválida."
        );
      }

      if (!resposta.ok) {
        throw new Error(
          dados?.erro ||
            "Não foi possível carregar os utilizadores."
        );
      }

      setUtilizadores(
        Array.isArray(dados?.utilizadores)
          ? dados.utilizadores
          : []
      );
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os utilizadores."
      );

      setUtilizadores([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarUtilizadores();
  }, []);

  /* =========================================================
     ESTATÍSTICAS
  ========================================================= */

  const total =
    utilizadores.length;

  const administradores =
    utilizadores.filter(
      (utilizador) =>
        utilizador.papel === "ADMIN"
    ).length;

  const estudantes =
    utilizadores.filter(
      (utilizador) =>
        utilizador.papel === "ESTUDANTE"
    ).length;

  /* =========================================================
     FILTRO
  ========================================================= */

  const utilizadoresFiltrados =
    useMemo(() => {
      const termo =
        pesquisa
          .trim()
          .toLowerCase();

      return utilizadores.filter(
        (utilizador) => {
          const correspondePesquisa =
            !termo ||
            utilizador.nome_completo
              .toLowerCase()
              .includes(termo) ||
            utilizador.email
              .toLowerCase()
              .includes(termo);

          const correspondePapel =
            filtroPapel === "TODOS" ||
            utilizador.papel ===
              filtroPapel;

          return (
            correspondePesquisa &&
            correspondePapel
          );
        }
      );
    }, [
      utilizadores,
      pesquisa,
      filtroPapel,
    ]);

  /* =========================================================
     NOVO
  ========================================================= */

  function abrirNovoUtilizador() {
    setUtilizadorEditando(null);
    setFormulario(formularioInicial);
    setErro("");
    setModalAberto(true);
  }

  /* =========================================================
     EDITAR
  ========================================================= */

  function abrirEditarUtilizador(
    utilizador: Utilizador
  ) {
    setUtilizadorEditando(utilizador);

    setFormulario({
      nome_completo:
        utilizador.nome_completo || "",

      email:
        utilizador.email || "",

      papel:
        utilizador.papel,

      foto_url:
        utilizador.foto_url || "",

      password: "",
    });

    setErro("");
    setModalAberto(true);
  }

  /* =========================================================
     VISUALIZAR PERCURSO
     APENAS ESTUDANTES
  ========================================================= */

  async function abrirPercurso(
    utilizador: Utilizador
  ) {
    if (
      utilizador.papel !==
      "ESTUDANTE"
    ) {
      return;
    }

    try {
      setUtilizadorVisualizando(
        utilizador
      );

      setPercurso(null);
      setErroPercurso("");
      setCarregandoPercurso(true);

      const resposta = await fetch(
        `/api/admin/utilizadores/${utilizador.id}/percurso`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const texto = await resposta.text();

      let dados: any = null;

      try {
        dados = texto
          ? JSON.parse(texto)
          : null;
      } catch {
        throw new Error(
          "A API devolveu uma resposta inválida."
        );
      }

      if (!resposta.ok) {
        throw new Error(
          dados?.erro ||
            "Não foi possível carregar o percurso."
        );
      }

      setPercurso(
        dados as Percurso
      );
    } catch (error) {
      console.error(error);

      setErroPercurso(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o percurso."
      );
    } finally {
      setCarregandoPercurso(false);
    }
  }

  function fecharPercurso() {
    setUtilizadorVisualizando(null);
    setPercurso(null);
    setErroPercurso("");
  }

  /* =========================================================
     FECHAR MODAL
  ========================================================= */

  function fecharModal() {
    if (guardando) return;

    setModalAberto(false);
    setUtilizadorEditando(null);
    setFormulario(formularioInicial);
  }

  /* =========================================================
     FORMULÁRIO
  ========================================================= */

  function alterarCampo(
    campo: keyof Formulario,
    valor: string
  ) {
    setFormulario(
      (anterior) => ({
        ...anterior,
        [campo]: valor,
      })
    );
  }

  /* =========================================================
     GUARDAR
  ========================================================= */

  async function guardarUtilizador(
    evento: React.FormEvent
  ) {
    evento.preventDefault();

    setErro("");

    if (
      !formulario.nome_completo.trim()
    ) {
      setErro(
        "Introduza o nome completo."
      );
      return;
    }

    if (!formulario.email.trim()) {
      setErro(
        "Introduza o email."
      );
      return;
    }

    if (
      !utilizadorEditando &&
      !formulario.password.trim()
    ) {
      setErro(
        "Introduza uma palavra-passe para o novo utilizador."
      );
      return;
    }

    if (
      formulario.password.trim() &&
      formulario.password.length < 6
    ) {
      setErro(
        "A palavra-passe deve ter pelo menos 6 caracteres."
      );
      return;
    }

    try {
      setGuardando(true);

      const metodo =
        utilizadorEditando
          ? "PUT"
          : "POST";

      const corpo: Record<
        string,
        unknown
      > = {
        nome_completo:
          formulario.nome_completo.trim(),

        email:
          formulario.email
            .trim()
            .toLowerCase(),

        papel:
          formulario.papel,

        foto_url:
          formulario.foto_url.trim() ||
          null,
      };

      if (
        formulario.password.trim()
      ) {
        corpo.password =
          formulario.password;
      }

      if (utilizadorEditando) {
        corpo.id =
          utilizadorEditando.id;
      }

      const resposta = await fetch(
        "/api/admin/utilizadores",
        {
          method: metodo,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(corpo),
        }
      );

      const texto = await resposta.text();

      let dados: any = null;

      try {
        dados = texto
          ? JSON.parse(texto)
          : null;
      } catch {
        throw new Error(
          "A API devolveu uma resposta inválida."
        );
      }

      if (!resposta.ok) {
        throw new Error(
          dados?.erro ||
            "Não foi possível guardar o utilizador."
        );
      }

      fecharModal();

      await carregarUtilizadores();
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível guardar o utilizador."
      );
    } finally {
      setGuardando(false);
    }
  }

  /* =========================================================
     ELIMINAR
  ========================================================= */

  async function eliminarUtilizador() {
    if (!confirmarEliminar)
      return;

    try {
      setEliminando(true);
      setErro("");

      const resposta = await fetch(
        "/api/admin/utilizadores",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: confirmarEliminar.id,
          }),
        }
      );

      const texto = await resposta.text();

      let dados: any = null;

      try {
        dados = texto
          ? JSON.parse(texto)
          : null;
      } catch {
        throw new Error(
          "A API devolveu uma resposta inválida."
        );
      }

      if (!resposta.ok) {
        throw new Error(
          dados?.erro ||
            "Não foi possível eliminar o utilizador."
        );
      }

      setConfirmarEliminar(null);

      await carregarUtilizadores();
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível eliminar o utilizador."
      );
    } finally {
      setEliminando(false);
    }
  }

  /* =========================================================
     DATAS
  ========================================================= */

  function formatarData(
    data?: string | null
  ) {
    if (!data) return "—";

    try {
      return new Intl.DateTimeFormat(
        "pt-PT",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      ).format(new Date(data));
    } catch {
      return "—";
    }
  }

  function formatarDataHora(
    data?: string | null
  ) {
    if (!data) return "—";

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
      return "—";
    }
  }

  /* =========================================================
     INTERFACE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#f5f8fc] p-6 text-[#14213d] md:p-8">

      <div className="mx-auto max-w-[1500px]">

        {/* CABEÇALHO */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1f3b8f] text-white">
              <FaUsers size={22} />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                Utilizadores
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Gestão dos utilizadores do SICSI.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={
              abrirNovoUtilizador
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f3b8f] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#183274]"
          >
            <FaPlus />
            Novo utilizador
          </button>

        </div>

        {/* ERRO */}

        {erro && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        {/* ESTATÍSTICAS */}

        <div className="mb-7 grid gap-5 md:grid-cols-3">

          <CartaoEstatistica
            titulo="Total"
            valor={total}
            icone={<FaUsers />}
            fundo="bg-blue-50"
            cor="text-[#1f3b8f]"
          />

          <CartaoEstatistica
            titulo="Administradores"
            valor={administradores}
            icone={<FaUserShield />}
            fundo="bg-purple-50"
            cor="text-purple-600"
          />

          <CartaoEstatistica
            titulo="Estudantes"
            valor={estudantes}
            icone={<FaGraduationCap />}
            fundo="bg-emerald-50"
            cor="text-emerald-600"
          />

        </div>

        {/* PESQUISA */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 md:flex-row">

            <div className="relative flex-1">

              <FaSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={15}
              />

              <input
                type="text"
                value={pesquisa}
                onChange={(evento) =>
                  setPesquisa(
                    evento.target.value
                  )
                }
                placeholder="Pesquisar por nome ou email..."
                className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-[#1f3b8f] focus:bg-white"
              />

            </div>

            <select
              value={filtroPapel}
              onChange={(evento) =>
                setFiltroPapel(
                  evento.target.value as
                    | "TODOS"
                    | Papel
                )
              }
              className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-5 text-sm outline-none focus:border-[#1f3b8f]"
            >
              <option value="TODOS">
                Todos os papéis
              </option>

              <option value="ESTUDANTE">
                Estudantes
              </option>

              <option value="ADMIN">
                Administradores
              </option>
            </select>

          </div>

        </div>

        {/* TABELA */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">

            <h2 className="text-lg font-bold">
              Lista de utilizadores
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {utilizadoresFiltrados.length} utilizador(es)
              encontrado(s)
            </p>

          </div>

          {carregando ? (

            <div className="flex min-h-[300px] items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#1f3b8f]" />
            </div>

          ) : utilizadoresFiltrados.length === 0 ? (

            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">

              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FaUser />
              </div>

              <h3 className="font-bold">
                Nenhum utilizador encontrado
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Tente alterar a pesquisa ou o filtro.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

                <thead className="bg-slate-50">

                  <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-500">

                    <th className="px-6 py-4">
                      Utilizador
                    </th>

                    <th className="px-6 py-4">
                      Email
                    </th>

                    <th className="px-6 py-4">
                      Papel
                    </th>

                    <th className="px-6 py-4">
                      Registado em
                    </th>

                    <th className="px-6 py-4 text-right">
                      Acções
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {utilizadoresFiltrados.map(
                    (utilizador) => (

                      <tr
                        key={
                          utilizador.id
                        }
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            {utilizador.foto_url ? (

                              <img
                                src={
                                  utilizador.foto_url
                                }
                                alt={
                                  utilizador.nome_completo
                                }
                                className="h-11 w-11 rounded-full object-cover"
                              />

                            ) : (

                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 font-bold text-[#1f3b8f]">
                                {utilizador.nome_completo
                                  ?.charAt(0)
                                  .toUpperCase() ||
                                  "U"}
                              </div>

                            )}

                            <p className="font-semibold">
                              {
                                utilizador.nome_completo
                              }
                            </p>

                          </div>

                        </td>

                        <td className="px-6 py-5 text-sm text-slate-600">
                          {
                            utilizador.email
                          }
                        </td>

                        <td className="px-6 py-5">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              utilizador.papel ===
                              "ADMIN"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {utilizador.papel ===
                            "ADMIN"
                              ? "Administrador"
                              : "Estudante"}
                          </span>

                        </td>

                        <td className="px-6 py-5 text-sm text-slate-500">
                          {formatarData(
                            utilizador.criado_em
                          )}
                        </td>

                        <td className="px-6 py-5">

                          <div className="flex justify-end gap-2">

                            {/* PERCURSO — SOMENTE ESTUDANTE */}

                            {utilizador.papel ===
                              "ESTUDANTE" && (

                              <button
                                type="button"
                                onClick={() =>
                                  abrirPercurso(
                                    utilizador
                                  )
                                }
                                title="Visualizar percurso"
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-blue-100 hover:text-[#1f3b8f]"
                              >
                                <FaEye size={14} />
                              </button>

                            )}

                            {/* EDITAR */}

                            <button
                              type="button"
                              onClick={() =>
                                abrirEditarUtilizador(
                                  utilizador
                                )
                              }
                              title="Editar"
                              className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#1f3b8f] transition hover:bg-blue-100"
                            >
                              <FaPen size={14} />
                            </button>

                            {/* ELIMINAR */}

                            <button
                              type="button"
                              onClick={() =>
                                setConfirmarEliminar(
                                  utilizador
                                )
                              }
                              title="Eliminar"
                              className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                            >
                              <FaTrash size={14} />
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

      {/* =====================================================
          MODAL NOVO / EDITAR
      ===================================================== */}

      {modalAberto && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold">
                  {utilizadorEditando
                    ? "Editar utilizador"
                    : "Novo utilizador"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {utilizadorEditando
                    ? "Actualize os dados do utilizador."
                    : "Adicione um novo utilizador ao SICSI."}
                </p>

              </div>

              <button
                type="button"
                onClick={fecharModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <FaTimes />
              </button>

            </div>

            <form
              onSubmit={
                guardarUtilizador
              }
              className="space-y-5 p-6"
            >

              <Campo
                label="Nome completo"
                value={
                  formulario.nome_completo
                }
                onChange={(valor) =>
                  alterarCampo(
                    "nome_completo",
                    valor
                  )
                }
                placeholder="Nome completo"
                obrigatorio
              />

              <Campo
                label="Email"
                type="email"
                value={
                  formulario.email
                }
                onChange={(valor) =>
                  alterarCampo(
                    "email",
                    valor
                  )
                }
                placeholder="email@exemplo.com"
                obrigatorio
              />

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Papel
                </label>

                <select
                  value={
                    formulario.papel
                  }
                  onChange={(evento) =>
                    alterarCampo(
                      "papel",
                      evento.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-[#1f3b8f]"
                >
                  <option value="ESTUDANTE">
                    Estudante
                  </option>

                  <option value="ADMIN">
                    Administrador
                  </option>
                </select>

              </div>

              <Campo
                label="Foto URL"
                value={
                  formulario.foto_url
                }
                onChange={(valor) =>
                  alterarCampo(
                    "foto_url",
                    valor
                  )
                }
                placeholder="https://..."
              />

              <Campo
                label={
                  utilizadorEditando
                    ? "Nova palavra-passe"
                    : "Palavra-passe"
                }
                type="password"
                value={
                  formulario.password
                }
                onChange={(valor) =>
                  alterarCampo(
                    "password",
                    valor
                  )
                }
                placeholder={
                  utilizadorEditando
                    ? "Deixe vazio para manter"
                    : "Mínimo 6 caracteres"
                }
                obrigatorio={
                  !utilizadorEditando
                }
              />

              {erro && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {erro}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  onClick={
                    fecharModal
                  }
                  disabled={guardando}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1f3b8f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#183274] disabled:opacity-60"
                >
                  <FaSave />

                  {guardando
                    ? "A guardar..."
                    : "Guardar"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          MODAL PERCURSO
      ===================================================== */}

      {utilizadorVisualizando && (

        <div className="fixed inset-0 z-[55] overflow-y-auto bg-slate-950/60 p-4 md:p-8">

          <div className="mx-auto w-full max-w-6xl rounded-3xl bg-[#f5f8fc] shadow-2xl">

            {/* CABEÇALHO */}

            <div className="flex items-center justify-between rounded-t-3xl border-b border-slate-200 bg-white px-6 py-5 md:px-8">

              <div className="flex items-center gap-4">

                {utilizadorVisualizando.foto_url ? (

                  <img
                    src={
                      utilizadorVisualizando.foto_url
                    }
                    alt={
                      utilizadorVisualizando.nome_completo
                    }
                    className="h-14 w-14 rounded-full object-cover"
                  />

                ) : (

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-[#1f3b8f]">
                    {utilizadorVisualizando.nome_completo
                      ?.charAt(0)
                      .toUpperCase() ||
                      "U"}
                  </div>

                )}

                <div>

                  <h2 className="text-xl font-bold">
                    Percurso do estudante
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      utilizadorVisualizando.nome_completo
                    }{" "}
                    ·{" "}
                    {
                      utilizadorVisualizando.email
                    }
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  fecharPercurso
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <FaTimes />
              </button>

            </div>

            <div className="p-6 md:p-8">

              {carregandoPercurso ? (

                <div className="flex min-h-[400px] items-center justify-center">

                  <div className="text-center">

                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#1f3b8f]" />

                    <p className="mt-4 text-sm text-slate-500">
                      A carregar percurso...
                    </p>

                  </div>

                </div>

              ) : erroPercurso ? (

                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                  {erroPercurso}
                </div>

              ) : percurso ? (

                <>

                  {/* RESUMO */}

                  <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

                    <CartaoPercurso
                      titulo="Cursos"
                      valor={
                        percurso.resumo.cursos
                      }
                      detalhe={`${percurso.resumo.cursos_concluidos} concluído(s)`}
                      icone={
                        <FaBookOpen />
                      }
                      fundo="bg-blue-50"
                      cor="text-[#1f3b8f]"
                    />

                    <CartaoPercurso
                      titulo="Avaliações"
                      valor={
                        percurso.resumo.avaliacoes
                      }
                      detalhe={`${percurso.resumo.avaliacoes_aprovadas} aprovada(s)`}
                      icone={
                        <FaClipboardCheck />
                      }
                      fundo="bg-purple-50"
                      cor="text-purple-600"
                    />

                    <CartaoPercurso
                      titulo="Simulações"
                      valor={
                        percurso.resumo.simulacoes
                      }
                      detalhe={`${percurso.resumo.simulacoes_aprovadas} aprovada(s)`}
                      icone={
                        <FaTrophy />
                      }
                      fundo="bg-amber-50"
                      cor="text-amber-600"
                    />

                    <CartaoPercurso
                      titulo="Certificados"
                      valor={
                        percurso.resumo.certificados
                      }
                      detalhe="Emitido(s)"
                      icone={
                        <FaCertificate />
                      }
                      fundo="bg-emerald-50"
                      cor="text-emerald-600"
                    />

                  </div>

                  {/* CURSOS */}

                  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-100 px-6 py-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1f3b8f]">
                          <FaBookOpen />
                        </div>

                        <div>

                          <h3 className="font-bold">
                            Cursos
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Percurso formativo real do estudante.
                          </p>

                        </div>

                      </div>

                    </div>

                    <div className="space-y-5 p-6">

                      {percurso.cursos.length ===
                      0 ? (

                        <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                          Este estudante ainda não possui actividade registada em cursos.
                        </div>

                      ) : (

                        percurso.cursos.map(
                          (curso) => (

                            <div
                              key={
                                curso.id
                              }
                              className="rounded-2xl border border-slate-200 p-5"
                            >

                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                                <div>

                                  <div className="flex flex-wrap items-center gap-3">

                                    <h4 className="text-base font-bold">
                                      {
                                        curso.titulo
                                      }
                                    </h4>

                                    {curso.concluido ? (

                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                        <FaCheckCircle />
                                        Concluído
                                      </span>

                                    ) : (

                                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1f3b8f]">
                                        <FaClock />
                                        Em progresso
                                      </span>

                                    )}

                                  </div>

                                  <div className="mt-4">

                                    <div className="mb-2 flex justify-between">

                                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Progresso dos conteúdos
                                      </span>

                                      <span className="text-sm font-bold text-[#1f3b8f]">
                                        {
                                          curso.percentagem
                                        }%
                                      </span>

                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                                      <div
                                        className="h-full rounded-full bg-[#1f3b8f]"
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            Math.max(
                                              0,
                                              curso.percentagem
                                            )
                                          )}%`,
                                        }}
                                      />

                                    </div>

                                    <p className="mt-2 text-xs text-slate-500">
                                      {
                                        curso.conteudos_concluidos
                                      } de{" "}
                                      {
                                        curso.total_conteudos
                                      } conteúdos concluídos
                                    </p>

                                  </div>

                                </div>

                              </div>

                              {/* INDICADORES */}

                              <div className="mt-5 grid gap-3 md:grid-cols-3">

                                <Indicador
                                  titulo="Módulos"
                                  valor={
                                    String(
                                      curso.total_modulos
                                    )
                                  }
                                />

                                <Indicador
                                  titulo="Avaliações"
                                  valor={`${curso.avaliacoes_aprovadas}/${curso.total_avaliacoes}`}
                                  detalhe="aprovadas"
                                />

                                <Indicador
                                  titulo="Simulações"
                                  valor={`${curso.simulacoes_concluidas}/${curso.total_simulacoes}`}
                                  detalhe="concluídas"
                                />

                              </div>

                              {/* AVALIAÇÕES */}

                              {curso.avaliacoes.length >
                                0 && (

                                <div className="mt-5 border-t border-slate-100 pt-5">

                                  <div className="mb-3 flex items-center gap-2">

                                    <FaClipboardCheck className="text-purple-600" />

                                    <h5 className="text-sm font-bold">
                                      Avaliações
                                    </h5>

                                  </div>

                                  <div className="space-y-2">

                                    {curso.avaliacoes.map(
                                      (avaliacao) => (

                                        <div
                                          key={
                                            avaliacao.id
                                          }
                                          className="flex flex-col gap-2 rounded-xl bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between"
                                        >

                                          <div>

                                            <p className="text-sm font-semibold">
                                              {
                                                avaliacao.titulo
                                              }
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                              Tentativa:{" "}
                                              {avaliacao.tentativa ??
                                                "—"}
                                            </p>

                                          </div>

                                          <div className="flex items-center gap-3">

                                            <span className="text-sm font-bold">
                                              {avaliacao.pontuacao !==
                                              null
                                                ? `${avaliacao.pontuacao}%`
                                                : "—"}
                                            </span>

                                            {avaliacao.aprovado ? (

                                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                                Aprovada
                                              </span>

                                            ) : avaliacao.estado ===
                                              "NAO_INICIADA" ? (

                                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                                                Não iniciada
                                              </span>

                                            ) : (

                                              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                                                Não aprovada
                                              </span>

                                            )}

                                          </div>

                                        </div>

                                      )
                                    )}

                                  </div>

                                </div>

                              )}

                              {/* SIMULAÇÕES */}

                              {curso.simulacoes.length >
                                0 && (

                                <div className="mt-5 border-t border-slate-100 pt-5">

                                  <div className="mb-3 flex items-center gap-2">

                                    <FaTrophy className="text-amber-600" />

                                    <h5 className="text-sm font-bold">
                                      Simulações
                                    </h5>

                                  </div>

                                  <div className="space-y-2">

                                    {curso.simulacoes.map(
                                      (simulacao) => (

                                        <div
                                          key={
                                            simulacao.id
                                          }
                                          className="flex flex-col gap-2 rounded-xl bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between"
                                        >

                                          <div>

                                            <p className="text-sm font-semibold">
                                              {
                                                simulacao.titulo
                                              }
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                              Tentativa:{" "}
                                              {simulacao.tentativa ??
                                                "—"}
                                            </p>

                                          </div>

                                          <div className="flex items-center gap-3">

                                            <span className="text-sm font-bold">
                                              {simulacao.pontuacao !==
                                              null
                                                ? `${simulacao.pontuacao}%`
                                                : "—"}
                                            </span>

                                            {simulacao.aprovado &&
                                            simulacao.concluido ? (

                                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                                Concluída
                                              </span>

                                            ) : (

                                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                                                Não concluída
                                              </span>

                                            )}

                                          </div>

                                        </div>

                                      )
                                    )}

                                  </div>

                                </div>

                              )}

                              {/* CERTIFICADO */}

                              {curso.certificado && (

                                <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600">
                                    <FaCertificate />
                                  </div>

                                  <div>

                                    <p className="text-sm font-bold text-emerald-800">
                                      Certificado emitido
                                    </p>

                                    <p className="mt-1 text-xs text-emerald-700">
                                      Emitido em{" "}
                                      {formatarData(
                                        curso.certificado
                                          .data_emissao
                                      )}
                                    </p>

                                  </div>

                                </div>

                              )}

                            </div>

                          )
                        )

                      )}

                    </div>

                  </section>

                  {/* CERTIFICADOS */}

                  <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-100 px-6 py-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <FaCertificate />
                        </div>

                        <div>

                          <h3 className="font-bold">
                            Certificados
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Certificados emitidos para este estudante.
                          </p>

                        </div>

                      </div>

                    </div>

                    {percurso.certificados.length ===
                    0 ? (

                      <div className="p-8 text-center text-sm text-slate-500">
                        Nenhum certificado emitido.
                      </div>

                    ) : (

                      <div className="divide-y divide-slate-100">

                        {percurso.certificados.map(
                          (certificado) => (

                            <div
                              key={
                                certificado.id
                              }
                              className="flex items-center justify-between gap-4 px-6 py-5"
                            >

                              <div>

                                <p className="font-semibold">
                                  {
                                    certificado.curso_titulo
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  Emitido em{" "}
                                  {formatarData(
                                    certificado.data_emissao
                                  )}
                                </p>

                              </div>

                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                <FaCheckCircle />
                                Emitido
                              </span>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </section>

                </>

              ) : null}

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          CONFIRMAÇÃO ELIMINAÇÃO
      ===================================================== */}

      {confirmarEliminar && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <FaTrash />
            </div>

            <h2 className="text-xl font-bold">
              Eliminar utilizador?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Tem a certeza de que pretende
              eliminar{" "}
              <strong>
                {
                  confirmarEliminar.nome_completo
                }
              </strong>
              ? Esta operação não poderá ser desfeita.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setConfirmarEliminar(
                    null
                  )
                }
                disabled={eliminando}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  eliminarUtilizador
                }
                disabled={eliminando}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {eliminando
                  ? "A eliminar..."
                  : "Eliminar"}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

/* ===========================================================
   CARTÃO ESTATÍSTICA
=========================================================== */

function CartaoEstatistica({
  titulo,
  valor,
  icone,
  fundo,
  cor,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
  fundo: string;
  cor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {titulo}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {valor}
          </p>

        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${fundo} ${cor}`}
        >
          {icone}
        </div>

      </div>

    </div>
  );
}

/* ===========================================================
   CARTÃO PERCURSO
=========================================================== */

function CartaoPercurso({
  titulo,
  valor,
  detalhe,
  icone,
  fundo,
  cor,
}: {
  titulo: string;
  valor: number;
  detalhe: string;
  icone: React.ReactNode;
  fundo: string;
  cor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {titulo}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {valor}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {detalhe}
          </p>

        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${fundo} ${cor}`}
        >
          {icone}
        </div>

      </div>

    </div>
  );
}

/* ===========================================================
   INDICADOR
=========================================================== */

function Indicador({
  titulo,
  valor,
  detalhe,
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 text-lg font-bold">
        {valor}
      </p>

      {detalhe && (
        <p className="text-xs text-slate-500">
          {detalhe}
        </p>
      )}

    </div>
  );
}

/* ===========================================================
   CAMPO
=========================================================== */

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  obrigatorio = false,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  type?: string;
  obrigatorio?: boolean;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-slate-700">

        {label}

        {obrigatorio && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>

      <input
        type={type}
        value={value}
        required={obrigatorio}
        onChange={(evento) =>
          onChange(
            evento.target.value
          )
        }
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none placeholder:text-slate-400 focus:border-[#1f3b8f] focus:bg-white"
      />

    </div>
  );
}