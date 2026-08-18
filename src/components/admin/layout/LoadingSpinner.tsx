"use client";

interface LoadingSpinnerProps {
  tamanho?: "pequeno" | "medio" | "grande";
  mensagem?: string;
}

export default function LoadingSpinner({
  tamanho = "medio",
  mensagem,
}: LoadingSpinnerProps) {
  const tamanhos = {
    pequeno: "h-4 w-4 border-2",
    medio: "h-8 w-8 border-4",
    grande: "h-12 w-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <span
        role="status"
        aria-label="A carregar"
        className={`
          ${tamanhos[tamanho]}
          animate-spin
          rounded-full
          border-blue-200
          border-t-blue-900
        `}
      />

      {mensagem && (
        <p className="text-sm font-medium text-gray-600">
          {mensagem}
        </p>
      )}
    </div>
  );
}