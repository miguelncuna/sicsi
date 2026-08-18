import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <main>
        {/* ============================================================
            HERO
        ============================================================ */}
        <section
          aria-labelledby="hero-titulo"
          className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white blur-3xl" />
            <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-blue-300 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
            <div className="max-w-4xl">
              <span className="inline-flex items-center rounded-full border border-blue-300/30 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100 backdrop-blur-sm">
                SICSI • Segurança da Informação
              </span>

              <h1
                id="hero-titulo"
                className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                Desenvolva uma cultura de{" "}
                <span className="text-blue-200">
                  cibersegurança
                </span>
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100 sm:text-xl">
                O SICSI é uma plataforma de consciencialização em segurança da
                informação criada para ajudar a comunidade universitária a
                reconhecer riscos digitais, adoptar boas práticas e tomar
                decisões mais seguras no ambiente digital.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/registo"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 font-bold text-blue-900 shadow-lg transition hover:bg-blue-50"
                >
                  Começar agora
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Iniciar sessão
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SOBRE O SICSI
            ÂNCORA: #sobre
        ============================================================ */}
        <section
          id="sobre"
          aria-labelledby="sobre-titulo"
          className="scroll-mt-24 bg-white py-20"
        >
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="text-sm font-bold uppercase tracking-widest text-blue-700">
                  Sobre o SICSI
                </span>

                <h2
                  id="sobre-titulo"
                  className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
                >
                  Aprender segurança digital deve ser uma experiência prática
                </h2>

                <p className="mt-6 text-lg leading-8 text-gray-600">
                  O SICSI foi concebido para promover a consciencialização em
                  cibersegurança no ensino superior, combinando aprendizagem,
                  avaliação e prática.
                </p>

                <p className="mt-4 leading-7 text-gray-600">
                  A plataforma permitirá que os estudantes conheçam conceitos
                  fundamentais de segurança da informação, estudem conteúdos,
                  realizem avaliações e enfrentem situações práticas de
                  cibersegurança.
                </p>

                <div className="mt-8">
                  <Link
                    href="/registo"
                    className="inline-flex items-center rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white transition hover:bg-blue-900"
                  >
                    Fazer parte do SICSI
                  </Link>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-800">
                    01
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    Aprender
                  </h3>

                  <p className="mt-2 leading-6 text-gray-600">
                    Aceda a conteúdos educativos organizados por cursos e
                    módulos.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-800">
                    02
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    Avaliar
                  </h3>

                  <p className="mt-2 leading-6 text-gray-600">
                    Verifique os seus conhecimentos através de avaliações
                    integradas na aprendizagem.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-800">
                    03
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    Praticar
                  </h3>

                  <p className="mt-2 leading-6 text-gray-600">
                    Enfrente situações práticas e aprenda a tomar decisões
                    perante riscos digitais.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-800">
                    04
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    Progredir
                  </h3>

                  <p className="mt-2 leading-6 text-gray-600">
                    Acompanhe a sua evolução e avance progressivamente na sua
                    aprendizagem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            CIBERSEGURANÇA
        ============================================================ */}
        <section
          aria-labelledby="ciberseguranca-titulo"
          className="bg-gray-50 py-20"
        >
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-sm font-bold uppercase tracking-widest text-blue-700">
                Cibersegurança
              </span>

              <h2
                id="ciberseguranca-titulo"
                className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl"
              >
                Pequenas decisões podem evitar grandes problemas
              </h2>

              <p className="mt-5 text-lg leading-8 text-gray-600">
                A segurança digital não depende apenas de tecnologia. Depende
                também das decisões tomadas diariamente por cada utilizador.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="text-3xl">🔐</div>

                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  Credenciais
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Proteja palavras-passe e informações de autenticação.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="text-3xl">🎣</div>

                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  Phishing
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Aprenda a reconhecer mensagens e páginas fraudulentas.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="text-3xl">🛡️</div>

                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  Protecção de dados
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Desenvolva práticas responsáveis para proteger informação.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="text-3xl">🧠</div>

                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  Engenharia social
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Identifique técnicas utilizadas para manipular utilizadores.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            CURSOS
            ÂNCORA: #cursos
        ============================================================ */}
        <section
          id="cursos"
          aria-labelledby="cursos-titulo"
          className="scroll-mt-24 bg-white py-20"
        >
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="text-sm font-bold uppercase tracking-widest text-blue-700">
                  Formação
                </span>

                <h2
                  id="cursos-titulo"
                  className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl"
                >
                  Cursos disponíveis
                </h2>

                <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
                  Explore os cursos de consciencialização em segurança da
                  informação disponíveis no SICSI.
                </p>
              </div>

              <Link
                href="/#cursos"
                className="inline-flex w-fit items-center rounded-xl border border-blue-800 px-5 py-3 font-semibold text-blue-800 transition hover:bg-blue-50"
              >
                Ver cursos
              </Link>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* CURSO 1 */}
              <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-40 items-end bg-gradient-to-br from-blue-950 to-blue-700 p-6">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">
                    Curso
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Introdução à Cibersegurança
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    Conheça os fundamentos da segurança da informação e os
                    principais riscos presentes no ambiente digital.
                  </p>

                  <div className="mt-6">
                    <Link
                      href="/registo"
                      className="font-semibold text-blue-800 hover:text-blue-950"
                    >
                      Começar aprendizagem →
                    </Link>
                  </div>
                </div>
              </article>

              {/* CURSO 2 */}
              <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-40 items-end bg-gradient-to-br from-indigo-950 to-indigo-700 p-6">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">
                    Curso
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Protecção de Dados
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    Aprenda princípios e práticas essenciais para proteger
                    informações pessoais e institucionais.
                  </p>

                  <div className="mt-6">
                    <Link
                      href="/registo"
                      className="font-semibold text-blue-800 hover:text-blue-950"
                    >
                      Começar aprendizagem →
                    </Link>
                  </div>
                </div>
              </article>

              {/* CURSO 3 */}
              <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-40 items-end bg-gradient-to-br from-slate-950 to-slate-700 p-6">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">
                    Curso
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Segurança no Ambiente Digital
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    Desenvolva hábitos mais seguros na utilização de sistemas,
                    redes, dispositivos e serviços digitais.
                  </p>

                  <div className="mt-6">
                    <Link
                      href="/registo"
                      className="font-semibold text-blue-800 hover:text-blue-950"
                    >
                      Começar aprendizagem →
                    </Link>
                  </div>
                </div>
              </article>
            </div>

            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm leading-6 text-blue-900">
                <strong>Nota:</strong> esta área será ligada aos cursos
                efectivamente publicados na base de dados do SICSI, evitando
                apresentar informação fictícia ao público.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            ESTATÍSTICAS
        ============================================================ */}
        <section
          aria-labelledby="estatisticas-titulo"
          className="bg-gray-950 py-20 text-white"
        >
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="max-w-3xl">
              <span className="text-sm font-bold uppercase tracking-widest text-blue-300">
                Cibersegurança na UJC
              </span>

              <h2
                id="estatisticas-titulo"
                className="mt-3 text-3xl font-bold sm:text-4xl"
              >
                Informação para compreender o desafio
              </h2>

              <p className="mt-5 text-lg leading-8 text-gray-300">
                O SICSI terá uma área dedicada à apresentação de dados e
                indicadores relacionados com a cibersegurança no contexto da
                Universidade Joaquim Chissano.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold text-gray-400">
                  Indicador 01
                </p>

                <p className="mt-4 text-xl font-bold">
                  Incidentes de segurança
                </p>

                <p className="mt-2 text-sm text-gray-400">
                  Dados institucionais a integrar.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold text-gray-400">
                  Indicador 02
                </p>

                <p className="mt-4 text-xl font-bold">
                  Consciencialização
                </p>

                <p className="mt-2 text-sm text-gray-400">
                  Indicadores a apresentar com fontes verificadas.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold text-gray-400">
                  Indicador 03
                </p>

                <p className="mt-4 text-xl font-bold">
                  Riscos digitais
                </p>

                <p className="mt-2 text-sm text-gray-400">
                  Informação contextual sobre ameaças.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold text-gray-400">
                  Indicador 04
                </p>

                <p className="mt-4 text-xl font-bold">
                  Educação em segurança
                </p>

                <p className="mt-2 text-sm text-gray-400">
                  Dados a integrar na versão final.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            CONTACTO
            ÂNCORA: #contacto
        ============================================================ */}
        <section
          id="contacto"
          aria-labelledby="contacto-titulo"
          className="scroll-mt-24 bg-white py-20"
        >
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <span className="text-sm font-bold uppercase tracking-widest text-blue-700">
                  Contacto
                </span>

                <h2
                  id="contacto-titulo"
                  className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl"
                >
                  Fale com a equipa do SICSI
                </h2>

                <p className="mt-5 max-w-xl text-lg leading-8 text-gray-600">
                  Tem alguma questão, sugestão ou pretende saber mais sobre a
                  plataforma? Entre em contacto connosco.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                    ✉️
                  </div>

                  <h3 className="mt-5 font-bold text-gray-900">
                    Correio electrónico
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Canal de comunicação a configurar na versão final.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                    🎓
                  </div>

                  <h3 className="mt-5 font-bold text-gray-900">
                    Universidade
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Universidade Joaquim Chissano
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            CALL TO ACTION FINAL
        ============================================================ */}
        <section className="bg-white pb-20">
          <div className="mx-auto max-w-5xl px-6 sm:px-8">
            <div className="rounded-3xl bg-gradient-to-br from-blue-900 to-blue-800 px-6 py-12 text-center shadow-xl sm:px-12">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Está preparado para aprender mais sobre cibersegurança?
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100">
                Crie a sua conta no SICSI e tenha acesso à experiência de
                aprendizagem, avaliações, simulações e acompanhamento do seu
                progresso.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/registo"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 font-bold text-blue-900 transition hover:bg-blue-50"
                >
                  Criar conta
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3.5 font-bold text-white transition hover:bg-white/10"
                >
                  Já tenho uma conta
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}