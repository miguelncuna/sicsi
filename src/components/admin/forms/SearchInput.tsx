"use client";

import { ChangeEvent } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

interface SearchInputProps {
  valor: string;
  aoAlterar: (valor: string) => void;
  placeholder?: string;
  desativado?: boolean;
}

export default function SearchInput({
  valor,
  aoAlterar,
  placeholder = "Pesquisar...",
  desativado = false,
}: SearchInputProps) {
  function alterar(e: ChangeEvent<HTMLInputElement>) {
    aoAlterar(e.target.value);
  }

  function limpar() {
    aoAlterar("");
  }

  return (
    <div className="relative w-full">
      {/* Ícone de pesquisa */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <FaSearch className="text-gray-400" />
      </div>

      {/* Campo de pesquisa */}
      <input
        type="search"
        value={valor}
        onChange={alterar}
        placeholder={placeholder}
        disabled={desativado}
        aria-label={placeholder}
        className="
          w-full
          appearance-none
          rounded-xl
          border
          border-gray-300
          bg-white
          py-3
          pl-11
          pr-11
          text-gray-900
          placeholder:text-gray-400
          shadow-sm
          outline-none
          transition-all
          duration-200
          focus:border-blue-700
          focus:ring-2
          focus:ring-blue-200
          disabled:cursor-not-allowed
          disabled:bg-gray-100
          disabled:text-gray-500
          [&::-webkit-search-cancel-button]:appearance-none
          [&::-webkit-search-decoration]:appearance-none
          [&::-webkit-search-results-button]:appearance-none
          [&::-webkit-search-results-decoration]:appearance-none
        "
      />

      {/* Botão limpar */}
      {valor && !desativado && (
        <button
          type="button"
          onClick={limpar}
          aria-label="Limpar pesquisa"
          className="
            absolute
            inset-y-0
            right-0
            flex
            items-center
            pr-4
            text-gray-400
            transition
            hover:text-gray-700
          "
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
}
