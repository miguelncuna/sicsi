"use client";

import CursoRow from "@/components/admin/cursos/CursoRow";
import EmptyState from "@/components/admin/layout/EmptyState";

interface Curso {
  id: number;
  titulo: string;
  descricao: string;
  nivel: string;
  ativo: boolean;
  criado_em: string;
}

interface CursoTableProps {
  cursos: Curso[];
  aoEditar: (curso: Curso) => void;
  aoEliminar: (curso: Curso) => void;
  aoAlterarEstado: (curso: Curso) => void;
}

export default function CursoTable({
  cursos,
  aoEditar,
  aoEliminar,
  aoAlterarEstado,
}: CursoTableProps) {
  if (cursos.length === 0) {
    return (
      <EmptyState
        titulo="Nenhum curso encontrado"
        mensagem="Ainda não existem cursos registados no SICSI ou nenhum curso corresponde à pesquisa."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                Curso
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                Nível
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                Estado
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                Criado em
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {cursos.map((curso) => (
              <CursoRow
                key={curso.id}
                curso={curso}
                aoEditar={aoEditar}
                aoEliminar={aoEliminar}
                aoAlterarEstado={aoAlterarEstado}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}