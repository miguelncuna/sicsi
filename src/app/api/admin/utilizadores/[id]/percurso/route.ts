import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

function obterSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Configuração do Supabase incompleta."
    );
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const supabase =
      obterSupabaseAdmin();

    const { id } =
      await context.params;

    const utilizadorId =
      String(id || "").trim();

    if (!utilizadorId) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "ID do utilizador inválido.",
        },
        { status: 400 }
      );
    }

    /* =========================================================
       UTILIZADOR
    ========================================================= */

    const {
      data: utilizador,
      error: erroUtilizador,
    } = await supabase
      .from("perfis")
      .select(
        `
          id,
          nome_completo,
          email,
          papel,
          foto_url,
          criado_em
        `
      )
      .eq("id", utilizadorId)
      .single();

    if (
      erroUtilizador ||
      !utilizador
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            erroUtilizador?.message ||
            "Utilizador não encontrado.",
        },
        { status: 404 }
      );
    }

    /* =========================================================
       REGRA:
       PERCURSO SÓ EXISTE PARA ESTUDANTES
    ========================================================= */

    if (
      utilizador.papel !==
      "ESTUDANTE"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "O percurso académico está disponível apenas para estudantes.",
        },
        { status: 403 }
      );
    }

    /* =========================================================
       PROGRESSO DOS CONTEÚDOS
    ========================================================= */

    const {
      data: progresso,
      error: erroProgresso,
    } = await supabase
      .from("progresso_utilizador")
      .select(
        "conteudo_id, concluido"
      )
      .eq(
        "utilizador_id",
        utilizadorId
      );

    if (erroProgresso) {
      throw new Error(
        `Erro ao carregar progresso: ${erroProgresso.message}`
      );
    }

    const listaProgresso =
      progresso ?? [];

    const conteudosConcluidosIds =
      listaProgresso
        .filter(
          (item) =>
            item.concluido === true
        )
        .map(
          (item) =>
            Number(
              item.conteudo_id
            )
        );

    /* =========================================================
       AVALIAÇÕES
    ========================================================= */

    const {
      data: resultadosAvaliacoes,
      error: erroAvaliacoes,
    } = await supabase
      .from(
        "avaliacoes_utilizador"
      )
      .select(
        `
          id,
          questionario_id,
          tentativa,
          estado,
          aprovado,
          pontuacao,
          total_perguntas,
          respostas_correctas,
          concluido_em
        `
      )
      .eq(
        "utilizador_id",
        utilizadorId
      )
      .order("tentativa", {
        ascending: false,
      });

    if (erroAvaliacoes) {
      throw new Error(
        `Erro ao carregar avaliações: ${erroAvaliacoes.message}`
      );
    }

    const listaResultadosAvaliacoes =
      resultadosAvaliacoes ?? [];

    /* =========================================================
       SIMULAÇÕES
    ========================================================= */

    const {
      data: resultadosSimulacoes,
      error: erroSimulacoesResultados,
    } = await supabase
      .from(
        "simulacoes_utilizador"
      )
      .select(
        `
          id,
          simulacao_id,
          tentativa,
          aprovado,
          concluido,
          pontuacao,
          total_perguntas,
          respostas_correctas,
          concluido_em
        `
      )
      .eq(
        "utilizador_id",
        utilizadorId
      )
      .order("tentativa", {
        ascending: false,
      });

    if (
      erroSimulacoesResultados
    ) {
      throw new Error(
        `Erro ao carregar simulações: ${erroSimulacoesResultados.message}`
      );
    }

    const listaResultadosSimulacoes =
      resultadosSimulacoes ?? [];

    /* =========================================================
       CERTIFICADOS
    ========================================================= */

    const {
      data: certificados,
      error: erroCertificados,
    } = await supabase
      .from("certificados")
      .select(
        `
          id,
          curso_id,
          data_emissao
        `
      )
      .eq(
        "utilizador_id",
        utilizadorId
      )
      .order("data_emissao", {
        ascending: false,
      });

    if (erroCertificados) {
      throw new Error(
        `Erro ao carregar certificados: ${erroCertificados.message}`
      );
    }

    const listaCertificados =
      certificados ?? [];

    /* =========================================================
       QUESTIONÁRIOS
    ========================================================= */

    const idsQuestionarios =
      Array.from(
        new Set(
          listaResultadosAvaliacoes.map(
            (item) =>
              Number(
                item.questionario_id
              )
          )
        )
      );

    let questionarios: any[] =
      [];

    if (
      idsQuestionarios.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("questionarios")
        .select(
          `
            id,
            modulo_id,
            titulo,
            descricao,
            pontuacao_minima
          `
        )
        .in(
          "id",
          idsQuestionarios
        );

      if (error) {
        throw new Error(
          `Erro ao carregar questionários: ${error.message}`
        );
      }

      questionarios = data ?? [];
    }

    /* =========================================================
       SIMULAÇÕES
    ========================================================= */

    const idsSimulacoes =
      Array.from(
        new Set(
          listaResultadosSimulacoes.map(
            (item) =>
              Number(
                item.simulacao_id
              )
          )
        )
      );

    let simulacoes: any[] =
      [];

    if (
      idsSimulacoes.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("simulacoes")
        .select(
          `
            id,
            modulo_id,
            titulo
          `
        )
        .in(
          "id",
          idsSimulacoes
        );

      if (error) {
        throw new Error(
          `Erro ao carregar simulações: ${error.message}`
        );
      }

      simulacoes = data ?? [];
    }

    /* =========================================================
       CONTEÚDOS
    ========================================================= */

    const idsConteudos =
      Array.from(
        new Set(
          listaProgresso.map(
            (item) =>
              Number(
                item.conteudo_id
              )
          )
        )
      );

    let conteudos: any[] =
      [];

    if (
      idsConteudos.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("conteudos")
        .select(
          `
            id,
            modulo_id,
            titulo,
            ordem
          `
        )
        .in(
          "id",
          idsConteudos
        );

      if (error) {
        throw new Error(
          `Erro ao carregar conteúdos: ${error.message}`
        );
      }

      conteudos = data ?? [];
    }

    /* =========================================================
       MÓDULOS
    ========================================================= */

    const idsModulos =
      Array.from(
        new Set([
          ...questionarios.map(
            (item) =>
              Number(
                item.modulo_id
              )
          ),

          ...simulacoes.map(
            (item) =>
              Number(
                item.modulo_id
              )
          ),

          ...conteudos.map(
            (item) =>
              Number(
                item.modulo_id
              )
          ),
        ])
      );

    let modulos: any[] =
      [];

    if (
      idsModulos.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("modulos")
        .select(
          `
            id,
            curso_id,
            titulo,
            descricao,
            ordem
          `
        )
        .in(
          "id",
          idsModulos
        )
        .order("ordem", {
          ascending: true,
        });

      if (error) {
        throw new Error(
          `Erro ao carregar módulos: ${error.message}`
        );
      }

      modulos = data ?? [];
    }

    /* =========================================================
       CURSOS
    ========================================================= */

    const idsCursos =
      Array.from(
        new Set([
          ...modulos.map(
            (item) =>
              Number(
                item.curso_id
              )
          ),

          ...listaCertificados.map(
            (item) =>
              Number(
                item.curso_id
              )
          ),
        ])
      );

    let cursos: any[] =
      [];

    if (
      idsCursos.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("cursos")
        .select(
          `
            id,
            titulo,
            descricao
          `
        )
        .in(
          "id",
          idsCursos
        );

      if (error) {
        throw new Error(
          `Erro ao carregar cursos: ${error.message}`
        );
      }

      cursos = data ?? [];
    }

    /* =========================================================
       ÚLTIMA AVALIAÇÃO
    ========================================================= */

    const ultimaAvaliacao =
      new Map<number, any>();

    listaResultadosAvaliacoes.forEach(
      (item) => {
        const id =
          Number(
            item.questionario_id
          );

        if (
          !ultimaAvaliacao.has(id)
        ) {
          ultimaAvaliacao.set(
            id,
            item
          );
        }
      }
    );

    /* =========================================================
       ÚLTIMA SIMULAÇÃO
    ========================================================= */

    const ultimaSimulacao =
      new Map<number, any>();

    listaResultadosSimulacoes.forEach(
      (item) => {
        const id =
          Number(
            item.simulacao_id
          );

        if (
          !ultimaSimulacao.has(id)
        ) {
          ultimaSimulacao.set(
            id,
            item
          );
        }
      }
    );

    /* =========================================================
       HISTÓRICO DOS CURSOS
    ========================================================= */

    const cursosHistorico =
      cursos.map((curso) => {
        const modulosCurso =
          modulos.filter(
            (modulo) =>
              Number(
                modulo.curso_id
              ) ===
              Number(curso.id)
          );

        const idsModulosCurso =
          modulosCurso.map(
            (modulo) =>
              Number(modulo.id)
          );

        const conteudosCurso =
          conteudos.filter(
            (conteudo) =>
              idsModulosCurso.includes(
                Number(
                  conteudo.modulo_id
                )
              )
          );

        const idsConteudosCurso =
          conteudosCurso.map(
            (conteudo) =>
              Number(conteudo.id)
          );

        const conteudosConcluidos =
          idsConteudosCurso.filter(
            (id) =>
              conteudosConcluidosIds.includes(
                id
              )
          ).length;

        const totalConteudos =
          conteudosCurso.length;

        const percentagem =
          totalConteudos > 0
            ? Math.round(
                (conteudosConcluidos /
                  totalConteudos) *
                  100
              )
            : 0;

        /* -------------------------
           AVALIAÇÕES
        ------------------------- */

        const questionariosCurso =
          questionarios.filter(
            (questionario) =>
              idsModulosCurso.includes(
                Number(
                  questionario.modulo_id
                )
              )
          );

        const avaliacoes =
          questionariosCurso.map(
            (questionario) => {
              const resultado =
                ultimaAvaliacao.get(
                  Number(
                    questionario.id
                  )
                );

              return {
                id: Number(
                  questionario.id
                ),

                titulo:
                  questionario.titulo,

                tentativa:
                  resultado?.tentativa ??
                  null,

                pontuacao:
                  resultado
                    ? Number(
                        resultado.pontuacao
                      )
                    : null,

                aprovado:
                  resultado?.aprovado ===
                  true,

                estado:
                  resultado?.estado ??
                  "NAO_INICIADA",

                total_perguntas:
                  Number(
                    resultado?.total_perguntas ??
                      0
                  ),

                respostas_correctas:
                  Number(
                    resultado?.respostas_correctas ??
                      0
                  ),

                concluido_em:
                  resultado?.concluido_em ??
                  null,
              };
            }
          );

        /* -------------------------
           SIMULAÇÕES
        ------------------------- */

        const simulacoesCurso =
          simulacoes.filter(
            (simulacao) =>
              idsModulosCurso.includes(
                Number(
                  simulacao.modulo_id
                )
              )
          );

        const simulacoesHistorico =
          simulacoesCurso.map(
            (simulacao) => {
              const resultado =
                ultimaSimulacao.get(
                  Number(
                    simulacao.id
                  )
                );

              return {
                id: Number(
                  simulacao.id
                ),

                titulo:
                  simulacao.titulo,

                tentativa:
                  resultado?.tentativa ??
                  null,

                pontuacao:
                  resultado
                    ? Number(
                        resultado.pontuacao
                      )
                    : null,

                aprovado:
                  resultado?.aprovado ===
                  true,

                concluido:
                  resultado?.concluido ===
                  true,

                concluido_em:
                  resultado?.concluido_em ??
                  null,
              };
            }
          );

        /* -------------------------
           CERTIFICADO
        ------------------------- */

        const certificado =
          listaCertificados.find(
            (item) =>
              Number(
                item.curso_id
              ) ===
              Number(curso.id)
          ) ?? null;

        const avaliacoesAprovadas =
          avaliacoes.filter(
            (item) =>
              item.aprovado
          ).length;

        const simulacoesConcluidas =
          simulacoesHistorico.filter(
            (item) =>
              item.aprovado &&
              item.concluido
          ).length;

        const cursoConcluido =
          totalConteudos > 0 &&
          conteudosConcluidos ===
            totalConteudos &&
          (
            avaliacoes.length ===
              0 ||
            avaliacoesAprovadas ===
              avaliacoes.length
          ) &&
          (
            simulacoesHistorico.length ===
              0 ||
            simulacoesConcluidas ===
              simulacoesHistorico.length
          );

        return {
          id: Number(
            curso.id
          ),

          titulo:
            curso.titulo,

          descricao:
            curso.descricao,

          total_modulos:
            modulosCurso.length,

          total_conteudos:
            totalConteudos,

          conteudos_concluidos:
            conteudosConcluidos,

          percentagem,

          total_avaliacoes:
            avaliacoes.length,

          avaliacoes_aprovadas:
            avaliacoesAprovadas,

          avaliacoes,

          total_simulacoes:
            simulacoesHistorico.length,

          simulacoes_concluidas:
            simulacoesConcluidas,

          simulacoes:
            simulacoesHistorico,

          certificado:
            certificado
              ? {
                  id: Number(
                    certificado.id
                  ),

                  data_emissao:
                    certificado.data_emissao,
                }
              : null,

          concluido:
            cursoConcluido,
        };
      });

    /* =========================================================
       RESUMO
    ========================================================= */

    return NextResponse.json(
      {
        sucesso: true,

        utilizador,

        resumo: {
          cursos:
            cursosHistorico.length,

          cursos_concluidos:
            cursosHistorico.filter(
              (curso) =>
                curso.concluido
            ).length,

          avaliacoes:
            listaResultadosAvaliacoes.length,

          avaliacoes_aprovadas:
            listaResultadosAvaliacoes.filter(
              (item) =>
                item.aprovado ===
                true
            ).length,

          simulacoes:
            listaResultadosSimulacoes.length,

          simulacoes_aprovadas:
            listaResultadosSimulacoes.filter(
              (item) =>
                item.aprovado ===
                true
            ).length,

          certificados:
            listaCertificados.length,
        },

        cursos:
          cursosHistorico,

        certificados:
          listaCertificados.map(
            (certificado) => {
              const curso =
                cursos.find(
                  (item) =>
                    Number(
                      item.id
                    ) ===
                    Number(
                      certificado.curso_id
                    )
                );

              return {
                id: Number(
                  certificado.id
                ),

                curso_id:
                  Number(
                    certificado.curso_id
                  ),

                curso_titulo:
                  curso?.titulo ??
                  "Curso",

                data_emissao:
                  certificado.data_emissao,
              };
            }
          ),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Erro no percurso do utilizador:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          error instanceof Error
            ? error.message
            : "Erro interno do servidor.",
      },
      {
        status: 500,
      }
    );
  }
}