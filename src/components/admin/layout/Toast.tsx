"use client";

import { ReactNode } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";

interface ToastProps {
  aberto: boolean;
  mensagem: string;
  tipo?: "sucesso" | "erro" | "aviso" | "info";
  aoFechar: () => void;
  icone?: ReactNode;
}

export default function Toast({
  aberto,
  mensagem,
  tipo = "sucesso",
  aoFechar,
  icone,
}: ToastProps) {
  if (!aberto) {
    return null;
  }

  const estilos = {
    sucesso: {
      fundo: "bg-green-50",
      borda: "border-green-200",
      icone: "text-green-600",
      texto: "text-green-900",
      iconePadrao: <FaCheckCircle />,
    },

    erro: {
      fundo: "bg-red-50",
      borda: "border-red-200",
      icone: "text-red-600",
      texto: "text-red-900",
      iconePadrao: <FaExclamationCircle />,
    },

    aviso: {
      fundo: "bg-yellow-50",
      borda: "border-yellow-200",
      icone: "text-yellow-600",
      texto: "text-yellow-900",
      iconePadrao: <FaExclamationTriangle />,
    },

    info: {
      fundo: "bg-blue-50",
      borda: "border-blue-200",
      icone: "text-blue-600",
      texto: "text-blue-900",
      iconePadrao: <FaInfoCircle />,
    },
  };

  const estilo = estilos[tipo];

  return (
    <div
      className="
        fixed
        right-4
        top-4
        z-[100]
        w-[calc(100%-2rem)]
        max-w-md
        animate-in
        slide-in-from-right-5
        fade-in
        duration-300
        sm:right-6
        sm:top-6
      "
      role="alert"
      aria-live="polite"
    >
      <div
        className={`
          flex
          items-start
          gap-4
          rounded-2xl
          border
          p-4
          shadow-xl
          backdrop-blur-sm
          ${estilo.fundo}
          ${estilo.borda}
        `}
      >
        {/* Ícone */}

        <div
          className={`
            mt-0.5
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-white
            text-lg
            shadow-sm
            ${estilo.icone}
          `}
        >
          {icone ?? estilo.iconePadrao}
        </div>

        {/* Mensagem */}

        <div className="min-w-0 flex-1">
          <p
            className={`
              break-words
              text-sm
              font-semibold
              leading-6
              ${estilo.texto}
            `}
          >
            {mensagem}
          </p>
        </div>

        {/* Fechar */}

        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar notificação"
          className="
            shrink-0
            rounded-lg
            p-1.5
            text-gray-500
            transition
            hover:bg-black/5
            hover:text-gray-900
          "
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
}