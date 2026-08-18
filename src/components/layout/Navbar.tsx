"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-blue-950 text-white shadow-lg">
      <nav className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="flex h-20 items-center justify-between">
          {/* ============================================================
              LOGÓTIPO
          ============================================================ */}
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={() => setMenuAberto(false)}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-extrabold text-blue-900 shadow-md">
              S
            </div>

            <div>
              <span className="block text-xl font-extrabold tracking-tight">
                SICSI
              </span>

              <span className="hidden text-xs text-blue-200 sm:block">
                Segurança da Informação
              </span>
            </div>
          </Link>

          {/* ============================================================
              MENU DESKTOP
          ============================================================ */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm font-semibold text-white transition hover:text-blue-200"
            >
              Início
            </Link>

            <Link
              href="/#cursos"
              className="text-sm font-semibold text-blue-100 transition hover:text-white"
            >
              Cursos
            </Link>

            <Link
              href="/#sobre"
              className="text-sm font-semibold text-blue-100 transition hover:text-white"
            >
              Sobre o SICSI
            </Link>

            <Link
              href="/#contacto"
              className="text-sm font-semibold text-blue-100 transition hover:text-white"
            >
              Contacto
            </Link>
          </div>

          {/* ============================================================
              AUTENTICAÇÃO DESKTOP
          ============================================================ */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Iniciar sessão
            </Link>

            <Link
              href="/registo"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-blue-900 shadow-md transition hover:bg-blue-50"
            >
              Criar conta
            </Link>
          </div>

          {/* ============================================================
              BOTÃO MOBILE
          ============================================================ */}
          <button
            type="button"
            aria-label={
              menuAberto ? "Fechar menu de navegação" : "Abrir menu de navegação"
            }
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto(!menuAberto)}
            className="rounded-xl border border-white/20 p-2.5 text-white transition hover:bg-white/10 md:hidden"
          >
            {menuAberto ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* ==============================================================
            MENU MOBILE
        ============================================================== */}
        {menuAberto && (
          <div className="border-t border-white/10 py-5 md:hidden">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setMenuAberto(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                Início
              </Link>

              <Link
                href="/#cursos"
                onClick={() => setMenuAberto(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                Cursos
              </Link>

              <Link
                href="/#sobre"
                onClick={() => setMenuAberto(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                Sobre o SICSI
              </Link>

              <Link
                href="/#contacto"
                onClick={() => setMenuAberto(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                Contacto
              </Link>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                <Link
                  href="/login"
                  onClick={() => setMenuAberto(false)}
                  className="rounded-xl border border-white/30 px-4 py-3 text-center text-sm font-bold transition hover:bg-white/10"
                >
                  Entrar
                </Link>

                <Link
                  href="/registo"
                  onClick={() => setMenuAberto(false)}
                  className="rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-blue-900 transition hover:bg-blue-50"
                >
                  Criar conta
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}