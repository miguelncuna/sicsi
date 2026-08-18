"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { criarClienteSupabase } from "@/lib/supabase/client";

import {
  FaArrowLeft,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaSignInAlt,
} from "react-icons/fa";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [palavraPasse, setPalavraPasse] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function iniciarSessao() {
    setErro("");

    if (!email.trim() || !palavraPasse) {
      setErro("Preencha o e-mail e a palavra-passe.");
      return;
    }

    setCarregando(true);

    try {
      const supabase = criarClienteSupabase();

      const { data: sessaoData, error: erroLogin } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: palavraPasse,
        });

      if (erroLogin) {
        console.error(
          "Erro ao iniciar sessão:",
          erroLogin.message
        );

        setErro("E-mail ou palavra-passe inválidos.");
        return;
      }

      const utilizador = sessaoData.user;

      if (!utilizador) {
        setErro(
          "Não foi possível identificar o utilizador autenticado."
        );
        return;
      }

      const { data: perfil, error: erroPerfil } =
        await supabase
          .from("perfis")
          .select("id, nome_completo, email, papel")
          .eq("id", utilizador.id)
          .single();

      if (erroPerfil || !perfil) {
        console.error(
          "Erro ao obter perfil:",
          erroPerfil?.message
        );

        await supabase.auth.signOut();

        setErro(
          "Não foi possível carregar o perfil da sua conta."
        );

        return;
      }

      if (perfil.papel === "ADMIN") {
        router.replace("/admin");
      } else if (perfil.papel === "ESTUDANTE") {
        router.replace("/dashboard");
      } else {
        console.error(
          "Papel de utilizador não reconhecido:",
          perfil.papel
        );

        await supabase.auth.signOut();

        setErro(
          "O tipo de conta não é reconhecido pelo sistema."
        );

        return;
      }

      router.refresh();
    } catch (erroInesperado) {
      console.error(
        "Erro inesperado ao iniciar sessão:",
        erroInesperado
      );

      setErro(
        "Ocorreu um erro ao iniciar sessão. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* ============================================================
          VOLTAR
      ============================================================ */}
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-blue-800"
      >
        <FaArrowLeft className="text-xs" />
        Voltar ao SICSI
      </Link>

      {/* ============================================================
          LOGO MOBILE
      ============================================================ */}
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-xl font-extrabold text-white shadow-md">
          S
        </div>

        <div>
          <p className="text-xl font-extrabold text-blue-950">
            SICSI
          </p>

          <p className="text-xs text-gray-500">
            Segurança da Informação
          </p>
        </div>
      </div>

      {/* ============================================================
          CABEÇALHO
      ============================================================ */}
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
          Área reservada
        </p>

        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Iniciar sessão
        </h2>

        <p className="mt-3 text-base leading-7 text-gray-500">
          Entre na sua conta para continuar a sua experiência no SICSI.
        </p>
      </div>

      {/* ============================================================
          ERRO
      ============================================================ */}
      {erro && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
        >
          {erro}
        </div>
      )}

      {/* ============================================================
          E-MAIL
      ============================================================ */}
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

      {/* ============================================================
          PALAVRA-PASSE
      ============================================================ */}
      <div className="mb-6">
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
            type={mostrarSenha ? "text" : "password"}
            placeholder="Digite a sua palavra-passe"
            value={palavraPasse}
            onChange={(e) => {
              setPalavraPasse(e.target.value);
              setErro("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !carregando) {
                iniciarSessao();
              }
            }}
            className="min-w-0 w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
            autoComplete="current-password"
            disabled={carregando}
          />

          <button
            type="button"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            className="ml-3 shrink-0 text-blue-700 transition hover:text-blue-900"
            aria-label={
              mostrarSenha
                ? "Ocultar palavra-passe"
                : "Mostrar palavra-passe"
            }
            disabled={carregando}
          >
            {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>

      {/* ============================================================
          ENTRAR
      ============================================================ */}
      <button
        type="button"
        onClick={iniciarSessao}
        disabled={carregando}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3.5 font-bold text-white shadow-md transition hover:bg-blue-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FaSignInAlt />

        {carregando ? "A entrar..." : "Iniciar sessão"}
      </button>

      {/* ============================================================
          REGISTO
      ============================================================ */}
      <div className="mt-7 border-t border-gray-100 pt-6 text-center">
        <p className="text-sm text-gray-500">
          Ainda não tem uma conta?
        </p>

        <Link
          href="/registo"
          className="mt-2 inline-block font-bold text-blue-700 transition hover:text-blue-900 hover:underline"
        >
          Criar uma conta
        </Link>
      </div>

      {/* ============================================================
          RODAPÉ
      ============================================================ */}
      <p className="mt-8 text-center text-xs leading-5 text-gray-400">
        SICSI — Sistema de Consciencialização em Segurança da Informação
      </p>
    </div>
  );
}