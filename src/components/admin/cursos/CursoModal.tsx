"use client";

import {
  ReactNode,
  MouseEvent,
  useEffect,
} from "react";

import { FaTimes } from "react-icons/fa";

interface CursoModalProps {
  aberto: boolean;
  titulo: string;
  children: ReactNode;
  aoFechar: () => void;
}

export default function CursoModal({
  aberto,
  titulo,
  children,
  aoFechar,
}: CursoModalProps) {
  useEffect(() => {
    if (!aberto) {
      return;
    }

    function tratarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        aoFechar();
      }
    }

    document.addEventListener("keydown", tratarTecla);

    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", tratarTecla);
      document.body.style.overflow = overflowOriginal;
    };
  }, [aberto, aoFechar]);

  if (!aberto) {
    return null;
  }

  function tratarCliqueFundo(
    evento: MouseEvent<HTMLDivElement>
  ) {
    if (evento.target === evento.currentTarget) {
      aoFechar();
    }
  }

  return (
    <>
      {/* Fundo escuro */}

      <div
        className="
          fixed
          inset-0
          z-[70]
          bg-black/60
          backdrop-blur-sm
        "
        onClick={aoFechar}
        aria-hidden="true"
      />

      {/* Área do modal */}

      <div
        className="
          fixed
          inset-0
          z-[80]
          flex
          items-center
          justify-center
          p-3
          sm:p-4
        "
        onClick={tratarCliqueFundo}
      >
        {/* Modal */}

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="curso-modal-titulo"
          className="
            flex
            max-h-[92vh]
            w-full
            max-w-2xl
            flex-col
            overflow-hidden
            rounded-2xl
            bg-white
            shadow-2xl
            sm:rounded-3xl
          "
        >
          {/* Cabeçalho */}

          <div
            className="
              flex
              shrink-0
              items-center
              justify-between
              gap-4
              border-b
              border-gray-200
              bg-white
              px-5
              py-4
              sm:px-8
              sm:py-6
            "
          >
            <h2
              id="curso-modal-titulo"
              className="
                text-xl
                font-bold
                text-gray-900
                sm:text-2xl
              "
            >
              {titulo}
            </h2>

            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar janela"
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                text-gray-500
                transition
                hover:bg-gray-100
                hover:text-red-600
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Conteúdo */}

          <div
            className="
              min-h-0
              flex-1
              overflow-y-auto
              px-5
              py-5
              sm:px-8
              sm:py-8
            "
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}