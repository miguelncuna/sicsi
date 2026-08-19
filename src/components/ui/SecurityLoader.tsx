"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

interface SecurityLoaderProps {
  /**
   * Mantido por compatibilidade com o layout actual.
   * false desactiva completamente o loader.
   * true/undefined activa o comportamento automático.
   */
  visible?: boolean;
  label?: string;
}

const TEMPO_MINIMO_VISIVEL = 650;
const TEMPO_INICIAL = 900;
const LIMITE_SEGURANCA = 8000;
const TEMPO_LINK_EXTERNO = 1200;

export default function SecurityLoader({
  visible = true,
  label = "A proteger a sua ligação",
}: SecurityLoaderProps) {
  const pathname = usePathname();

  const [ativo, setAtivo] = useState(Boolean(visible));

  const primeiraRota = useRef(true);
  const momentoExibicao = useRef<number>(Date.now());

  const esconderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const limiteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limparTimers = () => {
    if (esconderTimer.current) {
      clearTimeout(esconderTimer.current);
      esconderTimer.current = null;
    }

    if (limiteTimer.current) {
      clearTimeout(limiteTimer.current);
      limiteTimer.current = null;
    }
  };

  const esconder = (atraso = 0) => {
    if (esconderTimer.current) {
      clearTimeout(esconderTimer.current);
      esconderTimer.current = null;
    }

    esconderTimer.current = setTimeout(() => {
      setAtivo(false);
      esconderTimer.current = null;
    }, Math.max(0, atraso));
  };

  const mostrar = (tempoMaximo = LIMITE_SEGURANCA) => {
    if (!visible) {
      return;
    }

    limparTimers();

    momentoExibicao.current = Date.now();

    setAtivo(true);

    limiteTimer.current = setTimeout(() => {
      setAtivo(false);
      limiteTimer.current = null;
    }, tempoMaximo);
  };

  const esconderRespeitandoTempoMinimo = () => {
    const decorrido =
      Date.now() - momentoExibicao.current;

    const restante = Math.max(
      0,
      TEMPO_MINIMO_VISIVEL - decorrido
    );

    esconder(restante);
  };

  /*
   * ============================================================
   * PRIMEIRA ABERTURA
   * ============================================================
   *
   * O loader aparece durante a inicialização.
   * Nunca permanece permanentemente no ecrã.
   */
  useEffect(() => {
    if (!visible) {
      limparTimers();
      setAtivo(false);
      return;
    }

    mostrar(TEMPO_INICIAL + 1000);

    esconder(TEMPO_INICIAL);

    return limparTimers;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /*
   * ============================================================
   * NAVEGAÇÃO DO NEXT.JS
   * ============================================================
   *
   * Sempre que a rota muda:
   *
   * 1. mostra o loader;
   * 2. aguarda a nova página;
   * 3. desaparece suavemente;
   * 4. possui limite máximo de segurança.
   */
  useEffect(() => {
    if (!visible) {
      return;
    }

    if (primeiraRota.current) {
      primeiraRota.current = false;
      return;
    }

    mostrar(LIMITE_SEGURANCA);

    esconderRespeitandoTempoMinimo();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, visible]);

  /*
   * ============================================================
   * CLIQUES DE NAVEGAÇÃO
   * ============================================================
   *
   * Detecta:
   *
   * - <Link>
   * - <a>
   * - formulários
   * - botões submit
   * - botões explicitamente marcados
   *
   * Não interfere com:
   *
   * - menus
   * - dropdowns
   * - modais
   * - tabs
   * - botões puramente visuais
   */
  useEffect(() => {
    if (!visible) {
      return;
    }

    const tratarClique = (evento: MouseEvent) => {
      if (evento.defaultPrevented) {
        return;
      }

      if (evento.button !== 0) {
        return;
      }

      if (
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey ||
        evento.altKey
      ) {
        return;
      }

      const alvo =
        evento.target as HTMLElement | null;

      const elemento = alvo?.closest(
        "a, button"
      ) as
        | HTMLAnchorElement
        | HTMLButtonElement
        | null;

      if (!elemento) {
        return;
      }

      /*
       * ========================================================
       * LINKS
       * ========================================================
       */
      if (elemento instanceof HTMLAnchorElement) {
        if (elemento.hasAttribute("download")) {
          return;
        }

        if (elemento.target === "_blank") {
          return;
        }

        const href =
          elemento.getAttribute("href");

        if (!href) {
          return;
        }

        /*
         * Âncoras internas não precisam de loader de página.
         */
        if (href.startsWith("#")) {
          return;
        }

        /*
         * Protocolos que não representam navegação
         * normal da aplicação.
         */
        if (
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          href.startsWith("javascript:")
        ) {
          return;
        }

        const url = new URL(
          href,
          window.location.href
        );

        const mesmaOrigem =
          url.origin === window.location.origin;

        mostrar(
          mesmaOrigem
            ? LIMITE_SEGURANCA
            : TEMPO_LINK_EXTERNO
        );

        return;
      }

      /*
       * ========================================================
       * BOTÕES
       * ========================================================
       */

      const tipo =
        elemento
          .getAttribute("type")
          ?.toLowerCase();

      const explicitamenteAtivo =
        elemento.getAttribute(
          "data-sicsi-loading"
        ) === "true";

      if (
        tipo === "submit" ||
        explicitamenteAtivo
      ) {
        mostrar(LIMITE_SEGURANCA);
      }
    };

    /*
     * Qualquer formulário submetido activa o processamento.
     */
    const tratarSubmit = () => {
      mostrar(LIMITE_SEGURANCA);
    };

    document.addEventListener(
      "click",
      tratarClique,
      true
    );

    document.addEventListener(
      "submit",
      tratarSubmit,
      true
    );

    return () => {
      document.removeEventListener(
        "click",
        tratarClique,
        true
      );

      document.removeEventListener(
        "submit",
        tratarSubmit,
        true
      );
    };
  }, [visible]);

  /*
   * ============================================================
   * NAVEGAÇÃO COMPLETA / RELOAD
   * ============================================================
   */
  useEffect(() => {
    if (!visible) {
      return;
    }

    const tratarAntesDeSair = () => {
      mostrar(LIMITE_SEGURANCA);
    };

    window.addEventListener(
      "beforeunload",
      tratarAntesDeSair
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        tratarAntesDeSair
      );
    };
  }, [visible]);

  /*
   * ============================================================
   * LIMPEZA FINAL
   * ============================================================
   */
  useEffect(() => {
    return () => {
      limparTimers();
    };
  }, []);

  /*
   * Nunca renderizar quando estiver desligado.
   */
  if (!visible || !ativo) {
    return null;
  }

  return (
    <div
      className="security-loader"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="security-loader-background"
        aria-hidden="true"
      />

      <div className="security-loader-content">
        <div
          className="security-loader-logo"
          aria-hidden="true"
        >
          <div className="security-loader-orbit security-loader-orbit-one" />

          <div className="security-loader-orbit security-loader-orbit-two" />

          <div className="security-loader-orbit security-loader-orbit-three" />

          <div className="security-loader-scan" />

          <svg
            viewBox="0 0 48 48"
            className="size-10 text-cyan-300"
            fill="none"
          >
            <path
              d="M24 4.5 40 10v11.2c0 10.3-6.4 17.4-16 22.3-9.6-4.9-16-12-16-22.3V10l16-5.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            <path
              d="m15.5 24 5.3 5.3L33 17"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="security-loader-brand">
          SICSI
        </div>

        <div className="security-loader-status">
          <span aria-hidden="true" />

          <span className="sr-only">
            Estado:
          </span>

          {label}
        </div>

        <div
          className="security-loader-progress"
          aria-hidden="true"
        >
          <div />
        </div>
      </div>
    </div>
  );
}