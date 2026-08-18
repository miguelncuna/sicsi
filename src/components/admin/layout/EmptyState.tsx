"use client";

import { ReactNode } from "react";
import { FaInbox } from "react-icons/fa";

interface EmptyStateProps {
  titulo: string;
  mensagem?: string;
  icone?: ReactNode;
  acao?: ReactNode;
}

export default function EmptyState({
  titulo,
  mensagem = "Ainda não existem registos disponíveis.",
  icone,
  acao,
}: EmptyStateProps) {
  return (
    <div
      className="
        flex
        min-h-[280px]
        w-full
        flex-col
        items-center
        justify-center
        rounded-3xl
        border
        border-gray-200
        bg-white
        px-6
        py-12
        text-center
        shadow-sm
      "
    >
      {/* Ícone */}

      <div
        className="
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-2xl
          bg-blue-100
          text-2xl
          text-blue-900
        "
      >
        {icone ?? <FaInbox />}
      </div>

      {/* Título */}

      <h3 className="mt-5 text-xl font-bold text-gray-900">
        {titulo}
      </h3>

      {/* Mensagem */}

      <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
        {mensagem}
      </p>

      {/* Ação opcional */}

      {acao && (
        <div className="mt-6">
          {acao}
        </div>
      )}
    </div>
  );
}