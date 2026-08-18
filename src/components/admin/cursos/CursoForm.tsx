"use client";

import React from "react";
import PrimaryButton from "@/components/admin/buttons/PrimaryButton";

interface CursoFormProps {
  tituloInicial?: string;
  descricaoInicial?: string;
  nivelInicial?: string;
  ativoInicial?: boolean;
  textoBotao?: string;
  aoGuardar: (curso: {
    titulo: string;
    descricao: string;
    nivel: string;
    ativo: boolean;
  }) => void;
}

export default function CursoForm({
  tituloInicial = "",
  descricaoInicial = "",
  nivelInicial = "Básico",
  ativoInicial = true,
  textoBotao = "Guardar Curso",
  aoGuardar,
}: CursoFormProps) {
  const [titulo, setTitulo] = React.useState(tituloInicial);
  const [descricao, setDescricao] = React.useState(descricaoInicial);
  const [nivel, setNivel] = React.useState(nivelInicial);
  const [ativo, setAtivo] = React.useState(ativoInicial);

  function submeter(e: React.FormEvent) {
    e.preventDefault();

    if (!titulo.trim()) {
      alert("Introduza o título do curso.");
      return;
    }

    if (!descricao.trim()) {
      alert("Introduza a descrição do curso.");
      return;
    }

    aoGuardar({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      nivel,
      ativo,
    });
  }

  return (
    <form onSubmit={submeter} className="space-y-6">
      <div>
        <label
          htmlFor="titulo"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Título do curso
        </label>

        <input
          id="titulo"
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex.: Introdução à Cibersegurança"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div>
        <label
          htmlFor="descricao"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Descrição
        </label>

        <textarea
          id="descricao"
          rows={5}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva o conteúdo e os objetivos deste curso..."
          className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div>
        <label
          htmlFor="nivel"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Nível do curso
        </label>

        <select
          id="nivel"
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
        >
          <option value="Básico">Básico</option>
          <option value="Intermédio">Intermédio</option>
          <option value="Avançado">Avançado</option>
        </select>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <input
            id="ativo"
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-gray-300"
          />

          <div>
            <label
              htmlFor="ativo"
              className="font-semibold text-gray-900"
            >
              Curso activo
            </label>

            <p className="mt-1 text-sm text-gray-600">
              Cursos activos poderão ser disponibilizados aos estudantes.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <PrimaryButton type="submit">
          {textoBotao}
        </PrimaryButton>
      </div>
    </form>
  );
}