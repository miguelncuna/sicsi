"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";

const cyberImages = [
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1800&q=90",
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1800&q=90",
  "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1800&q=90",
];

const rotatingTitles = [
  "protege o teu mundo digital.",
  "começa contigo.",
  "transforma conhecimento em defesa.",
  "torna-te mais difícil de enganar.",
];

function IconShield({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <path
        d="M24 4 41 10v11.2C41 32.2 34.2 39.7 24 44 13.8 39.7 7 32.2 7 21.2V10l17-6Z"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="m15.5 24 5.3 5.3L33 17"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function IconMenu({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
      <path d="m8 5 11 7-11 7V5Z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.3">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function IconRadar() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="m12 12 6-6" />
      <path d="M12 2v2M22 12h-2M12 22v-2M2 12h2" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 5a2 2 0 0 1 2-2h14v17H6a2 2 0 0 0-2 2V5Z" />
      <path d="M4 19a2 2 0 0 1 2-2h14" />
      <path d="M8 7h8M8 10h6" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <div className="logo-mark">
        <div className="logo-ring logo-ring-one" />
        <div className="logo-ring logo-ring-two" />

        <svg viewBox="0 0 48 48" className="relative z-10 size-7">
          <path
            d="M24 5 40 11v10.5C40 31.7 33.5 38.8 24 43 14.5 38.8 8 31.7 8 21.5V11l16-6Z"
            fill="rgba(103,232,249,.06)"
            stroke="currentColor"
            strokeWidth="1.7"
          />

          <path
            d="m15.5 24 5.2 5.2L33 17"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M24 11v5"
            stroke="currentColor"
            strokeWidth="1.3"
            opacity=".55"
          />
        </svg>
      </div>

      <div>
        <div className="text-[15px] font-bold tracking-[.22em] text-white">
          SICSI
        </div>
        <div className="hidden text-[8px] uppercase tracking-[.18em] text-white/30 sm:block">
          Segurança da Informação
        </div>
      </div>
    </Link>
  );
}

function Spotlight({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const move = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    e.currentTarget.style.setProperty(
      "--x",
      `${e.clientX - rect.left}px`,
    );

    e.currentTarget.style.setProperty(
      "--y",
      `${e.clientY - rect.top}px`,
    );
  };

  return (
    <div
      onMouseMove={move}
      className={`premium-spotlight ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [titleIndex, setTitleIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [typedTitle, setTypedTitle] = useState("");

  const currentTitle = rotatingTitles[titleIndex];

  useEffect(() => {
    let position = 0;
    let deleting = false;

    const interval = setInterval(() => {
      if (!deleting) {
        position += 1;
        setTypedTitle(currentTitle.slice(0, position));

        if (position === currentTitle.length) {
          deleting = true;
        }
      } else {
        position -= 1;
        setTypedTitle(currentTitle.slice(0, position));

        if (position === 0) {
          deleting = false;
          setTitleIndex((current) => (current + 1) % rotatingTitles.length);
        }
      }
    }, deleting ? 35 : 65);

    return () => clearInterval(interval);
  }, [currentTitle]);

  useEffect(() => {
    const timer = setInterval(() => {
      setImageIndex((current) => (current + 1) % cyberImages.length);
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="sicsi-home">

      {/* BACKGROUND */}
      <div className="cyber-background">
        <div className="cyber-grid" />
        <div className="cyber-noise" />
        <div className="cyber-glow cyber-glow-one" />
        <div className="cyber-glow cyber-glow-two" />
      </div>

      {/* NAVBAR */}
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <nav className="mx-auto flex h-[70px] max-w-[1420px] items-center justify-between rounded-[20px] border border-white/[.08] bg-[#06090d]/70 px-4 shadow-2xl backdrop-blur-2xl sm:px-6">

          <Logo />

          <div className="hidden items-center gap-8 lg:flex">
            <a href="#sobre" className="nav-item">Sobre</a>
            <a href="#metodo" className="nav-item">Método</a>
            <a href="#cursos" className="nav-item">Cursos</a>
            <a href="#simulacoes" className="nav-item">Simulações</a>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-xs font-medium text-white/50 transition hover:text-white"
            >
              Entrar
            </Link>

            <Link
              href="/registo"
              className="premium-button"
            >
              Começar
              <IconArrow />
            </Link>
          </div>

          <button
            onClick={() => setMenu(!menu)}
            className="grid size-10 place-items-center rounded-xl border border-white/[.08] bg-white/[.03] text-white/70 sm:hidden"
            aria-label="Menu"
          >
            <IconMenu open={menu} />
          </button>

          {menu && (
            <div className="absolute left-0 right-0 top-[78px] rounded-2xl border border-white/[.08] bg-[#06090d]/95 p-4 shadow-2xl backdrop-blur-2xl sm:hidden">
              <div className="grid gap-1">
                <a onClick={() => setMenu(false)} href="#sobre" className="mobile-link">Sobre</a>
                <a onClick={() => setMenu(false)} href="#metodo" className="mobile-link">Método</a>
                <a onClick={() => setMenu(false)} href="#cursos" className="mobile-link">Cursos</a>
                <a onClick={() => setMenu(false)} href="#simulacoes" className="mobile-link">Simulações</a>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[.07] pt-3">
                <Link href="/login" className="mobile-button">
                  Entrar
                </Link>
                <Link href="/registo" className="mobile-button mobile-button-primary">
                  Começar
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* HERO */}
      <section className="relative flex min-h-screen items-center px-5 pb-20 pt-36 sm:px-8 lg:px-10">

        <div className="mx-auto grid w-full max-w-[1420px] items-center gap-16 lg:grid-cols-[1fr_.95fr]">

          {/* COPY */}
          <div className="relative z-10">

            <div className="hero-status">
              <span className="status-pulse" />
              PLATAFORMA DE CIBERSEGURANÇA
            </div>

            <h1 className="hero-title">
              Aprende a
              <br />

              <span className="hero-outline">
                reconhecer.
              </span>

              <br />

              <span className="hero-dynamic">
                {typedTitle}
                <span className="typing-cursor" />
              </span>
            </h1>

            <p className="hero-description">
              O SICSI ajuda-te a compreender ameaças digitais,
              desenvolver hábitos seguros e transformar conhecimento
              em decisões inteligentes.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">

              <Link
                href="/registo"
                className="hero-primary-button"
              >
                <span>Começar gratuitamente</span>
                <span className="grid size-8 place-items-center rounded-full bg-black/10">
                  <IconArrow />
                </span>
              </Link>

              <a
                href="#metodo"
                className="hero-secondary-button"
              >
                <span className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/[.04]">
                  <IconPlay />
                </span>
                Descobrir o SICSI
              </a>

            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
              {[
                "Aprendizagem gratuita",
                "Conteúdo prático",
                "Ambiente seguro",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.16em] text-white/30"
                >
                  <span className="grid size-4 place-items-center rounded-full bg-cyan-300/10 text-cyan-300">
                    <IconCheck />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* VISUAL */}
          <div className="relative mx-auto w-full max-w-[650px] lg:ml-auto">

            <div className="hero-image-glow" />

            <div className="hero-visual">

              {cyberImages.map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt="Cibersegurança"
                  className={`hero-image ${
                    imageIndex === index ? "hero-image-active" : ""
                  }`}
                />
              ))}

              <div className="hero-image-overlay" />

              {/* HUD */}
              <div className="absolute inset-0 z-20">

                <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[8px] font-semibold uppercase tracking-[.2em] text-white/60 backdrop-blur-xl">
                  <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" />
                  Sistema protegido
                </div>

                <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/30 px-3 py-2 font-mono text-[8px] text-white/40 backdrop-blur-xl">
                  SECURE://SICSI
                </div>

                {/* Scan line */}
                <div className="cyber-scan-line" />

                {/* Radar */}
                <div className="absolute right-7 top-1/3 hidden size-24 rounded-full border border-cyan-300/10 md:block">
                  <div className="absolute inset-[15%] rounded-full border border-cyan-300/10" />
                  <div className="absolute inset-[30%] rounded-full border border-cyan-300/10" />
                  <div className="radar-line" />
                  <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_20px_5px_rgba(34,211,238,.5)]" />
                </div>

                {/* Bottom panel */}
                <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-[#05070a]/75 p-4 backdrop-blur-2xl sm:p-5">

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[8px] font-semibold uppercase tracking-[.22em] text-cyan-300/60">
                        Estado de consciência
                      </div>

                      <div className="mt-1 text-base font-semibold text-white sm:text-lg">
                        Defesa começa pelo conhecimento.
                      </div>
                    </div>

                    <div className="hidden size-11 place-items-center rounded-xl border border-cyan-300/10 bg-cyan-300/[.06] text-cyan-300 sm:grid">
                      <IconShield />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">

                    <div className="hud-stat">
                      <span>RISCO</span>
                      <strong>ANALISADO</strong>
                    </div>

                    <div className="hud-stat">
                      <span>AMEAÇA</span>
                      <strong className="text-emerald-300!">MONITORIZADA</strong>
                    </div>

                    <div className="hud-stat">
                      <span>DEFESA</span>
                      <strong className="text-cyan-300!">ACTIVA</strong>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Floating card */}
            <div className="hero-floating-card hero-floating-left">
              <div className="grid size-9 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300">
                <IconRadar />
              </div>
              <div>
                <div className="text-[8px] uppercase tracking-[.18em] text-white/25">
                  Diagnóstico
                </div>
                <div className="mt-1 text-xs font-semibold text-white">
                  Conhece o teu nível
                </div>
              </div>
            </div>

            <div className="hero-floating-card hero-floating-right">
              <div className="grid size-9 place-items-center rounded-xl bg-violet-300/10 text-violet-300">
                <IconTarget />
              </div>
              <div>
                <div className="text-[8px] uppercase tracking-[.18em] text-white/25">
                  Simulação
                </div>
                <div className="mt-1 text-xs font-semibold text-white">
                  Aprende fazendo
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-white/[.06] bg-white/[.012] px-5 py-7 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1420px] flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-white/30">
            Cibersegurança não é apenas tecnologia.
            <span className="ml-1 text-white/60">
              É comportamento.
            </span>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[8px] font-semibold uppercase tracking-[.2em] text-white/20">
            <span>Consciência</span>
            <span>Prevenção</span>
            <span>Educação</span>
            <span>Resiliência</span>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="relative px-5 py-28 sm:px-8 lg:px-10 lg:py-36">

        <div className="mx-auto max-w-[1420px]">

          <div className="max-w-3xl">
            <div className="section-label">
              <span />
              O problema
            </div>

            <h2 className="section-title">
              A maior vulnerabilidade
              <br />
              <span>continua a ser humana.</span>
            </h2>

            <p className="section-description">
              Ferramentas protegem sistemas. Conhecimento protege pessoas.
              O SICSI foi concebido para aproximar a cibersegurança da vida
              digital quotidiana dos estudantes.
            </p>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-3">

            <Spotlight className="feature-card">
              <span className="feature-number">01</span>
              <div className="feature-icon">
                <IconRadar />
              </div>
              <div className="mt-auto">
                <div className="feature-label">DIAGNÓSTICO</div>
                <h3>Descobre onde estás.</h3>
                <p>
                  Avalia o teu conhecimento e identifica as áreas que precisam
                  de maior atenção.
                </p>
              </div>
            </Spotlight>

            <Spotlight className="feature-card">
              <span className="feature-number">02</span>
              <div className="feature-icon">
                <IconBook />
              </div>
              <div className="mt-auto">
                <div className="feature-label">APRENDIZAGEM</div>
                <h3>Aprende o que importa.</h3>
                <p>
                  Conteúdo claro, estruturado e orientado para situações reais.
                </p>
              </div>
            </Spotlight>

            <Spotlight className="feature-card">
              <span className="feature-number">03</span>
              <div className="feature-icon">
                <IconTarget />
              </div>
              <div className="mt-auto">
                <div className="feature-label">SIMULAÇÃO</div>
                <h3>Pratica antes de arriscar.</h3>
                <p>
                  Aprende a reconhecer ameaças através de experiências
                  interactivas e cenários simulados.
                </p>
              </div>
            </Spotlight>

          </div>
        </div>
      </section>

      {/* MÉTODO */}
      <section id="metodo" className="border-y border-white/[.06] bg-[#07090c] px-5 py-28 sm:px-8 lg:px-10 lg:py-36">

        <div className="mx-auto max-w-[1420px]">

          <div className="grid gap-16 lg:grid-cols-[.75fr_1.25fr]">

            <div>
              <div className="section-label">
                <span />
                Como funciona
              </div>

              <h2 className="section-title">
                Uma jornada.
                <br />
                <span>Quatro movimentos.</span>
              </h2>
            </div>

            <div className="relative">

              <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-cyan-300/40 via-white/10 to-transparent" />

              {[
                ["01", "Avaliar", "Descobre o teu nível através do diagnóstico inicial.", IconRadar],
                ["02", "Aprender", "Constrói conhecimento através dos cursos.", IconBook],
                ["03", "Simular", "Testa as tuas decisões em cenários digitais.", IconTarget],
                ["04", "Evoluir", "Acompanha o progresso e continua a melhorar.", IconShield],
              ].map(([number, title, description, Icon]) => (
                <div key={number as string} className="method-row group">

                  <div className="method-node">
                    <Icon />
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[9px] text-white/20">
                        {number as string}
                      </span>
                      <h3>{title as string}</h3>
                    </div>

                    <p>{description as string}</p>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CYBER EXPERIENCE */}
      <section id="simulacoes" className="px-5 py-28 sm:px-8 lg:px-10 lg:py-36">

        <div className="mx-auto max-w-[1420px]">

          <div className="relative min-h-[600px] overflow-hidden rounded-[32px] border border-white/[.08]">

            <img
              src="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=2000&q=90"
              alt="Segurança digital"
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#05070a] via-[#05070a]/90 to-[#05070a]/30" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_50%,rgba(34,211,238,.13),transparent_32%)]" />

            <div className="relative flex min-h-[600px] items-center p-8 sm:p-12 lg:p-20">

              <div className="max-w-2xl">

                <div className="section-label">
                  <span />
                  Experiência prática
                </div>

                <h2 className="mt-6 text-4xl font-semibold leading-[.95] tracking-[-.05em] sm:text-6xl">
                  Não esperes
                  <br />
                  pelo ataque.
                  <br />
                  <span className="text-cyan-300">
                    Aprende antes dele.
                  </span>
                </h2>

                <p className="mt-7 max-w-xl text-base leading-7 text-white/40">
                  Reconhece phishing, engenharia social, comportamentos
                  inseguros e outras ameaças através de experiências que
                  aproximam a aprendizagem da realidade.
                </p>

                <Link
                  href="/registo"
                  className="premium-button mt-9"
                >
                  Explorar plataforma
                  <IconArrow />
                </Link>

              </div>

              {/* security visualization */}
              <div className="absolute right-[8%] top-1/2 hidden -translate-y-1/2 lg:block">

                <div className="security-core">

                  <div className="security-orbit orbit-one" />
                  <div className="security-orbit orbit-two" />
                  <div className="security-orbit orbit-three" />

                  <div className="security-center">
                    <IconShield className="size-12 text-cyan-300" />
                  </div>

                  <div className="security-node node-one" />
                  <div className="security-node node-two" />
                  <div className="security-node node-three" />

                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CURSOS */}
      <section id="cursos" className="px-5 py-28 sm:px-8 lg:px-10 lg:py-36">

        <div className="mx-auto max-w-[1420px]">

          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">

            <div>
              <div className="section-label">
                <span />
                Aprendizagem
              </div>

              <h2 className="section-title">
                Conhecimento que
                <br />
                <span>fica contigo.</span>
              </h2>
            </div>

            <Link
              href="/registo"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white/40 transition hover:text-cyan-300"
            >
              Ver todos os cursos
              <IconArrow />
            </Link>

          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">

            {[
              {
                title: "Introdução à Cibersegurança",
                level: "BÁSICO",
                image: cyberImages[0],
              },
              {
                title: "Criptologia",
                level: "INTERMÉDIO",
                image: cyberImages[1],
              },
              {
                title: "Phishing e Engenharia Social",
                level: "INTERMÉDIO",
                image: cyberImages[2],
              },
            ].map((course, index) => (
              <Link
                href="/registo"
                key={course.title}
                className="course-card"
              >

                <img
                  src={course.image}
                  alt={course.title}
                  className="course-image"
                />

                <div className="course-overlay" />

                <div className="relative z-10 flex h-full flex-col justify-between p-6">

                  <div className="flex justify-between">
                    <span className="course-level">
                      {course.level}
                    </span>

                    <span className="course-arrow">
                      <IconArrow />
                    </span>
                  </div>

                  <div>
                    <span className="font-mono text-[9px] text-white/25">
                      0{index + 1} / SICSI
                    </span>

                    <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-.03em]">
                      {course.title}
                    </h3>

                    <div className="mt-5 border-t border-white/10 pt-4 text-[9px] uppercase tracking-[.16em] text-white/30">
                      Explorar curso
                    </div>
                  </div>

                </div>
              </Link>
            ))}

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-28 sm:px-8 lg:px-10 lg:py-40">

        <div className="mx-auto max-w-[1420px]">

          <div className="cta-panel">

            <div className="cta-glow" />

            <div className="relative z-10 mx-auto max-w-4xl text-center">

              <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[.06] text-cyan-300">
                <IconShield className="size-7" />
              </div>

              <div className="section-label justify-center mt-7">
                <span />
                SICSI
                <span />
              </div>

              <h2 className="mt-6 text-5xl font-semibold tracking-[-.055em] sm:text-7xl">
                O teu próximo clique
                <br />
                <span className="text-cyan-300">
                  pode ser mais seguro.
                </span>
              </h2>

              <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-white/35">
                Começa gratuitamente e transforma a forma como te relacionas
                com o mundo digital.
              </p>

              <Link
                href="/registo"
                className="hero-primary-button mx-auto mt-9"
              >
                Criar a minha conta
                <span className="grid size-8 place-items-center rounded-full bg-black/10">
                  <IconArrow />
                </span>
              </Link>

            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[.06] px-5 py-10 sm:px-8 lg:px-10">

        <div className="mx-auto flex max-w-[1420px] flex-col gap-8 md:flex-row md:items-end md:justify-between">

          <div>
            <Logo />

            <p className="mt-4 max-w-sm text-[11px] leading-5 text-white/25">
              Sistema de Consciencialização em Segurança da Informação.
            </p>
          </div>

          <div className="flex flex-wrap gap-7 text-[9px] uppercase tracking-[.17em] text-white/25">
            <Link href="/login">Entrar</Link>
            <Link href="/registo">Registar</Link>
            <a href="#sobre">Sobre</a>
            <a href="#cursos">Cursos</a>
          </div>

          <div className="text-[9px] uppercase tracking-[.15em] text-white/15">
            © {new Date().getFullYear()} SICSI
          </div>

        </div>
      </footer>

    </main>
  );
}