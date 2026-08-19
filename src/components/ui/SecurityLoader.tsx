"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function SecurityLoader() {
  const pathname = usePathname();

  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setVisible(true);
    setLeaving(false);

    const exitTimer = window.setTimeout(() => {
      setLeaving(true);

      const hideTimer = window.setTimeout(() => {
        setVisible(false);
      }, 450);

      return () => window.clearTimeout(hideTimer);
    }, 900);

    return () => window.clearTimeout(exitTimer);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;

      if (!target) return;

      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");

      if (!href) return;

      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      if (link.target === "_blank") return;

      if (link.hasAttribute("download")) return;

      const destination = new URL(
        href,
        window.location.href,
      );

      const current = new URL(window.location.href);

      if (
        destination.origin === current.origin &&
        destination.pathname === current.pathname &&
        destination.search === current.search
      ) {
        return;
      }

      setVisible(true);
      setLeaving(false);
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`security-loader ${
        leaving ? "security-loader-leaving" : ""
      }`}
      aria-live="polite"
      aria-label="A carregar o SICSI"
    >
      <div className="security-loader-background" />

      <div className="security-loader-content">

        <div className="security-loader-logo">

          <div className="security-loader-orbit security-loader-orbit-one" />

          <div className="security-loader-orbit security-loader-orbit-two" />

          <div className="security-loader-orbit security-loader-orbit-three" />

          <div className="security-loader-scan" />

          <svg
            viewBox="0 0 48 48"
            className="relative z-20 size-11 text-cyan-300"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M24 4 41 10v11.2C41 32.2 34.2 39.7 24 44 13.8 39.7 7 32.2 7 21.2V10l17-6Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />

            <path
              d="m15.5 24 5.2 5.2L33 17"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

        </div>

        <div className="security-loader-brand">
          SICSI
        </div>

        <div className="security-loader-status">
          <span />
          A proteger a tua experiência
        </div>

        <div className="security-loader-progress">
          <div />
        </div>

        <div className="security-loader-code">
          SECURE://SICSI
        </div>

      </div>
    </div>
  );
}