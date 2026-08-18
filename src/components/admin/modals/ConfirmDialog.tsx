"use client";

import { ReactNode } from "react";
import {
  FaExclamationTriangle,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  icone?: ReactNode;
  carregando?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

export default function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  icone,
  carregando = false,
  aoConfirmar,
  aoCancelar,
}: ConfirmDialogProps) {
  if (!aberto) {
    return null;
  }

  return (
    <>
      {/* Fundo */}
      <div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
        onClick={carregando ? undefined : aoCancelar}
      />

      {/* Contentor */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className="
            w-full
            max-w-md
            overflow-hidden
            rounded-3xl
            bg-white
            shadow-2xl
          "
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                {icone ?? <FaExclamationTriangle />}
              </div>

              <h2
                id="confirm-dialog-title"
                className="text-xl font-bold text-gray-900"
              >
                {titulo}
              </h2>
            </div>

            <button
              type="button"
              onClick={aoCancelar}
              disabled={carregando}
              aria-label="Fechar"
              className="
                rounded-xl
                p-2
                text-gray-500
                transition
                hover:bg-gray-100
                hover:text-gray-900
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <FaTimes />
            </button>
          </div>

          {/* Mensagem */}
          <div className="px-6 py-6">
            <p className="text-base leading-7 text-gray-600">
              {mensagem}
            </p>
          </div>

          {/* Ações */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={aoCancelar}
              disabled={carregando}
              className="
                w-full
                rounded-xl
                border
                border-gray-300
                bg-white
                px-5
                py-3
                font-semibold
                text-gray-700
                transition
                hover:bg-gray-100
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:w-auto
              "
            >
              {textoCancelar}
            </button>

            <button
              type="button"
              onClick={aoConfirmar}
              disabled={carregando}
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-red-600
                px-5
                py-3
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-red-700
                hover:shadow-md
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:w-auto
              "
            >
              {carregando ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  A processar...
                </>
              ) : (
                <>
                  <FaTrash />
                  {textoConfirmar}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}