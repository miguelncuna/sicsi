
export type EstadoProgresso =
  | "NAO_INICIADO"
  | "EM_PROGRESSO"
  | "CONCLUIDO";

export interface ConteudoParaProgresso {
  id: number;
  modulo_id: number;
  titulo?: string;
  ordem?: number;
}

export interface ModuloParaProgresso {
  id: number;
  curso_id: number;
  titulo?: string;
  ordem?: number;
  conteudos: ConteudoParaProgresso[];
}

export interface ProgressoConteudo {
  conteudo_id: number;
  concluido: boolean;
}

export interface ResultadoProgresso {
  totalConteudos: number;
  conteudosConcluidos: number;
  percentagem: number;
  estado: EstadoProgresso;
}

export interface ResultadoProgressoModulo
  extends ResultadoProgresso {
  moduloId: number;
  titulo: string;
  ordem: number;
}

export interface ResultadoProgressoCurso
  extends ResultadoProgresso {
  cursoId: number;
  modulos: ResultadoProgressoModulo[];
}

/* ============================================================
 * CALCULAR PERCENTAGEM
 * ============================================================
 */

export function calcularPercentagem(
  concluidos: number,
  total: number
): number {
  if (total <= 0) {
    return 0;
  }

  const percentagem = Math.round(
    (concluidos / total) * 100
  );

  return Math.min(
    100,
    Math.max(0, percentagem)
  );
}

/* ============================================================
 * DETERMINAR ESTADO
 * ============================================================
 */

export function determinarEstadoProgresso(
  totalConteudos: number,
  conteudosConcluidos: number
): EstadoProgresso {
  /*
   * Não existe conteúdo.
   *
   * Mantemos como não iniciado porque não há
   * actividade suficiente para considerar o curso
   * concluído.
   */
  if (totalConteudos <= 0) {
    return "NAO_INICIADO";
  }

  /*
   * Nenhum conteúdo concluído.
   */
  if (conteudosConcluidos <= 0) {
    return "NAO_INICIADO";
  }

  /*
   * Todos os conteúdos concluídos.
   */
  if (
    conteudosConcluidos >=
    totalConteudos
  ) {
    return "CONCLUIDO";
  }

  /*
   * Existe pelo menos um conteúdo concluído,
   * mas ainda faltam conteúdos.
   */
  return "EM_PROGRESSO";
}

/* ============================================================
 * CALCULAR PROGRESSO GENÉRICO
 * ============================================================
 */

export function calcularProgresso(
  totalConteudos: number,
  conteudosConcluidos: number
): ResultadoProgresso {
  const totalNormalizado = Math.max(
    0,
    totalConteudos
  );

  const concluidosNormalizados = Math.min(
    totalNormalizado,
    Math.max(0, conteudosConcluidos)
  );

  const percentagem =
    calcularPercentagem(
      concluidosNormalizados,
      totalNormalizado
    );

  const estado =
    determinarEstadoProgresso(
      totalNormalizado,
      concluidosNormalizados
    );

  return {
    totalConteudos: totalNormalizado,
    conteudosConcluidos:
      concluidosNormalizados,
    percentagem,
    estado,
  };
}

/* ============================================================
 * CALCULAR PROGRESSO DE UM MÓDULO
 * ============================================================
 */

export function calcularProgressoModulo(
  modulo: ModuloParaProgresso,
  progresso: ProgressoConteudo[]
): ResultadoProgressoModulo {
  const conteudos =
    modulo.conteudos ?? [];

  const conjuntoConcluidos =
    new Set(
      progresso
        .filter(
          (item) =>
            item.concluido === true
        )
        .map(
          (item) =>
            Number(item.conteudo_id)
        )
    );

  const conteudosConcluidos =
    conteudos.filter((conteudo) =>
      conjuntoConcluidos.has(
        Number(conteudo.id)
      )
    ).length;

  const resultado =
    calcularProgresso(
      conteudos.length,
      conteudosConcluidos
    );

  return {
    moduloId: modulo.id,
    titulo: modulo.titulo ?? "",
    ordem: modulo.ordem ?? 0,
    ...resultado,
  };
}

/* ============================================================
 * CALCULAR PROGRESSO DE UM CURSO
 * ============================================================
 */

export function calcularProgressoCurso(
  cursoId: number,
  modulos: ModuloParaProgresso[],
  progresso: ProgressoConteudo[]
): ResultadoProgressoCurso {
  const modulosNormalizados =
    modulos ?? [];

  const resultadosModulos =
    modulosNormalizados.map(
      (modulo) =>
        calcularProgressoModulo(
          modulo,
          progresso
        )
    );

  const totalConteudos =
    resultadosModulos.reduce(
      (total, modulo) =>
        total + modulo.totalConteudos,
      0
    );

  const conteudosConcluidos =
    resultadosModulos.reduce(
      (total, modulo) =>
        total +
        modulo.conteudosConcluidos,
      0
    );

  const resultado =
    calcularProgresso(
      totalConteudos,
      conteudosConcluidos
    );

  return {
    cursoId,
    ...resultado,
    modulos: resultadosModulos,
  };
}

/* ============================================================
 * UTILITÁRIOS DE ESTADO
 * ============================================================
 */

export function estadoProgressoParaTexto(
  estado: EstadoProgresso
): string {
  switch (estado) {
    case "CONCLUIDO":
      return "Concluído";

    case "EM_PROGRESSO":
      return "Em progresso";

    case "NAO_INICIADO":
    default:
      return "Não iniciado";
  }
}

/* ============================================================
 * UTILITÁRIOS DE ESTILO
 * ============================================================
 */

export function estadoProgressoParaClasses(
  estado: EstadoProgresso
): string {
  switch (estado) {
    case "CONCLUIDO":
      return "bg-emerald-100 text-emerald-700";

    case "EM_PROGRESSO":
      return "bg-blue-100 text-blue-700";

    case "NAO_INICIADO":
    default:
      return "bg-slate-100 text-slate-600";
  }
}