interface Coluna {
  chave: string;
  titulo: string;
}

interface DataTableProps {
  titulo: string;
  colunas: Coluna[];
  dados: Record<string, any>[];
  botao?: React.ReactNode;
}

export default function DataTable({
  titulo,
  colunas,
  dados,
  botao,
}: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

      {/* Cabeçalho */}

      <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {titulo}
          </h2>

          <p className="mt-1 text-gray-500">
            Gestão de informações do SICSI.
          </p>
        </div>

        {botao}
      </div>

      {/* Tabela */}

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-100">

            <tr>

              {colunas.map((coluna) => (
                <th
                  key={coluna.chave}
                  className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-gray-700"
                >
                  {coluna.titulo}
                </th>
              ))}

            </tr>

          </thead>

          <tbody>

            {dados.length === 0 ? (

              <tr>

                <td
                  colSpan={colunas.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Nenhum registo encontrado.
                </td>

              </tr>

            ) : (

              dados.map((linha, indice) => (

                <tr
                  key={indice}
                  className="border-t transition hover:bg-blue-50"
                >

                  {colunas.map((coluna) => (

                    <td
                      key={coluna.chave}
                      className="px-6 py-4 text-gray-800"
                    >
                      {linha[coluna.chave]}
                    </td>

                  ))}

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>
    </div>
  );
}