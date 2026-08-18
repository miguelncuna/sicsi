"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { criarClienteSupabase } from "@/lib/supabase/client";

import {
  FaBars,
  FaTimes,
  FaTachometerAlt,
  FaBook,
  FaUsers,
  FaComments,
  FaCommentDots,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [aberta, setAberta] = useState(false);
  const [aTerminarSessao, setATerminarSessao] =
    useState(false);

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

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "Erro ao terminar sessão:",
          error.message
        );

        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (erro) {
      console.error(
        "Erro inesperado ao terminar sessão:",
        erro
      );
    } finally {
      setATerminarSessao(false);
    }
  }

  /*
   * ============================================================
   * VERIFICAR LINK ACTIVO
   * ============================================================
   */

  function linkActivo(url: string) {
    if (url === "/admin") {
      return pathname === "/admin";
    }

    return (
      pathname === url ||
      pathname.startsWith(`${url}/`)
    );
  }

  /*
   * ============================================================
   * CLASSES DOS LINKS
   * ============================================================
   */

  function linkClasses(url: string) {
    const activo = linkActivo(url);

    return `
      group
      flex
      min-h-11
      items-center
      gap-3
      rounded-xl
      px-4
      py-3
      text-[14px]
      tracking-[-0.01em]
      transition-all
      duration-200
      ${
        activo
          ? "bg-white font-semibold text-blue-900 shadow-md"
          : "font-medium text-blue-50 hover:bg-blue-800 hover:text-white"
      }
    `;
  }

  /*
   * ============================================================
   * FECHAR MENU
   * ============================================================
   */

  function fecharMenu() {
    setAberta(false);
  }

  return (
    <>
      {/* ========================================================
          BOTÃO MOBILE
      ======================================================== */}

      <button
        type="button"
        onClick={() =>
          setAberta(!aberta)
        }
        className="
          fixed
          left-4
          top-4
          z-[60]
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          bg-blue-900
          text-white
          shadow-lg
          transition
          hover:bg-blue-800
          active:scale-95
          lg:hidden
        "
        aria-label={
          aberta
            ? "Fechar menu administrativo"
            : "Abrir menu administrativo"
        }
        aria-expanded={aberta}
      >
        {aberta ? (
          <FaTimes />
        ) : (
          <FaBars />
        )}
      </button>

      {/* ========================================================
          FUNDO MOBILE
      ======================================================== */}

      {aberta && (
        <button
          type="button"
          aria-label="Fechar menu administrativo"
          className="
            fixed
            inset-0
            z-40
            bg-slate-950/50
            backdrop-blur-sm
            lg:hidden
          "
          onClick={fecharMenu}
        />
      )}

      {/* ========================================================
          SIDEBAR
      ======================================================== */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          w-[280px]
          flex-col
          bg-blue-900
          font-sans
          shadow-2xl
          transition-transform
          duration-300
          ${
            aberta
              ? "translate-x-0"
              : "-translate-x-full"
          }
          lg:translate-x-0
        `}
      >

        {/* ======================================================
            CABEÇALHO
        ====================================================== */}

        <div className="shrink-0 border-b border-blue-800 px-5 py-5 sm:px-6 sm:py-6">

          <div className="flex items-center justify-between gap-3">

            <Link
              href="/admin"
              onClick={fecharMenu}
              className="min-w-0"
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-white
                    text-lg
                    font-bold
                    text-blue-900
                    shadow-sm
                  "
                >
                  S
                </div>

                <div className="min-w-0">

                  <h1 className="truncate text-xl font-bold tracking-tight text-white">
                    SICSI
                  </h1>

                  <p className="truncate text-xs font-medium text-blue-200">
                    Painel Administrativo
                  </p>

                </div>

              </div>

            </Link>

            {/* FECHAR MOBILE */}

            <button
              type="button"
              onClick={fecharMenu}
              aria-label="Fechar menu"
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                text-blue-200
                transition
                hover:bg-blue-800
                hover:text-white
                lg:hidden
              "
            >
              <FaTimes />
            </button>

          </div>

        </div>

        {/* ======================================================
            NAVEGAÇÃO
        ====================================================== */}

        <nav
          className="
            flex-1
            overflow-y-auto
            px-3
            py-5
            sm:px-4
            [scrollbar-width:none]
            [-ms-overflow-style:none]
            [&::-webkit-scrollbar]:hidden
          "
          aria-label="Navegação administrativa"
        >

          {/* PRINCIPAL */}

          <p
            className="
              mb-3
              px-3
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.16em]
              text-blue-300
            "
          >
            Principal
          </p>

          <div className="space-y-1.5">

            {/* DASHBOARD */}

            <Link
              href="/admin"
              className={linkClasses(
                "/admin"
              )}
              onClick={fecharMenu}
            >

              <span
                className={`
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  ${
                    linkActivo("/admin")
                      ? "bg-blue-100 text-blue-900"
                      : "bg-blue-800 text-blue-200 group-hover:bg-blue-700 group-hover:text-white"
                  }
                `}
              >
                <FaTachometerAlt className="text-sm" />
              </span>

              <span className="truncate">
                Dashboard
              </span>

            </Link>

          </div>

          {/* ====================================================
              GESTÃO
          ==================================================== */}

          <p
            className="
              mb-3
              mt-7
              px-3
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.16em]
              text-blue-300
            "
          >
            Gestão
          </p>

          <div className="space-y-1.5">

            {/* CURSOS */}

            <Link
              href="/admin/cursos"
              className={linkClasses(
                "/admin/cursos"
              )}
              onClick={fecharMenu}
            >

              <span
                className={`
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  ${
                    linkActivo(
                      "/admin/cursos"
                    )
                      ? "bg-blue-100 text-blue-900"
                      : "bg-blue-800 text-blue-200 group-hover:bg-blue-700 group-hover:text-white"
                  }
                `}
              >
                <FaBook className="text-sm" />
              </span>

              <span className="truncate">
                Cursos
              </span>

            </Link>

            {/* UTILIZADORES */}

            <Link
              href="/admin/utilizadores"
              className={linkClasses(
                "/admin/utilizadores"
              )}
              onClick={fecharMenu}
            >

              <span
                className={`
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  ${
                    linkActivo(
                      "/admin/utilizadores"
                    )
                      ? "bg-blue-100 text-blue-900"
                      : "bg-blue-800 text-blue-200 group-hover:bg-blue-700 group-hover:text-white"
                  }
                `}
              >
                <FaUsers className="text-sm" />
              </span>

              <span className="truncate">
                Utilizadores
              </span>

            </Link>

            {/* COMENTÁRIOS & FEEDBACKS */}

            <Link
              href="/admin/comentarios-feedbacks"
              className={linkClasses(
                "/admin/comentarios-feedbacks"
              )}
              onClick={fecharMenu}
            >

              <span
                className={`
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  ${
                    linkActivo(
                      "/admin/comentarios-feedbacks"
                    )
                      ? "bg-blue-100 text-blue-900"
                      : "bg-blue-800 text-blue-200 group-hover:bg-blue-700 group-hover:text-white"
                  }
                `}
              >
                <FaComments className="text-sm" />
              </span>

              <span className="truncate">
                Comentários & Feedbacks
              </span>

            </Link>

          </div>

          {/* ====================================================
              SISTEMA
          ==================================================== */}

          <p
            className="
              mb-3
              mt-7
              px-3
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.16em]
              text-blue-300
            "
          >
            Sistema
          </p>

          {/* DEFINIÇÕES */}

          <Link
            href="/admin/definicoes"
            className={linkClasses(
              "/admin/definicoes"
            )}
            onClick={fecharMenu}
          >

            <span
              className={`
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-lg
                ${
                  linkActivo(
                    "/admin/definicoes"
                  )
                    ? "bg-blue-100 text-blue-900"
                    : "bg-blue-800 text-blue-200 group-hover:bg-blue-700 group-hover:text-white"
                }
              `}
            >
              <FaCog className="text-sm" />
            </span>

            <span className="truncate">
              Definições
            </span>

          </Link>

        </nav>

        {/* ======================================================
            RODAPÉ — TERMINAR SESSÃO
        ====================================================== */}

        <div className="shrink-0 border-t border-blue-800 p-4">

          <button
            type="button"
            onClick={terminarSessao}
            disabled={aTerminarSessao}
            className="
              flex
              min-h-11
              w-full
              items-center
              justify-center
              gap-3
              rounded-xl
              bg-red-600
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-red-700
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >

            <FaSignOutAlt />

            <span>
              {aTerminarSessao
                ? "A terminar..."
                : "Terminar sessão"}
            </span>

          </button>

        </div>

      </aside>

      {/* ========================================================
          ESPAÇO RESERVADO NO DESKTOP
      ======================================================== */}

      <div className="hidden w-[280px] shrink-0 lg:block" />

    </>
  );
}