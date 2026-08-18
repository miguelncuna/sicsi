import { ReactNode } from "react";

interface StatCardProps {
  titulo: string;
  valor: number | string;
  icone: ReactNode;
  corIcone?: string;
  corFundoIcone?: string;
  descricao?: string;
}

export default function StatCard({
  titulo,
  valor,
  icone,
  corIcone = "text-blue-900",
  corFundoIcone = "bg-blue-100",
  descricao,
}: StatCardProps) {
  return (
    <div className="flex items-start justify-between rounded-2xl bg-white p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
          {titulo}
        </p>

        <h2 className="mt-3 text-4xl font-bold text-gray-900">
          {valor}
        </h2>

        {descricao && (
          <p className="mt-2 text-sm text-gray-500">
            {descricao}
          </p>
        )}
      </div>

      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${corFundoIcone}`}
      >
        <div className={`text-3xl ${corIcone}`}>
          {icone}
        </div>
      </div>
    </div>
  );
}