interface NivelBadgeProps {
  nivel: string;
}

export default function NivelBadge({
  nivel,
}: NivelBadgeProps) {
  const cores = {
    Básico: {
      fundo: "bg-green-100",
      texto: "text-green-700",
    },

    Intermédio: {
      fundo: "bg-yellow-100",
      texto: "text-yellow-700",
    },

    Avançado: {
      fundo: "bg-red-100",
      texto: "text-red-700",
    },
  };

  const estilo =
    cores[nivel as keyof typeof cores] ?? {
      fundo: "bg-gray-100",
      texto: "text-gray-700",
    };

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-3
        py-1
        text-sm
        font-semibold
        ${estilo.fundo}
        ${estilo.texto}
      `}
    >
      {nivel}
    </span>
  );
}