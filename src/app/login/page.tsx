import LoginForm from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
          {/* ============================================================
              ÁREA INSTITUCIONAL
          ============================================================ */}
          <section className="hidden bg-gradient-to-br from-blue-950 to-blue-800 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div>
              <a
                href="/"
                className="inline-flex items-center gap-3"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl font-extrabold text-blue-900">
                  S
                </span>

                <span>
                  <span className="block text-2xl font-extrabold">
                    SICSI
                  </span>

                  <span className="block text-xs text-blue-200">
                    Segurança da Informação
                  </span>
                </span>
              </a>

              <div className="mt-20 max-w-md">
                <span className="text-sm font-bold uppercase tracking-widest text-blue-200">
                  Bem-vindo
                </span>

                <h1 className="mt-4 text-4xl font-extrabold leading-tight xl:text-5xl">
                  Aprenda a proteger o seu mundo digital.
                </h1>

                <p className="mt-6 text-lg leading-8 text-blue-100">
                  Aceda à plataforma SICSI e continue a desenvolver os seus
                  conhecimentos em segurança da informação e cibersegurança.
                </p>
              </div>
            </div>

            <div className="mt-12 border-t border-white/10 pt-6 text-sm text-blue-200">
              Universidade Joaquim Chissano
            </div>
          </section>

          {/* ============================================================
              FORMULÁRIO
          ============================================================ */}
          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16">
            <LoginForm />
          </section>
        </div>
      </div>
    </main>
  );
}