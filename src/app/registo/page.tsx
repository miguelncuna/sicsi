"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarClienteSupabase } from "@/lib/supabase/client";

import {
  FaArrowLeft,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";

export default function RegistoPage() {
  const router = useRouter();

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [palavraPasse, setPalavraPasse] = useState("");
  const [confirmarPalavraPasse, setConfirmarPalavraPasse] =
    useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] =
    useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function criarConta() {
    setErro("");
    setSucesso("");

    const nome = nomeCompleto.trim();
    const emailNormalizado = email.trim().toLowerCase();

    /* ============================================================
       VALIDAÇÕES
    ============================================================ */

    if (!nome) {
      setErro("Introduza o seu nome completo.");
      return;
    }

    if (!emailNormalizado) {
      setErro("Introduza o seu e-mail.");
      return;
    }

    if (!emailNormalizado.includes("@")) {
      setErro("Introduza um e-mail válido.");
      return;
    }

    if (palavraPasse.length < 6) {
      setErro(
        "A palavra-passe deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (palavraPasse !== confirmarPalavraPasse) {
      setErro("As palavras-passe não coincidem.");
      return;
    }

    setCarregando(true);

    try {
      const supabase = criarClienteSupabase();

      /* ============================================================
         CRIAR UTILIZADOR NO SUPABASE AUTH
      ============================================================ */

      const { data, error } = await supabase.auth.signUp({
        email: emailNormalizado,
        password: palavraPasse,

        options: {
          data: {
            nome_completo: nome,
          },
        },
      });

      /* ============================================================
         ERRO DO SUPABASE
      ============================================================ */

      if (error) {
        console.error(
          "Erro no registo:",
          error.message
        );

        setErro(
          error.message ||
            "Não foi possível criar a conta."
        );

        return;
      }

      /* ============================================================
         CONFIRMAR UTILIZADOR
      ============================================================ */

      if (!data.user) {
        console.error(
          "O Supabase não devolveu o utilizador."
        );

        setErro(
          "A conta não pôde ser criada. Tente novamente."
        );

        return;
      }

      /* ============================================================
         CONFIRMAR SESSÃO
      ============================================================ */

      if (!data.session) {
        console.error(
          "Utilizador criado, mas nenhuma sessão foi criada.",
          data
        );

        setSucesso(
          "A conta foi criada com sucesso. Verifique o seu e-mail para confirmar a conta antes de iniciar sessão."
        );

        setNomeCompleto("");
        setEmail("");
        setPalavraPasse("");
        setConfirmarPalavraPasse("");

        return;
      }

      /* ============================================================
         LIMPAR FORMULÁRIO
      ============================================================ */

      setNomeCompleto("");
      setEmail("");
      setPalavraPasse("");
      setConfirmarPalavraPasse("");

      /* ============================================================
         IR PARA DASHBOARD
      ============================================================ */

      router.replace("/dashboard");
      router.refresh();

    } catch (erroInesperado) {
      console.error(
        "Erro inesperado no registo:",
        erroInesperado
      );

      setErro(
        "Ocorreu um erro inesperado ao criar a conta. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-4 py-6 sm:px-6 sm:py-10">

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">

        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">

          {/* ========================================================
              ÁREA INSTITUCIONAL
          ======================================================== */}

          <section className="hidden bg-gradient-to-br from-blue-950 to-blue-800 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">

            <div>

              {/* LOGO */}

              <Link
                href="/"
                className="inline-flex items-center gap-3"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl font-extrabold text-blue-900 shadow-lg">
                  S
                </span>

                <span>
                  <span className="block text-2xl font-extrabold tracking-tight">
                    SICSI
                  </span>

                  <span className="block text-xs text-blue-200">
                    Segurança da Informação
                  </span>
                </span>
              </Link>

              {/* TEXTO */}

              <div className="mt-20 max-w-md">

                <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
                  Comece agora
                </span>

                <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
                  Aprenda.
                  <br />
                  Pratique.
                  <br />
                  Proteja.
                </h1>

                <p className="mt-7 text-base leading-8 text-blue-100 xl:text-lg">
                  Crie a sua conta e tenha acesso à experiência
                  de aprendizagem do SICSI, desenvolvida para
                  fortalecer os seus conhecimentos em segurança
                  da informação e cibersegurança.
                </p>

              </div>

            </div>

            {/* INSTITUIÇÃO */}

            <div className="mt-12 border-t border-white/10 pt-6 text-sm text-blue-200">
              Universidade Joaquim Chissano
            </div>

          </section>

          {/* ========================================================
              ÁREA DO FORMULÁRIO
          ======================================================== */}

          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-14">

            <div className="w-full max-w-md">

              {/* VOLTAR */}

              <Link
                href="/"
                className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-blue-800"
              >
                <FaArrowLeft className="text-xs" />
                Voltar ao SICSI
              </Link>

              {/* LOGO MOBILE */}

              <div className="mb-8 flex items-center gap-3 lg:hidden">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-xl font-extrabold text-white shadow-md">
                  S
                </div>

                <div>
                  <p className="text-xl font-extrabold tracking-tight text-blue-950">
                    SICSI
                  </p>

                  <p className="text-xs text-gray-500">
                    Segurança da Informação
                  </p>
                </div>

              </div>

              {/* CABEÇALHO */}

              <div className="mb-8">

                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
                  Novo estudante
                </p>

                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  Criar conta
                </h2>

                <p className="mt-3 text-sm leading-7 text-gray-500 sm:text-base">
                  Crie a sua conta para começar a sua experiência
                  de aprendizagem no SICSI.
                </p>

              </div>

              {/* ====================================================
                  MENSAGEM DE ERRO
              ==================================================== */}

              {erro && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                >
                  {erro}
                </div>
              )}

              {/* ====================================================
                  MENSAGEM DE SUCESSO
              ==================================================== */}

              {sucesso && (
                <div
                  role="status"
                  className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm leading-6 text-green-700"
                >

                  <p>{sucesso}</p>

                  <Link
                    href="/login"
                    className="mt-2 inline-block font-bold underline transition hover:text-green-900"
                  >
                    Iniciar sessão
                  </Link>

                </div>
              )}

              {/* ====================================================
                  NOME COMPLETO
              ==================================================== */}

              <div className="mb-5">

                <label
                  htmlFor="nome-completo"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Nome completo
                </label>

                <div className="flex w-full items-center rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">

                  <FaUser className="mr-3 shrink-0 text-blue-700" />

                  <input
                    id="nome-completo"
                    type="text"
                    placeholder="Digite o seu nome completo"
                    value={nomeCompleto}
                    onChange={(e) => {
                      setNomeCompleto(e.target.value);
                      setErro("");
                    }}
                    className="min-w-0 w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
                    autoComplete="name"
                    disabled={carregando}
                  />

                </div>

              </div>

              {/* ====================================================
                  E-MAIL
              ==================================================== */}

              <div className="mb-5">

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  E-mail
                </label>

                <div className="flex w-full items-center rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">

                  <FaEnvelope className="mr-3 shrink-0 text-blue-700" />

                  <input
                    id="email"
                    type="email"
                    placeholder="Digite o seu e-mail"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErro("");
                    }}
                    className="min-w-0 w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
                    autoComplete="email"
                    disabled={carregando}
                  />

                </div>

              </div>

              {/* ====================================================
                  PALAVRA-PASSE
              ==================================================== */}

              <div className="mb-5">

                <label
                  htmlFor="palavra-passe"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Palavra-passe
                </label>

                <div className="flex w-full items-center rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">

                  <FaLock className="mr-3 shrink-0 text-blue-700" />

                  <input
                    id="palavra-passe"
                    type={
                      mostrarSenha
                        ? "text"
                        : "password"
                    }
                    placeholder="Crie uma palavra-passe"
                    value={palavraPasse}
                    onChange={(e) => {
                      setPalavraPasse(e.target.value);
                      setErro("");
                    }}
                    className="min-w-0 w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
                    autoComplete="new-password"
                    disabled={carregando}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarSenha(!mostrarSenha)
                    }
                    className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blue-700 transition hover:bg-blue-50 hover:text-blue-900"
                    aria-label={
                      mostrarSenha
                        ? "Ocultar palavra-passe"
                        : "Mostrar palavra-passe"
                    }
                    disabled={carregando}
                  >
                    {mostrarSenha ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>

                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Utilize pelo menos 6 caracteres.
                </p>

              </div>

              {/* ====================================================
                  CONFIRMAR PALAVRA-PASSE
              ==================================================== */}

              <div className="mb-6">

                <label
                  htmlFor="confirmar-palavra-passe"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Confirmar palavra-passe
                </label>

                <div className="flex w-full items-center rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">

                  <FaLock className="mr-3 shrink-0 text-blue-700" />

                  <input
                    id="confirmar-palavra-passe"
                    type={
                      mostrarConfirmacao
                        ? "text"
                        : "password"
                    }
                    placeholder="Repita a sua palavra-passe"
                    value={confirmarPalavraPasse}
                    onChange={(e) => {
                      setConfirmarPalavraPasse(
                        e.target.value
                      );
                      setErro("");
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !carregando
                      ) {
                        criarConta();
                      }
                    }}
                    className="min-w-0 w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
                    autoComplete="new-password"
                    disabled={carregando}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarConfirmacao(
                        !mostrarConfirmacao
                      )
                    }
                    className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blue-700 transition hover:bg-blue-50 hover:text-blue-900"
                    aria-label={
                      mostrarConfirmacao
                        ? "Ocultar confirmação da palavra-passe"
                        : "Mostrar confirmação da palavra-passe"
                    }
                    disabled={carregando}
                  >
                    {mostrarConfirmacao ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>

                </div>

              </div>

              {/* ====================================================
                  BOTÃO PRINCIPAL
              ==================================================== */}

              <button
                type="button"
                onClick={criarConta}
                disabled={carregando}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3.5 font-bold text-white shadow-md transition duration-200 hover:bg-blue-900 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >

                <FaUserPlus />

                {carregando
                  ? "A criar conta..."
                  : "Criar conta"}

              </button>

              {/* ====================================================
                  LOGIN
              ==================================================== */}

              <div className="mt-7 border-t border-gray-100 pt-6 text-center">

                <p className="text-sm text-gray-500">
                  Já possui uma conta?
                </p>

                <Link
                  href="/login"
                  className="mt-2 inline-block font-bold text-blue-700 transition hover:text-blue-900 hover:underline"
                >
                  Iniciar sessão
                </Link>

              </div>

              {/* ====================================================
                  RODAPÉ
              ==================================================== */}

              <p className="mt-8 text-center text-xs leading-5 text-gray-400">
                SICSI — Sistema de Consciencialização em Segurança
                da Informação
              </p>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}