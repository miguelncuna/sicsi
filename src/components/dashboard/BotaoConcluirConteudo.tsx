"use client";

import { useState } from "react";
import {
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";

import { marcarConteudoComoConcluido } from "@/app/dashboard/cursos/[id]/conteudo/[conteudoId]/acoes";

type BotaoConcluirConteudoProps = {
  conteudoId: number;
  cursoId: number;
  inicialmenteConcluido: boolean;
};

export default function BotaoConcluirConteudo({
  conteudoId,
  cursoId,
  inicialmenteConcluido,
}: BotaoConcluirConteudoProps) {
  const [concluido, setConcluido] = useState(
    inicialmenteConcluido
  );

  const [aGuardar, setAGuardar] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  async function concluirConteudo() {
    if (concluido || aGuardar) {
      return;
    }

    setAGuardar(true);
    setMensagem("");

    try {
      const resultado =
        await marcarConteudoComoConcluido(
          conteudoId,
          cursoId
        );

      if (!resultado.sucesso) {
        setMensagem(resultado.mensagem);
        return;
      }

      setConcluido(true);
      setMensagem(resultado.mensagem);
    } catch (erro) {
      console.error(
        "Erro ao marcar conteúdo como concluído:",
        erro
      );

      setMensagem(
        "Ocorreu um erro ao registar o progresso."
      );
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={concluirConteudo}
        disabled={concluido || aGuardar}
        className={`
          inline-flex
          min-h-[48px]
          items-center
          justify-center
          gap-2
          rounded-xl
          px-5
          py-3
          text-sm
          font-bold
          shadow-sm
          transition-all
          duration-200

          ${
            concluido
              ? "cursor-default bg-emerald-100 text-emerald-700"
              : "bg-blue-800 text-white hover:bg-blue-900 hover:shadow-md"
          }

          ${
            aGuardar
              ? "cursor-wait opacity-80"
              : ""
          }
        `}
      >
        {aGuardar ? (
          <>
            <FaSpinner className="animate-spin" />
            A guardar...
          </>
        ) : concluido ? (
          <>
            <FaCheckCircle />
            Conteúdo concluído
          </>
        ) : (
          <>
            <FaCheckCircle />
            Marcar como concluído
          </>
        )}
      </button>

      {mensagem && (
        <p
          className={`
            text-xs
            font-medium
            ${
              concluido
                ? "text-emerald-700"
                : "text-red-600"
            }
          `}
        >
          {mensagem}
        </p>
      )}
    </div>
  );
}