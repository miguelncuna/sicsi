"use client";

import {
  FaEdit,
  FaPowerOff,
  FaTrash,
} from "react-icons/fa";

import NivelBadge from "@/components/admin/cursos/NivelBadge";

interface Curso {
  id: number;
  titulo: string;
  descricao: string;
  nivel: string;
  ativo: boolean;
  criado_em: string;
}

interface CursoRowProps {
  curso: Curso;
  aoEditar: (curso: Curso) => void;
  aoEliminar: (curso: Curso) => void;
  aoAlterarEstado: (curso: Curso) => void;
}

export default function CursoRow({
  curso,
  aoEditar,
  aoEliminar,
  aoAlterarEstado,
}: CursoRowProps) {
  const dataFormatada = new Date(
    curso.criado_em
  ).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <tr className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      <td className="px-6 py-4">
        <div>
          <p className="font-semibold text-gray-900">
            {curso.titulo}
          </p>

          <p className="mt-1 max-w-md truncate text-sm text-gray-500">
            {curso.descricao}
          </p>
        </div>
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <NivelBadge nivel={curso.nivel} />
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        {curso.ativo ? (
          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
            Activo
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
            Inactivo
          </span>
        )}
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
        {dataFormatada}
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => aoEditar(curso)}
            title="Editar curso"
            className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-100"
          >
            <FaEdit />
          </button>

          <button
            type="button"
            onClick={() => aoAlterarEstado(curso)}
            title={
              curso.ativo
                ? "Desactivar curso"
                : "Activar curso"
            }
            className={`rounded-lg p-2 transition ${
              curso.ativo
                ? "text-amber-600 hover:bg-amber-100"
                : "text-green-600 hover:bg-green-100"
            }`}
          >
            <FaPowerOff />
          </button>

          <button
            type="button"
            onClick={() => aoEliminar(curso)}
            title="Eliminar curso"
            className="rounded-lg p-2 text-red-600 transition hover:bg-red-100"
          >
            <FaTrash />
          </button>
        </div>
      </td>
    </tr>
  );
}