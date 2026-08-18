"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { criarClienteSupabase } from "@/lib/supabase/client";

import {
  FaBars,
  FaTimes,
  FaHome,
  FaBookOpen,
  FaShieldAlt,
  FaCertificate,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

interface Perfil {
  nome_completo: string;
  email: string;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [aberta, setAberta] = useState(false);
  const [aTerminarSessao, setATerminarSessao] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  /*
   * ============================================================
   * CARREGAR PERFIL
   * ============================================================
   */

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const supabase = criarClienteSupabase();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        const { data } = await supabase
          .from("perfis")
          .select("nome_completo, email")
          .eq("id", user.id)
          .single();

        if (data) {
          setPerfil(data);
        }
      } catch (erro) {
        console.error(
          "Erro ao carregar perfil do estudante:",
          erro
        );
      }
    }

    carregarPerfil();
  }, []);

  /*
   * ============================================================
   * FECHAR MENU AO MUDAR DE ROTA
   * ============================================================
   */

  useEffect(() => {
    setAberta(false);
  }, [pathname]);

  /*
   * ============================================================
   * TERMINAR SESSÃO
   * ============================================================
   */

  async function terminarSessao() {
    if (aTerminarSessao) {
      return;
    }

    setATerminarSessao(true);

    try {
      const supabase = criarClienteSupabase();

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error(
          "Erro ao terminar sessão:",
          error.message
        );

        alert("Não foi possível terminar a sessão.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (erro) {
      console.error(
        "Erro inesperado ao terminar a sessão:",
        erro
      );

      alert(
        "Ocorreu um erro ao terminar a sessão."
      );
    } finally {
      setATerminarSessao(false);
    }
  }

  /*
   * ============================================================
   * INICIAIS DO UTILIZADOR
   * ============================================================
   */

  const iniciais =
    perfil?.nome_completo
      ?.split(" ")
      .filter(Boolean)
      .map((nome) => nome[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  /*
   * ============================================================
   * MENU ACTIVO
   * ============================================================
   */

  function obterClassesLink(rota: string) {
    const ativo =
      pathname === rota ||
      pathname.startsWith(`${rota}/`);

    return `
      group flex items-center gap-3
      rounded-xl px-4 py-3
      text-sm font-medium
      transition-all duration-200
      ${
        ativo
          ? "bg-white text-blue-900 shadow-sm"
          : "text-blue-100 hover:bg-blue-800/70 hover:text-white"
      }
    `;
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <>
      {/* ======================================================
          BOTÃO MOBILE
      ====================================================== */}

      <button
        type="button"
        onClick={() => setAberta(!aberta)}
        className="
          fixed left-4 top-4 z-[70]
          flex h-11 w-11
          items-center justify-center
          rounded-xl
          bg-blue-900
          text-white
          shadow-lg
          transition-all duration-200
          hover:bg-blue-800
          active:scale-95
          lg:hidden
        "
        aria-label={
          aberta
            ? "Fechar menu"
            : "Abrir menu"
        }
        aria-expanded={aberta}
      >
        {aberta ? (
          <FaTimes />
        ) : (
          <FaBars />
        )}
      </button>

      {/* ======================================================
          OVERLAY MOBILE
      ====================================================== */}

      {aberta && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setAberta(false)}
          className="
            fixed inset-0 z-40
            bg-slate-950/50
            backdrop-blur-[2px]
            lg:hidden
          "
        />
      )}

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-72
          flex-col
          bg-blue-950
          text-white
          shadow-2xl
          transition-transform duration-300 ease-out
          ${
            aberta
              ? "translate-x-0"
              : "-translate-x-full"
          }
          lg:translate-x-0
        `}
      >
        {/* ====================================================
            LOGÓTIPO / MARCA
        ==================================================== */}

        <div className="border-b border-white/10 px-6 py-6">
          <Link
            href="/dashboard"
            className="block"
            onClick={() => setAberta(false)}
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-11 w-11
                  items-center justify-center
                  rounded-xl
                  bg-white
                  text-lg font-extrabold
                  text-blue-950
                  shadow-sm
                "
              >
                S
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  SICSI
                </h1>

                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-200">
                  Segurança da Informação
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* ====================================================
            NAVEGAÇÃO
        ==================================================== */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-4 text-[11px] font-bold uppercase tracking-widest text-blue-300">
            Navegação
          </p>

          <div className="space-y-1.5">

            {/* Início */}

            <Link
              href="/dashboard"
              onClick={() => setAberta(false)}
              className={obterClassesLink(
                "/dashboard"
              )}
            >
              <FaHome className="shrink-0 text-base" />

              <span>
                Início
              </span>
            </Link>

            {/* Cursos */}

            <Link
              href="/dashboard/cursos"
              onClick={() => setAberta(false)}
              className={obterClassesLink(
                "/dashboard/cursos"
              )}
            >
              <FaBookOpen className="shrink-0 text-base" />

              <span>
                Meus cursos
              </span>
            </Link>

            {/* Simulações */}

            <Link
              href="/dashboard/simulacoes"
              onClick={() => setAberta(false)}
              className={obterClassesLink(
                "/dashboard/simulacoes"
              )}
            >
              <FaShieldAlt className="shrink-0 text-base" />

              <span>
                Simulações
              </span>
            </Link>

            {/* Certificados */}

            <Link
              href="/dashboard/certificados"
              onClick={() => setAberta(false)}
              className={obterClassesLink(
                "/dashboard/certificados"
              )}
            >
              <FaCertificate className="shrink-0 text-base" />

              <span>
                Certificados
              </span>
            </Link>

          </div>

          {/* ==================================================
              CONTA
          ================================================== */}

          <div className="mt-8">

            <p className="mb-3 px-4 text-[11px] font-bold uppercase tracking-widest text-blue-300">
              Conta
            </p>

            <Link
              href="/dashboard/definicoes"
              onClick={() => setAberta(false)}
              className={obterClassesLink(
                "/dashboard/definicoes"
              )}
            >
              <FaCog className="shrink-0 text-base" />

              <span>
                Definições
              </span>
            </Link>

          </div>
        </nav>

        {/* ====================================================
            PERFIL DO ESTUDANTE
        ==================================================== */}

        <div className="border-t border-white/10 px-4 py-4">

          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">

            <div
              className="
                flex h-10 w-10
                shrink-0
                items-center justify-center
                rounded-full
                bg-white
                text-sm font-bold
                text-blue-950
              "
            >
              {iniciais}
            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold text-white">
                {perfil?.nome_completo ||
                  "Estudante"}
              </p>

              <p className="truncate text-xs text-blue-200">
                {perfil?.email ||
                  "Conta SICSI"}
              </p>

            </div>

          </div>

          {/* ==================================================
              TERMINAR SESSÃO
          ================================================== */}

          <button
            type="button"
            onClick={terminarSessao}
            disabled={aTerminarSessao}
            className="
              flex w-full
              items-center justify-center
              gap-3
              rounded-xl
              border border-red-400/20
              bg-red-500/10
              px-4 py-3
              text-sm font-semibold
              text-red-200
              transition-all duration-200
              hover:border-red-400/30
              hover:bg-red-500/20
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <FaSignOutAlt />

            {aTerminarSessao
              ? "A terminar..."
              : "Terminar sessão"}
          </button>

        </div>
      </aside>
    </>
  );
}