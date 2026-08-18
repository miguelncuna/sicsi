"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { criarClienteSupabase } from "@/lib/supabase/client";
import UploadFotoPerfil from "@/components/forms/UploadFotoPerfil";

import {
  FaUser,
  FaEnvelope,
  FaGraduationCap,
  FaLock,
  FaEdit,
  FaCheckCircle,
  FaShieldAlt,
  FaEye,
  FaEyeSlash,
  FaChevronRight,
} from "react-icons/fa";

interface Perfil {
  id: string;
  nome_completo: string;
  email: string;
  papel: string;
  foto_url: string | null;
}

type Mensagem = {
  tipo: "sucesso" | "erro";
  texto: string;
} | null;

export default function DefinicoesPage() {
  const router = useRouter();

  const [perfil, setPerfil] = useState<Perfil | null>(null);

  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaPalavraPasse, setNovaPalavraPasse] = useState("");

  const [mostrarPalavraPasse, setMostrarPalavraPasse] =
    useState(false);

  const [carregando, setCarregando] = useState(true);
  const [aGuardarNome, setAGuardarNome] = useState(false);
  const [aGuardarEmail, setAGuardarEmail] = useState(false);
  const [aAlterarPalavraPasse, setAAlterarPalavraPasse] =
    useState(false);

  const [mensagem, setMensagem] =
    useState<Mensagem>(null);

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
    }, 5000);
  }

  async function carregarPerfil() {
    const supabase = criarClienteSupabase();

    try {
      setCarregando(true);

      const {
        data: { user },
        error: erroUtilizador,
      } = await supabase.auth.getUser();

      if (erroUtilizador || !user) {
        router.push("/login");
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("perfis")
        .select(
          "id, nome_completo, email, papel, foto_url"
        )
        .eq("id", user.id)
        .single();

      if (error || !data) {
        console.error(
          "Erro ao carregar perfil:",
          error
        );

        mostrarMensagem(
          "erro",
          "Não foi possível carregar os dados da conta."
        );

        return;
      }

      const perfilCarregado: Perfil = {
        id: data.id,
        nome_completo: data.nome_completo || "",
        email: data.email || user.email || "",
        papel: data.papel || "estudante",
        foto_url: data.foto_url || null,
      };

      setPerfil(perfilCarregado);

      setNovoNome(
        perfilCarregado.nome_completo
      );

      setNovoEmail(
        perfilCarregado.email
      );
    } catch (erro) {
      console.error(
        "Erro ao carregar definições:",
        erro
      );

      mostrarMensagem(
        "erro",
        "Ocorreu um erro ao carregar as definições."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPerfil();
  }, [router]);

  async function atualizarNome() {
    const nome = novoNome.trim();

    if (nome.length < 3) {
      mostrarMensagem(
        "erro",
        "Introduza o seu nome completo com pelo menos 3 caracteres."
      );
      return;
    }

    setAGuardarNome(true);

    try {
      const supabase = criarClienteSupabase();

      const {
        data: { user },
        error: erroUtilizador,
      } = await supabase.auth.getUser();

      if (erroUtilizador || !user) {
        router.push("/login");
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("perfis")
        .update({
          nome_completo: nome,
        })
        .eq("id", user.id)
        .select(
          "id, nome_completo, email, papel, foto_url"
        )
        .single();

      if (error) {
        console.error(
          "Erro ao guardar nome:",
          error
        );

        mostrarMensagem(
          "erro",
          "Não foi possível guardar o nome. Verifique as permissões do seu perfil."
        );

        return;
      }

      if (!data) {
        mostrarMensagem(
          "erro",
          "O sistema não conseguiu confirmar a gravação do nome."
        );

        return;
      }

      const perfilAtualizado: Perfil = {
        id: data.id,
        nome_completo: data.nome_completo || "",
        email: data.email || user.email || "",
        papel: data.papel || "estudante",
        foto_url: data.foto_url || null,
      };

      setPerfil(perfilAtualizado);

      setNovoNome(
        perfilAtualizado.nome_completo
      );

      setNovoEmail(
        perfilAtualizado.email
      );

      mostrarMensagem(
        "sucesso",
        "Nome actualizado e guardado com sucesso."
      );
    } catch (erro) {
      console.error(
        "Erro ao actualizar nome:",
        erro
      );

      mostrarMensagem(
        "erro",
        "Ocorreu um erro ao guardar o nome."
      );
    } finally {
      setAGuardarNome(false);
    }
  }

  async function atualizarEmail() {
    const email = novoEmail
      .trim()
      .toLowerCase();

    if (
      !email ||
      !email.includes("@") ||
      !email.includes(".")
    ) {
      mostrarMensagem(
        "erro",
        "Introduza um endereço de e-mail válido."
      );

      return;
    }

    setAGuardarEmail(true);

    try {
      const supabase = criarClienteSupabase();

      const {
        data: { user },
        error: erroUtilizador,
      } = await supabase.auth.getUser();

      if (erroUtilizador || !user) {
        router.push("/login");
        return;
      }

      /*
       * Primeiro actualizamos o e-mail da autenticação.
       *
       * O Supabase pode exigir confirmação do novo
       * endereço dependendo da configuração do projecto.
       */
      const {
        error: erroAutenticacao,
      } = await supabase.auth.updateUser({
        email,
      });

      if (erroAutenticacao) {
        console.error(
          "Erro ao actualizar e-mail na autenticação:",
          erroAutenticacao
        );

        mostrarMensagem(
          "erro",
          "Não foi possível actualizar o e-mail da conta: " +
            erroAutenticacao.message
        );

        return;
      }

      /*
       * Depois actualizamos o e-mail da tabela perfis.
       *
       * O .select().single() é importante:
       * se a política RLS impedir o UPDATE,
       * o sistema não fingirá que a gravação foi feita.
       */
      const {
        data,
        error,
      } = await supabase
        .from("perfis")
        .update({
          email,
        })
        .eq("id", user.id)
        .select(
          "id, nome_completo, email, papel, foto_url"
        )
        .single();

      if (error) {
        console.error(
          "Erro ao guardar e-mail no perfil:",
          error
        );

        mostrarMensagem(
          "erro",
          "O e-mail da autenticação foi processado, mas não foi possível guardar o e-mail no perfil."
        );

        return;
      }

      if (!data) {
        mostrarMensagem(
          "erro",
          "O sistema não conseguiu confirmar a gravação do e-mail."
        );

        return;
      }

      const perfilAtualizado: Perfil = {
        id: data.id,
        nome_completo:
          data.nome_completo || "",
        email: data.email || email,
        papel: data.papel || "estudante",
        foto_url: data.foto_url || null,
      };

      setPerfil(perfilAtualizado);

      setNovoNome(
        perfilAtualizado.nome_completo
      );

      setNovoEmail(
        perfilAtualizado.email
      );

      mostrarMensagem(
        "sucesso",
        "E-mail actualizado e guardado com sucesso."
      );
    } catch (erro) {
      console.error(
        "Erro ao actualizar e-mail:",
        erro
      );

      mostrarMensagem(
        "erro",
        "Ocorreu um erro ao guardar o e-mail."
      );
    } finally {
      setAGuardarEmail(false);
    }
  }

  async function alterarPalavraPasse() {
    if (novaPalavraPasse.length < 6) {
      mostrarMensagem(
        "erro",
        "A palavra-passe deve ter pelo menos 6 caracteres."
      );

      return;
    }

    setAAlterarPalavraPasse(true);

    try {
      const supabase = criarClienteSupabase();

      const {
        error,
      } = await supabase.auth.updateUser({
        password: novaPalavraPasse,
      });

      if (error) {
        console.error(
          "Erro ao alterar palavra-passe:",
          error
        );

        mostrarMensagem(
          "erro",
          "Não foi possível alterar a palavra-passe: " +
            error.message
        );

        return;
      }

      setNovaPalavraPasse("");
      setMostrarPalavraPasse(false);

      mostrarMensagem(
        "sucesso",
        "Palavra-passe alterada com sucesso."
      );
    } catch (erro) {
      console.error(
        "Erro ao alterar palavra-passe:",
        erro
      );

      mostrarMensagem(
        "erro",
        "Ocorreu um erro ao alterar a palavra-passe."
      );
    } finally {
      setAAlterarPalavraPasse(false);
    }
  }

  if (carregando) {
    return (
      <main className="min-h-[60vh] bg-slate-50">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-700" />

            <p className="text-sm font-medium text-slate-500">
              A carregar as definições...
            </p>
          </div>
        </div>
      </main>
    );
  }

  const iniciais =
    perfil?.nome_completo
      ?.split(" ")
      .filter(Boolean)
      .map((nome) => nome[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-8">

        {/* CABEÇALHO */}

        <header className="mb-6 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Conta</span>

            <FaChevronRight className="text-[9px]" />

            <span className="text-blue-700">
              Definições
            </span>
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Definições da conta
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Gerencie os seus dados pessoais e mantenha a sua conta SICSI segura.
          </p>
        </header>

        {/* MENSAGEM DO SISTEMA */}

        {mensagem && (
          <div
            role="alert"
            className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${
              mensagem.tipo === "sucesso"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {mensagem.tipo === "sucesso" ? (
              <FaCheckCircle className="mt-0.5 shrink-0 text-emerald-600" />
            ) : (
              <FaShieldAlt className="mt-0.5 shrink-0 text-red-600" />
            )}

            <span>
              {mensagem.texto}
            </span>
          </div>
        )}

        {/* PERFIL */}

        <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1 bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-500" />

          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">

            {perfil?.foto_url ? (
              <img
                src={perfil.foto_url}
                alt="Fotografia do perfil"
                className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-2xl font-bold text-white shadow-sm">
                {iniciais}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Perfil do estudante
              </p>

              <h2 className="mt-1 truncate text-xl font-bold text-slate-900">
                {perfil?.nome_completo ||
                  "Estudante"}
              </h2>

              <p className="mt-1 truncate text-sm text-slate-500">
                {perfil?.email}
              </p>

              <div className="mt-3">
                {perfil && (
                  <UploadFotoPerfil
                    utilizadorId={perfil.id}
                  />
                )}
              </div>
            </div>

            <div className="shrink-0 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 sm:min-w-[130px]">
              <FaGraduationCap className="text-lg text-blue-700" />

              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                Conta
              </p>

              <p className="mt-0.5 text-sm font-bold capitalize text-blue-900">
                {perfil?.papel ||
                  "Estudante"}
              </p>
            </div>
          </div>
        </section>

        {/* CONTEÚDO */}

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">

          <div className="space-y-5">

            {/* DADOS PESSOAIS */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <FaUser />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Dados pessoais
                    </h2>

                    <p className="text-xs text-slate-500">
                      Nome apresentado no SICSI e nos certificados.
                    </p>
                  </div>

                </div>
              </div>

              <div className="p-5">

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Nome completo
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">

                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) =>
                      setNovoNome(
                        e.target.value
                      )
                    }
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    placeholder="Nome completo"
                  />

                  <button
                    type="button"
                    onClick={atualizarNome}
                    disabled={aGuardarNome}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaEdit />

                    {aGuardarNome
                      ? "A guardar..."
                      : "Guardar"}
                  </button>

                </div>
              </div>
            </section>

            {/* E-MAIL */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 px-5 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <FaEnvelope />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Correio electrónico
                    </h2>

                    <p className="text-xs text-slate-500">
                      Endereço associado à sua conta.
                    </p>
                  </div>

                </div>

              </div>

              <div className="p-5">

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Endereço de e-mail
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">

                  <input
                    type="email"
                    value={novoEmail}
                    onChange={(e) =>
                      setNovoEmail(
                        e.target.value
                      )
                    }
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                    placeholder="novo@email.com"
                  />

                  <button
                    type="button"
                    onClick={atualizarEmail}
                    disabled={aGuardarEmail}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaEdit />

                    {aGuardarEmail
                      ? "A actualizar..."
                      : "Actualizar"}
                  </button>

                </div>
              </div>
            </section>

            {/* SEGURANÇA */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 px-5 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <FaLock />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Segurança
                    </h2>

                    <p className="text-xs text-slate-500">
                      Altere a palavra-passe da sua conta.
                    </p>
                  </div>

                </div>

              </div>

              <div className="p-5">

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Nova palavra-passe
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">

                  <div className="relative min-w-0 flex-1">

                    <input
                      type={
                        mostrarPalavraPasse
                          ? "text"
                          : "password"
                      }
                      value={novaPalavraPasse}
                      onChange={(e) =>
                        setNovaPalavraPasse(
                          e.target.value
                        )
                      }
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-11 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarPalavraPasse(
                          (actual) => !actual
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        mostrarPalavraPasse
                          ? "Ocultar palavra-passe"
                          : "Mostrar palavra-passe"
                      }
                    >
                      {mostrarPalavraPasse ? (
                        <FaEyeSlash />
                      ) : (
                        <FaEye />
                      )}
                    </button>

                  </div>

                  <button
                    type="button"
                    onClick={alterarPalavraPasse}
                    disabled={
                      aAlterarPalavraPasse
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaLock />

                    {aAlterarPalavraPasse
                      ? "A actualizar..."
                      : "Actualizar"}
                  </button>

                </div>

                <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">

                  <FaShieldAlt className="mt-0.5 shrink-0 text-emerald-600" />

                  <span>
                    Recomendamos uma palavra-passe única, longa e difícil de adivinhar.
                  </span>

                </div>

              </div>
            </section>
          </div>

          {/* COLUNA LATERAL */}

          <aside className="space-y-5">

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <FaShieldAlt />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Conta segura
                  </h3>

                  <p className="text-xs text-slate-500">
                    Boas práticas de segurança
                  </p>
                </div>

              </div>

              <div className="mt-4 space-y-3">

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FaCheckCircle className="text-emerald-500" />
                  <span>Perfil configurado</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FaCheckCircle className="text-emerald-500" />
                  <span>E-mail associado</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FaCheckCircle className="text-emerald-500" />
                  <span>Acesso protegido</span>
                </div>

              </div>
            </section>

          </aside>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          SICSI · Sistema de Consciencialização em Segurança da Informação
        </p>

      </div>
    </main>
  );
}