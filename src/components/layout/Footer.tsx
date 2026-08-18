import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* ============================================================
              SICSI
          ============================================================ */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-lg font-extrabold">
                S
              </div>

              <div>
                <h2 className="text-xl font-bold">SICSI</h2>

                <p className="text-sm text-gray-400">
                  Segurança da Informação
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-xl text-sm leading-7 text-gray-400">
              Plataforma de aprendizagem e consciencialização em
              cibersegurança, concebida para promover conhecimentos, boas
              práticas e comportamentos mais seguros no ambiente digital.
            </p>
          </div>

          {/* ============================================================
              PLATAFORMA
          ============================================================ */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Plataforma
            </h3>

            <ul className="mt-5 space-y-3 text-sm text-gray-400">
              <li>
                <Link
                  href="/"
                  className="transition hover:text-white"
                >
                  Início
                </Link>
              </li>

              <li>
                <Link
                  href="/#cursos"
                  className="transition hover:text-white"
                >
                  Cursos
                </Link>
              </li>

              <li>
                <Link
                  href="/#sobre"
                  className="transition hover:text-white"
                >
                  Sobre o SICSI
                </Link>
              </li>

              <li>
                <Link
                  href="/#contacto"
                  className="transition hover:text-white"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* ============================================================
              ACESSO
          ============================================================ */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Acesso
            </h3>

            <ul className="mt-5 space-y-3 text-sm text-gray-400">
              <li>
                <Link
                  href="/login"
                  className="transition hover:text-white"
                >
                  Iniciar sessão
                </Link>
              </li>

              <li>
                <Link
                  href="/registo"
                  className="transition hover:text-white"
                >
                  Criar conta
                </Link>
              </li>

              <li>
                <Link
                  href="/login"
                  className="transition hover:text-white"
                >
                  Área do estudante
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ============================================================
            LINHA INFERIOR
        ============================================================ */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} SICSI. Todos os direitos reservados.
          </p>

          <p>Universidade Joaquim Chissano</p>
        </div>
      </div>
    </footer>
  );
}