"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  FaArrowLeft,
  FaBook,
  FaBookOpen,
  FaCheckCircle,
  FaChevronDown,
  FaChevronRight,
  FaCircle,
  FaCertificate,
  FaClipboardCheck,
  FaFilePdf,
  FaLock,
  FaPlayCircle,
  FaSpinner,
  FaTrophy,
} from "react-icons/fa";

import { criarClienteSupabase } from "@/lib/supabase/client";

import {
  calcularProgressoCurso,
  estadoProgressoParaClasses,
  estadoProgressoParaTexto,
  type ModuloParaProgresso,
  type ProgressoConteudo,
  type ResultadoProgressoCurso,
} from "@/lib/progresso/calcularProgresso";

/* ============================================================
 * TIPOS
 * ============================================================
 */

interface Curso {
  id: number;
  titulo: string;
  descricao: string;
}

interface Conteudo {
  id: number;
  modulo_id: number;
  titulo: string;
  descricao: string;
  tipo: string;
  conteudo_url: string | null;
  ordem: number;
}

interface Modulo {
  id: number;
  curso_id: number;
  titulo: string;
  descricao: string;
  ordem: number;
  conteudos: Conteudo[];
}

interface Questionario {
  id: number;
  modulo_id: number;
  titulo: string;
  descricao: string;
  pontuacao_minima: number;
}

interface PerguntaAvaliacao {
  id: number;
  questionario_id: number;
}

interface ResultadoAvaliacaoUtilizador {
  id: number;
  questionario_id: number;
  tentativa: number | null;
  estado: string | null;
  aprovado: boolean | null;
  pontuacao: number | null;
  total_perguntas: number | null;
  respostas_correctas: number | null;
}

interface RespostaUtilizador {
  avaliacao_id: number;
  pergunta_id: number;
  alternativa_id: number;
}

interface Simulacao {
  id: number;
  modulo_id: number;
  titulo: string;
}

interface ResultadoSimulacao {
  id: number;
  simulacao_id: number;
  tentativa: number | null;
  aprovado: boolean | null;
  concluido: boolean | null;
  pontuacao: number | null;
}
type EstadoAvaliacao =
  | "NAO_INICIADA"
  | "EM_PROGRESSO"
  | "APROVADA"
  | "NAO_APROVADA";

interface AvaliacaoModulo {
  questionario: Questionario;
  avaliacaoId: number | null;
  tentativa: number | null;
  totalPerguntas: number;
  perguntasRespondidas: number;
  respostasCorrectas: number;
  percentagem: number;
  estado: EstadoAvaliacao;
}

/* ============================================================
 * PÁGINA
 * ============================================================
 */

export default function CursoPage() {
  const params = useParams();

  const idCurso = Number(params.id);

  const [curso, setCurso] =
    useState<Curso | null>(null);

  const [modulos, setModulos] =
    useState<Modulo[]>([]);

  const [progressoConteudos, setProgressoConteudos] =
    useState<ProgressoConteudo[]>([]);

  const [avaliacoes, setAvaliacoes] =
    useState<AvaliacaoModulo[]>([]);

  const [simulacoes, setSimulacoes] =
    useState<Simulacao[]>([]);

  const [resultadosSimulacoes, setResultadosSimulacoes] =
    useState<ResultadoSimulacao[]>([]);

  const [certificadoEmitido, setCertificadoEmitido] =
    useState(false);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [moduloAberto, setModuloAberto] =
    useState<number | null>(null);

  /* ==========================================================
   * CARREGAR CURSO
   * ==========================================================
   */

  async function carregarCurso() {
    try {
      const supabase = criarClienteSupabase();

      setCarregando(true);
      setErro("");

      if (
        !idCurso ||
        Number.isNaN(idCurso)
      ) {
        setErro(
          "O curso seleccionado é inválido."
        );

        return;
      }

      /* ------------------------------------------------------
       * UTILIZADOR AUTENTICADO
       * ------------------------------------------------------
       */

      const {
        data: { user },
        error: erroUtilizador,
      } =
        await supabase.auth.getUser();

      if (
        erroUtilizador ||
        !user
      ) {
        setErro(
          "Não foi possível identificar o utilizador autenticado."
        );

        return;
      }

      /* ------------------------------------------------------
       * CURSO
       * ------------------------------------------------------
       */

      const {
        data: dadosCurso,
        error: erroCurso,
      } = await supabase
        .from("cursos")
        .select(
          "id, titulo, descricao"
        )
        .eq("id", idCurso)
        .single();

      if (
        erroCurso ||
        !dadosCurso
      ) {
        console.error(
          "Erro ao carregar curso:",
          erroCurso
        );

        setErro(
          "Não foi possível encontrar o curso solicitado."
        );

        return;
      }

      setCurso(
        dadosCurso as Curso
      );

      /* ------------------------------------------------------
       * MÓDULOS
       * ------------------------------------------------------
       */

      const {
        data: dadosModulos,
        error: erroModulos,
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
        .eq(
          "curso_id",
          idCurso
        )
        .order("ordem", {
          ascending: true,
        });

      if (erroModulos) {
        console.error(
          "Erro ao carregar módulos:",
          erroModulos
        );

        setErro(
          "Não foi possível carregar os módulos deste curso."
        );

        return;
      }

      const listaModulos =
        (dadosModulos ??
          []) as Modulo[];

      /* ------------------------------------------------------
       * CONTEÚDOS
       * ------------------------------------------------------
       */

      const idsModulos =
        listaModulos.map(
          (modulo) =>
            modulo.id
        );

      let listaConteudos: Conteudo[] =
        [];

      if (
        idsModulos.length > 0
      ) {
        const {
          data: dadosConteudos,
          error: erroConteudos,
        } = await supabase
          .from("conteudos")
          .select(
            `
              id,
              modulo_id,
              titulo,
              descricao,
              tipo,
              conteudo_url,
              ordem
            `
          )
          .in(
            "modulo_id",
            idsModulos
          )
          .order("ordem", {
            ascending: true,
          });

        if (erroConteudos) {
          console.error(
            "Erro ao carregar conteúdos:",
            erroConteudos
          );

          setErro(
            "Não foi possível carregar os conteúdos do curso."
          );

          return;
        }

        listaConteudos =
          (dadosConteudos ??
            []) as Conteudo[];
      }

      /* ------------------------------------------------------
       * ORGANIZAR CONTEÚDOS
       * ------------------------------------------------------
       */

      const modulosOrganizados =
        listaModulos.map(
          (modulo) => ({
            ...modulo,

            conteudos:
              listaConteudos
                .filter(
                  (conteudo) =>
                    conteudo.modulo_id ===
                    modulo.id
                )
                .sort(
                  (a, b) =>
                    a.ordem -
                    b.ordem
                ),
          })
        );

      setModulos(
        modulosOrganizados
      );

      /* ------------------------------------------------------
       * PROGRESSO DOS CONTEÚDOS
       * ------------------------------------------------------
       */

      const {
        data: dadosProgresso,
        error: erroProgresso,
      } = await supabase
        .from("progresso_utilizador")
        .select(
          "conteudo_id, concluido"
        )
        .eq(
          "utilizador_id",
          user.id
        );

      if (erroProgresso) {
        console.error(
          "Erro ao carregar progresso:",
          erroProgresso
        );

        setProgressoConteudos(
          []
        );
      } else {
        setProgressoConteudos(
          (dadosProgresso ??
            []) as ProgressoConteudo[]
        );
      }

      /* ------------------------------------------------------
       * QUESTIONÁRIOS DOS MÓDULOS
       * ------------------------------------------------------
       */

      let listaQuestionarios: Questionario[] =
        [];

      if (
        idsModulos.length > 0
      ) {
        const {
          data: dadosQuestionarios,
          error: erroQuestionarios,
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
            "modulo_id",
            idsModulos
          )
          .order("id", {
            ascending: true,
          });

        if (erroQuestionarios) {
          console.error(
            "Erro ao carregar avaliações:",
            erroQuestionarios
          );

          listaQuestionarios = [];
        } else {
          listaQuestionarios =
            (dadosQuestionarios ??
              []) as Questionario[];
        }
      }

      /* ------------------------------------------------------
       * PERGUNTAS DAS AVALIAÇÕES
       * ------------------------------------------------------
       */

      const idsQuestionarios =
        listaQuestionarios.map(
          (questionario) =>
            questionario.id
        );

      let listaPerguntas:
        PerguntaAvaliacao[] = [];

      if (
        idsQuestionarios.length > 0
      ) {
        const {
          data: dadosPerguntas,
          error: erroPerguntas,
        } = await supabase
          .from("perguntas")
          .select(
            `
              id,
              questionario_id
            `
          )
          .in(
            "questionario_id",
            idsQuestionarios
          );

        if (erroPerguntas) {
          console.error(
            "Erro ao carregar perguntas das avaliações:",
            erroPerguntas
          );
        } else {
          listaPerguntas =
            (dadosPerguntas ??
              []) as PerguntaAvaliacao[];
        }
      }

       /* ------------------------------------------------------
        * RESULTADOS DAS AVALIAÇÕES DO UTILIZADOR
        * ------------------------------------------------------
        * Cada registo em avaliacoes_utilizador representa uma tentativa.
        * Mostramos a última tentativa de cada questionário.
        * ------------------------------------------------------
        */

       let resultadosAvaliacoes: ResultadoAvaliacaoUtilizador[] = [];

       if (idsQuestionarios.length > 0) {
         const { data: dadosAvaliacoes, error: erroAvaliacoes } = await supabase
           .from("avaliacoes_utilizador")
           .select(`
             id,
             questionario_id,
             tentativa,
             estado,
             aprovado,
             pontuacao,
             total_perguntas,
             respostas_correctas
           `)
           .eq("utilizador_id", user.id)
           .in("questionario_id", idsQuestionarios)
           .order("tentativa", { ascending: false });

         if (erroAvaliacoes) {
           console.error("Erro ao carregar resultados das avaliações:", erroAvaliacoes);
         } else {
           resultadosAvaliacoes = (dadosAvaliacoes ?? []) as ResultadoAvaliacaoUtilizador[];
         }
       }

       const ultimaAvaliacaoPorQuestionario =
         new Map<number, ResultadoAvaliacaoUtilizador>();

       resultadosAvaliacoes.forEach((resultado) => {
         if (!ultimaAvaliacaoPorQuestionario.has(resultado.questionario_id)) {
           ultimaAvaliacaoPorQuestionario.set(resultado.questionario_id, resultado);
         }
       });

       const idsAvaliacoes = Array.from(ultimaAvaliacaoPorQuestionario.values())
         .map((avaliacao) => avaliacao.id)
         .filter(Boolean);

       let listaRespostas: RespostaUtilizador[] = [];

       if (idsAvaliacoes.length > 0) {
         const { data: dadosRespostas, error: erroRespostas } = await supabase
           .from("respostas_utilizador")
           .select(`avaliacao_id, pergunta_id, alternativa_id`)
           .eq("utilizador_id", user.id)
           .in("avaliacao_id", idsAvaliacoes);

         if (erroRespostas) {
           console.error("Erro ao carregar respostas das avaliações:", erroRespostas);
         } else {
           listaRespostas = (dadosRespostas ?? []) as RespostaUtilizador[];
         }
       }

       const avaliacoesCalculadas: AvaliacaoModulo[] =
         listaQuestionarios.map((questionario) => {
           const perguntasQuestionario = listaPerguntas.filter(
             (pergunta) => pergunta.questionario_id === questionario.id
           );

           const resultado = ultimaAvaliacaoPorQuestionario.get(questionario.id);

           const perguntasRespondidas = resultado
             ? new Set(
                 listaRespostas
                   .filter((resposta) => resposta.avaliacao_id === resultado.id)
                   .map((resposta) => resposta.pergunta_id)
               ).size
             : 0;

           const totalPerguntas = Number(
             resultado?.total_perguntas ?? perguntasQuestionario.length
           );

           const respostasCorrectas = Number(resultado?.respostas_correctas ?? 0);
           const percentagem = Number(resultado?.pontuacao ?? 0);

           let estado: EstadoAvaliacao = "NAO_INICIADA";

           if (resultado?.estado === "EM_PROGRESSO") {
             estado = "EM_PROGRESSO";
           } else if (resultado?.aprovado === true || resultado?.estado === "APROVADA") {
             estado = "APROVADA";
           } else if (resultado) {
             estado = "NAO_APROVADA";
           }

           return {
             questionario,
             avaliacaoId: resultado?.id ?? null,
             tentativa: resultado?.tentativa ?? null,
             totalPerguntas,
             perguntasRespondidas,
             respostasCorrectas,
             percentagem,
             estado,
           };
         });

       setAvaliacoes(avaliacoesCalculadas);

       /* ------------------------------------------------------
        * SIMULAÇÕES DO CURSO
        * ------------------------------------------------------
        */

       let listaSimulacoes: Simulacao[] = [];

       if (idsModulos.length > 0) {
         const { data: dadosSimulacoes, error: erroSimulacoes } =
           await supabase
             .from("simulacoes")
             .select("id, modulo_id, titulo")
             .in("modulo_id", idsModulos)
             .order("id", { ascending: true });

         if (erroSimulacoes) {
           console.error("Erro ao carregar simulações:", erroSimulacoes);
         } else {
           listaSimulacoes = (dadosSimulacoes ?? []) as Simulacao[];
         }
       }

       setSimulacoes(listaSimulacoes);

       const idsSimulacoes = listaSimulacoes.map((simulacao) => simulacao.id);

       if (idsSimulacoes.length > 0) {
         const { data: dadosResultadosSimulacoes, error: erroResultadosSimulacoes } =
           await supabase
             .from("simulacoes_utilizador")
             .select("id, simulacao_id, tentativa, aprovado, concluido, pontuacao")
             .eq("utilizador_id", user.id)
             .in("simulacao_id", idsSimulacoes)
             .order("tentativa", { ascending: false });

         if (erroResultadosSimulacoes) {
           console.error("Erro ao carregar resultados das simulações:", erroResultadosSimulacoes);
           setResultadosSimulacoes([]);
         } else {
           const mapaUltimos = new Map<number, ResultadoSimulacao>();

           ((dadosResultadosSimulacoes ?? []) as ResultadoSimulacao[]).forEach((resultado) => {
             if (!mapaUltimos.has(resultado.simulacao_id)) {
               mapaUltimos.set(resultado.simulacao_id, resultado);
             }
           });

           setResultadosSimulacoes(Array.from(mapaUltimos.values()));
         }
       } else {
         setResultadosSimulacoes([]);
       }

       const { data: certificadoExistente, error: erroCertificado } =
         await supabase
           .from("certificados")
           .select("id")
           .eq("utilizador_id", user.id)
           .eq("curso_id", idCurso)
           .maybeSingle();

       if (erroCertificado) {
         console.error("Erro ao verificar certificado:", erroCertificado);
       }

       setCertificadoEmitido(Boolean(certificadoExistente));

       /* ======================================================
        * EMISSÃO AUTOMÁTICA / RECUPERAÇÃO DO CERTIFICADO
        * ======================================================
        * O certificado representa a conclusão real do curso:
        * conteúdos + avaliações + simulações.
        * Uma aprovação anterior continua válida mesmo que o
        * estudante faça depois uma tentativa reprovada.
        */

       const idsConteudosCurso = listaConteudos.map((item) => Number(item.id));

       const conteudosConcluidosSet = new Set(
         (dadosProgresso ?? [])
           .filter((item) => item.concluido === true)
           .map((item) => Number(item.conteudo_id))
       );

       const todosConteudosConcluidos =
         idsConteudosCurso.length > 0 &&
         idsConteudosCurso.every((id) => conteudosConcluidosSet.has(id));

       const questionariosAprovadosSet = new Set<number>();

       resultadosAvaliacoes.forEach((resultado) => {
         if (
           resultado.aprovado === true ||
           resultado.estado === "APROVADA"
         ) {
           questionariosAprovadosSet.add(
             Number(resultado.questionario_id)
           );
         }
       });

       const todasAvaliacoesAprovadas =
         idsQuestionarios.length > 0 &&
         idsQuestionarios.every((id) =>
           questionariosAprovadosSet.has(id)
         );

       const simulacoesAprovadasSet = new Set<number>();

       if (idsSimulacoes.length > 0) {
         const { data: resultadosCertificado, error: erroResultadosCertificado } =
           await supabase
             .from("simulacoes_utilizador")
             .select("simulacao_id, aprovado, concluido")
             .eq("utilizador_id", user.id)
             .in("simulacao_id", idsSimulacoes);

         if (erroResultadosCertificado) {
           console.error(
             "Erro ao verificar simulações para certificado:",
             erroResultadosCertificado
           );
         } else {
           (resultadosCertificado ?? []).forEach((resultado) => {
             if (
               resultado.aprovado === true &&
               resultado.concluido === true
             ) {
               simulacoesAprovadasSet.add(
                 Number(resultado.simulacao_id)
               );
             }
           });
         }
       }

       const todasSimulacoesConcluidas =
         idsSimulacoes.length > 0 &&
         idsSimulacoes.every((id) =>
           simulacoesAprovadasSet.has(id)
         );

       const cursoConcluido =
         todosConteudosConcluidos &&
         todasAvaliacoesAprovadas &&
         todasSimulacoesConcluidas;

       if (cursoConcluido && !certificadoExistente) {
         const { data: novoCertificado, error: erroCriarCertificado } =
           await supabase
             .from("certificados")
             .insert({
               utilizador_id: user.id,
               curso_id: idCurso,
               data_emissao: new Date().toISOString(),
             })
             .select("id")
             .single();

         if (erroCriarCertificado) {
           console.error(
             "Erro ao emitir certificado automaticamente:",
             erroCriarCertificado
           );
         } else {
           setCertificadoEmitido(Boolean(novoCertificado));
         }
       }

      /* ------------------------------------------------------
       * ABRIR PRIMEIRO MÓDULO
       * ------------------------------------------------------
       */

      if (
        modulosOrganizados.length >
        0
      ) {
        setModuloAberto(
          modulosOrganizados[0].id
        );
      }
    } catch (erro) {
      console.error(
        "Erro inesperado ao carregar curso:",
        erro
      );

      setErro(
        "Ocorreu um erro inesperado ao carregar o curso."
      );
    } finally {
      setCarregando(false);
    }
  }

  /* ==========================================================
   * INICIALIZAÇÃO
   * ==========================================================
   */

  useEffect(() => {
    carregarCurso();
  }, [idCurso]);

  /* ==========================================================
   * ESTRUTURA PARA O MOTOR DE PROGRESSO
   * ==========================================================
   */

  const modulosParaProgresso =
    useMemo<ModuloParaProgresso[]>(
      () =>
        modulos.map(
          (modulo) => ({
            id: modulo.id,
            curso_id:
              modulo.curso_id,
            titulo:
              modulo.titulo,
            ordem:
              modulo.ordem,

            conteudos:
              modulo.conteudos.map(
                (conteudo) => ({
                  id: conteudo.id,
                  modulo_id:
                    conteudo.modulo_id,
                  titulo:
                    conteudo.titulo,
                  ordem:
                    conteudo.ordem,
                })
              ),
          })
        ),
      [modulos]
    );

  /* ==========================================================
   * PROGRESSO REAL DO CURSO
   * ==========================================================
   */

  const progressoCurso =
    useMemo<ResultadoProgressoCurso>(
      () =>
        calcularProgressoCurso(
          idCurso,
          modulosParaProgresso,
          progressoConteudos
        ),
      [
        idCurso,
        modulosParaProgresso,
        progressoConteudos,
      ]
    );

  /* ==========================================================
   * ESTATÍSTICAS
   * ==========================================================
   */

  const totalConteudos =
    progressoCurso.totalConteudos;

  const conteudosConcluidos =
    progressoCurso.conteudosConcluidos;

  const percentagem =
    progressoCurso.percentagem;

  const estado =
    progressoCurso.estado;

  /* ==========================================================
   * ESTATÍSTICAS DAS AVALIAÇÕES
   * ==========================================================
   */

  const totalAvaliacoes =
    avaliacoes.length;

  const avaliacoesAprovadas =
    avaliacoes.filter(
      (avaliacao) =>
        avaliacao.estado ===
        "APROVADA"
    ).length;

  const avaliacoesDisponiveis =
    avaliacoes.filter(
      (avaliacao) =>
        obterProgressoModulo(
          avaliacao.questionario.modulo_id
        ).percentagem >= 100
    ).length;

  /* ==========================================================
   * REGRAS DO PERCURSO FINAL
   * ==========================================================
   */

  const conteudosCursoConcluidos =
    totalConteudos > 0 &&
    conteudosConcluidos >= totalConteudos;

  const todasAvaliacoesAprovadas =
    totalAvaliacoes > 0 &&
    avaliacoesAprovadas >= totalAvaliacoes;

  const prontoParaSimulacoes =
    conteudosCursoConcluidos &&
    todasAvaliacoesAprovadas;

  const resultadosPorSimulacao = useMemo(() => {
    return new Map(
      resultadosSimulacoes.map((resultado) => [
        resultado.simulacao_id,
        resultado,
      ])
    );
  }, [resultadosSimulacoes]);

  const simulacoesConcluidas = simulacoes.filter((simulacao) => {
    const resultado = resultadosPorSimulacao.get(simulacao.id);
    return resultado?.concluido === true && resultado?.aprovado === true;
  }).length;

  const todasSimulacoesConcluidas =
    simulacoes.length > 0 &&
    simulacoesConcluidas >= simulacoes.length;

  const prontoParaCertificado =
    conteudosCursoConcluidos &&
    todasAvaliacoesAprovadas &&
    todasSimulacoesConcluidas;

  /* ==========================================================
   * ALTERNAR MÓDULO
   * ==========================================================
   */

  function alternarModulo(
    idModulo: number
  ) {
    setModuloAberto(
      (actual) =>
        actual === idModulo
          ? null
          : idModulo
    );
  }

  /* ==========================================================
   * ÍCONE DO TIPO DE CONTEÚDO
   * ==========================================================
   */

  function obterIconeConteudo(
    tipo: string
  ) {
    switch (
      tipo.toUpperCase()
    ) {
      case "VIDEO":
        return (
          <FaPlayCircle className="text-blue-700" />
        );

      case "PDF":
        return (
          <FaFilePdf className="text-red-600" />
        );

      case "TEXTO":
      default:
        return (
          <FaBookOpen className="text-blue-700" />
        );
    }
  }

  /* ==========================================================
   * NOME DO TIPO
   * ==========================================================
   */

  function obterNomeTipo(
    tipo: string
  ) {
    switch (
      tipo.toUpperCase()
    ) {
      case "VIDEO":
        return "Vídeo";

      case "PDF":
        return "PDF";

      case "TEXTO":
        return "Texto";

      default:
        return tipo;
    }
  }

  /* ==========================================================
   * PROGRESSO DE UM MÓDULO
   * ==========================================================
   */

  function obterProgressoModulo(
    moduloId: number
  ) {
    return (
      progressoCurso.modulos.find(
        (modulo) =>
          modulo.moduloId ===
          moduloId
      ) ?? {
        moduloId,
        titulo: "",
        ordem: 0,
        totalConteudos: 0,
        conteudosConcluidos: 0,
        percentagem: 0,
        estado:
          "NAO_INICIADO" as const,
      }
    );
  }

  /* ==========================================================
   * VERIFICAR CONTEÚDO CONCLUÍDO
   * ==========================================================
   */

  function conteudoFoiConcluido(
    conteudoId: number
  ) {
    return progressoConteudos.some(
      (item) =>
        Number(
          item.conteudo_id
        ) ===
          Number(conteudoId) &&
        item.concluido === true
    );
  }

  /* ==========================================================
   * OBTER AVALIAÇÃO DO MÓDULO
   * ==========================================================
   */

function obterAvaliacoesModulo(moduloId: number) {
    return avaliacoes.filter(
      (avaliacao) => avaliacao.questionario.modulo_id === moduloId
    );
  }

  /* ==========================================================
   * VERIFICAR SE A AVALIAÇÃO ESTÁ DESBLOQUEADA
   * ==========================================================
   */

  function avaliacaoEstaDesbloqueada(
    moduloId: number
  ) {
    const progressoModulo =
      obterProgressoModulo(
        moduloId
      );

    return (
      progressoModulo.totalConteudos >
        0 &&
      progressoModulo.conteudosConcluidos >=
        progressoModulo.totalConteudos
    );
  }

  /* ==========================================================
   * CARREGAMENTO
   * ==========================================================
   */

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
          <div className="text-center">

            <FaSpinner className="mx-auto animate-spin text-4xl text-blue-800" />

            <p className="mt-4 text-sm font-medium text-slate-600">
              A carregar o curso...
            </p>

          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
   * ERRO
   * ==========================================================
   */

  if (
    erro ||
    !curso
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">

          <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
              <FaBook className="text-2xl text-red-600" />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Não foi possível carregar o curso
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {erro ||
                "O curso solicitado não está disponível."}
            </p>

            <Link
              href="/dashboard/cursos"
              className="
                mt-6
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-800
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-blue-900
              "
            >
              <FaArrowLeft />
              Voltar aos cursos
            </Link>

          </section>
        </div>
      </main>
    );
  }

  /* ==========================================================
   * INTERFACE
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">

        {/* ====================================================
            VOLTAR
        ==================================================== */}

        <Link
          href="/dashboard/cursos"
          className="
            mb-6
            inline-flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-slate-600
            transition
            hover:text-blue-800
          "
        >
          <FaArrowLeft />
          Voltar aos cursos
        </Link>

        {/* ====================================================
            CABEÇALHO DO CURSO
        ==================================================== */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="bg-blue-900 px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10">

            <div className="max-w-4xl">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <FaBook className="text-xl" />
                </div>

                <span className="text-sm font-semibold uppercase tracking-wider text-blue-200">
                  Curso
                </span>

              </div>

              <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                {curso.titulo}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                {curso.descricao ||
                  "Explore os conteúdos e desenvolva os seus conhecimentos em segurança da informação."}
              </p>

            </div>
          </div>

          {/* ==================================================
              PROGRESSO PRINCIPAL
          ================================================== */}

          <div className="border-b border-slate-100 px-6 py-6 sm:px-8 lg:px-10">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <h2 className="text-lg font-bold text-slate-900">
                    Progresso do curso
                  </h2>

                  <span
                    className={`
                      inline-flex
                      rounded-full
                      px-3
                      py-1
                      text-xs
                      font-bold
                      ${estadoProgressoParaClasses(
                        estado
                      )}
                    `}
                  >
                    {estadoProgressoParaTexto(
                      estado
                    )}
                  </span>

                </div>

                <p className="mt-2 text-sm text-slate-600">
                  {conteudosConcluidos} de{" "}
                  {totalConteudos}{" "}
                  {totalConteudos === 1
                    ? "conteúdo concluído"
                    : "conteúdos concluídos"}
                </p>

              </div>

              <div className="w-full lg:max-w-md">

                <div className="mb-2 flex items-center justify-between">

                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Progresso
                  </span>

                  <span className="text-lg font-bold text-blue-900">
                    {percentagem}%
                  </span>

                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-200">

                  <div
                    className="
                      h-full
                      rounded-full
                      bg-blue-800
                      transition-all
                      duration-500
                    "
                    style={{
                      width: `${percentagem}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          </div>

          {/* ==================================================
              ESTATÍSTICAS
          ================================================== */}

          <div className="grid grid-cols-2 divide-x divide-slate-100 lg:grid-cols-4">

            <div className="px-5 py-5 sm:px-8">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Módulos
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {modulos.length}
              </p>

            </div>

            <div className="px-5 py-5 sm:px-8">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Conteúdos
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {totalConteudos}
              </p>

            </div>

            <div className="border-t border-slate-100 px-5 py-5 sm:px-8 lg:border-l lg:border-t-0">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Avaliações
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {avaliacoesAprovadas}/{totalAvaliacoes}
              </p>

            </div>

            <div className="border-t border-slate-100 px-5 py-5 sm:px-8 lg:border-l lg:border-t-0">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Avaliações disponíveis
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-700">
                {avaliacoesDisponiveis}
              </p>

            </div>

          </div>

        </section>

        {/* ====================================================
            CONTEÚDO DO CURSO
        ==================================================== */}

        <section className="mt-8">

          <div className="mb-5">

            <h2 className="text-2xl font-bold text-slate-900">
              Conteúdo do curso
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Acompanhe o seu progresso em cada módulo, conteúdo e avaliação.
            </p>

          </div>

          {modulos.length === 0 ? (

            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                <FaBookOpen className="text-2xl text-blue-800" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Este curso ainda não possui módulos
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                Os conteúdos deste curso serão disponibilizados assim que os módulos forem adicionados.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {modulos.map(
                (modulo, indice) => {

                  const aberto =
                    moduloAberto ===
                    modulo.id;

                  const progressoModulo =
                    obterProgressoModulo(
                      modulo.id
                    );

                  const avaliacoesModulo =
                    obterAvaliacoesModulo(
                      modulo.id
                    );

                  const avaliacaoDesbloqueada =
                    avaliacaoEstaDesbloqueada(
                      modulo.id
                    );

                  return (
                    <article
                      key={modulo.id}
                      className="
                        overflow-hidden
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        shadow-sm
                        transition-shadow
                        hover:shadow-md
                      "
                    >

                      {/* ========================================
                          CABEÇALHO DO MÓDULO
                      ======================================== */}

                      <button
                        type="button"
                        onClick={() =>
                          alternarModulo(
                            modulo.id
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-4
                          p-5
                          text-left
                          sm:p-6
                        "
                        aria-expanded={
                          aberto
                        }
                      >

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-800">
                          {String(
                            indice + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                            <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                              {modulo.titulo}
                            </h3>

                            <span
                              className={`
                                w-fit
                                rounded-full
                                px-3
                                py-1
                                text-xs
                                font-bold
                                ${estadoProgressoParaClasses(
                                  progressoModulo.estado
                                )}
                              `}
                            >
                              {estadoProgressoParaTexto(
                                progressoModulo.estado
                              )}
                            </span>

                          </div>

                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                            {modulo.descricao}
                          </p>

                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">

                            <span className="text-xs font-semibold text-slate-500">
                              {progressoModulo.conteudosConcluidos}{" "}
                              de{" "}
                              {progressoModulo.totalConteudos}{" "}
                              concluídos
                            </span>

                            <div className="flex flex-1 items-center gap-3">

                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">

                                <div
                                  className="
                                    h-full
                                    rounded-full
                                    bg-blue-700
                                    transition-all
                                  "
                                  style={{
                                    width: `${progressoModulo.percentagem}%`,
                                  }}
                                />

                              </div>

                              <span className="w-10 text-right text-xs font-bold text-blue-800">
                                {
                                  progressoModulo.percentagem
                                }%
                              </span>

                            </div>

                          </div>

                        </div>

                        <div className="shrink-0 text-slate-400">

                          {aberto ? (
                            <FaChevronDown />
                          ) : (
                            <FaChevronRight />
                          )}

                        </div>

                      </button>

                      {/* ========================================
                          CONTEÚDOS + AVALIAÇÃO
                      ======================================== */}

                      {aberto && (

                        <div className="border-t border-slate-100 bg-slate-50">

                          {/* ====================================
                              CONTEÚDOS
                          ==================================== */}

                          {modulo.conteudos.length === 0 ? (

                            <div className="px-5 py-6 sm:px-6">

                              <p className="text-sm text-slate-500">
                                Este módulo ainda não possui conteúdos.
                              </p>

                            </div>

                          ) : (

                            <div className="divide-y divide-slate-200">

                              {modulo.conteudos.map(
                                (
                                  conteudo,
                                  conteudoIndex
                                ) => {

                                  const concluido =
                                    conteudoFoiConcluido(
                                      conteudo.id
                                    );

                                  return (
                                    <Link
                                      key={
                                        conteudo.id
                                      }
                                      href={`/dashboard/cursos/${idCurso}/conteudo/${conteudo.id}`}
                                      className="
                                        group
                                        flex
                                        items-center
                                        gap-4
                                        px-5
                                        py-4
                                        transition
                                        hover:bg-white
                                        sm:px-6
                                      "
                                    >

                                      {/* ÍCONE */}

                                      <div
                                        className={`
                                          flex
                                          h-10
                                          w-10
                                          shrink-0
                                          items-center
                                          justify-center
                                          rounded-xl
                                          shadow-sm
                                          ${
                                            concluido
                                              ? "bg-emerald-100"
                                              : "bg-white"
                                          }
                                        `}
                                      >

                                        {concluido ? (
                                          <FaCheckCircle className="text-emerald-600" />
                                        ) : (
                                          obterIconeConteudo(
                                            conteudo.tipo
                                          )
                                        )}

                                      </div>

                                      {/* INFORMAÇÕES */}

                                      <div className="min-w-0 flex-1">

                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">

                                          <h4 className="truncate text-sm font-semibold text-slate-900">
                                            {conteudoIndex +
                                              1}
                                            .{" "}
                                            {
                                              conteudo.titulo
                                            }
                                          </h4>

                                          <span className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                            {obterNomeTipo(
                                              conteudo.tipo
                                            )}
                                          </span>

                                        </div>

                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                          {
                                            conteudo.descricao
                                          }
                                        </p>

                                      </div>

                                      {/* ESTADO */}

                                      <div className="hidden shrink-0 sm:block">

                                        {concluido ? (

                                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                            <FaCheckCircle />
                                            Concluído
                                          </span>

                                        ) : (

                                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                                            <FaCircle className="text-[7px]" />
                                            Não iniciado
                                          </span>

                                        )}

                                      </div>

                                      <FaChevronRight className="shrink-0 text-xs text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700" />

                                    </Link>
                                  );
                                }
                              )}

                            </div>

                          )}

                          {/* ====================================
                              AVALIAÇÃO DO MÓDULO
                          ==================================== */}

                          {avaliacoesModulo.length > 0 && (
                            <div className="space-y-4 border-t border-slate-200 p-5 sm:p-6">
                              {avaliacoesModulo.map((avaliacao) => {
                                const numeroAvaliacao =
                                  avaliacoes.findIndex(
                                    (item) => item.questionario.id === avaliacao.questionario.id
                                  ) + 1;

                                return (
                                  <div
                                    key={avaliacao.questionario.id}
                                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                                      avaliacao.estado === "APROVADA"
                                        ? "border-emerald-200"
                                        : avaliacaoDesbloqueada
                                          ? "border-blue-200"
                                          : "border-slate-200"
                                    }`}
                                  >
                                    <div className="p-5 sm:p-6">
                                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex items-start gap-4">
                                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                                            avaliacao.estado === "APROVADA"
                                              ? "bg-emerald-100 text-emerald-700"
                                              : avaliacaoDesbloqueada
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-slate-100 text-slate-500"
                                          }`}>
                                            {avaliacao.estado === "APROVADA" ? (
                                              <FaTrophy className="text-xl" />
                                            ) : avaliacaoDesbloqueada ? (
                                              <FaClipboardCheck className="text-xl" />
                                            ) : (
                                              <FaLock className="text-xl" />
                                            )}
                                          </div>

                                          <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="text-xs font-bold uppercase tracking-wide text-blue-700">
                                                Avaliação {numeroAvaliacao}
                                              </span>

                                              {avaliacao.estado === "APROVADA" && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                                  <FaCheckCircle /> Aprovada
                                                </span>
                                              )}

                                              {avaliacao.estado === "NAO_APROVADA" && (
                                                <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">
                                                  Não aprovada
                                                </span>
                                              )}

                                              {avaliacao.estado === "EM_PROGRESSO" && (
                                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                                                  Em progresso
                                                </span>
                                              )}
                                            </div>

                                            <h4 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                                              {avaliacao.questionario.titulo}
                                            </h4>

                                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                              {avaliacao.questionario.descricao}
                                            </p>

                                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
                                              <span>{avaliacao.totalPerguntas} {avaliacao.totalPerguntas === 1 ? "pergunta" : "perguntas"}</span>
                                              <span>Aprovação: {avaliacao.questionario.pontuacao_minima}%</span>
                                              {avaliacao.estado !== "NAO_INICIADA" && (
                                                <span>Resultado: {avaliacao.percentagem}%</span>
                                              )}
                                              <span>Tentativa: {avaliacao.tentativa && avaliacao.tentativa > 0 ? avaliacao.tentativa : 1}</span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="shrink-0">
                                          {avaliacaoDesbloqueada ? (
                                            <Link
                                              href={`/dashboard/avaliacoes/${avaliacao.questionario.id}`}
                                              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition sm:w-auto ${
                                                avaliacao.estado === "APROVADA"
                                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                  : "bg-blue-800 text-white shadow-sm hover:bg-blue-900"
                                              }`}
                                            >
                                              {avaliacao.estado === "APROVADA" ? (
                                                <><FaCheckCircle /> Ver avaliação</>
                                              ) : (
                                                <><FaClipboardCheck /> {avaliacao.estado === "NAO_APROVADA" ? "Tentar novamente" : "Iniciar avaliação"}</>
                                              )}
                                            </Link>
                                          ) : (
                                            <div className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-400 sm:w-auto">
                                              <FaLock /> Avaliação bloqueada
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {avaliacao.estado !== "NAO_INICIADA" && (
                                      <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
                                        <div className="flex items-center justify-between text-xs font-semibold">
                                          <span className="text-slate-500">Progresso da avaliação</span>
                                          <span className="text-blue-800">{avaliacao.perguntasRespondidas} de {avaliacao.totalPerguntas} respondidas</span>
                                        </div>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                                          <div
                                            className={`h-full rounded-full transition-all ${avaliacao.estado === "APROVADA" ? "bg-emerald-600" : "bg-blue-700"}`}
                                            style={{
                                              width: `${avaliacao.totalPerguntas > 0 ? Math.round((avaliacao.perguntasRespondidas / avaliacao.totalPerguntas) * 100) : 0}%`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {avaliacoesModulo.length === 0 && (

                            <div className="border-t border-slate-200 px-5 py-5 sm:px-6">

                              <div className="flex items-start gap-3 rounded-xl bg-slate-100 p-4">

                                <FaClipboardCheck className="mt-0.5 shrink-0 text-slate-400" />

                                <div>

                                  <p className="text-sm font-semibold text-slate-600">
                                    Ainda não existe uma avaliação para este módulo.
                                  </p>

                                  <p className="mt-1 text-xs leading-5 text-slate-500">
                                    A avaliação será disponibilizada quando for criada para este módulo.
                                  </p>

                                </div>

                              </div>

                            </div>

                          )}

                        </div>

                      )}

                    </article>
                  );
                }
              )}

            </div>

          )}

        </section>

        {/* ====================================================
            PERCURSO DE CONCLUSÃO
        ==================================================== */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-5 sm:p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                <FaTrophy />
              </div>

              <div>

                <h3 className="text-lg font-bold text-slate-900">
                  Percurso de conclusão do curso
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  O SICSI segue uma sequência obrigatória: conteúdos, avaliações, simulações e, por fim, certificação.
                </p>

              </div>

            </div>

          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">

            <div
              className={`rounded-2xl border p-4 ${
                conteudosCursoConcluidos
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-blue-200 bg-blue-50"
              }`}
            >

              <div className="flex items-center justify-between">

                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Etapa 1
                </span>

                {conteudosCursoConcluidos ? (
                  <FaCheckCircle className="text-emerald-600" />
                ) : (
                  <FaBookOpen className="text-blue-700" />
                )}

              </div>

              <h4 className="mt-3 font-bold text-slate-900">
                Conteúdos
              </h4>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                {conteudosConcluidos} de {totalConteudos} conteúdos concluídos.
              </p>

            </div>

            <div
              className={`rounded-2xl border p-4 ${
                todasAvaliacoesAprovadas
                  ? "border-emerald-200 bg-emerald-50"
                  : conteudosCursoConcluidos
                    ? "border-blue-200 bg-blue-50"
                    : "border-slate-200 bg-slate-50"
              }`}
            >

              <div className="flex items-center justify-between">

                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Etapa 2
                </span>

                {todasAvaliacoesAprovadas ? (
                  <FaCheckCircle className="text-emerald-600" />
                ) : conteudosCursoConcluidos ? (
                  <FaClipboardCheck className="text-blue-700" />
                ) : (
                  <FaLock className="text-slate-400" />
                )}

              </div>

              <h4 className="mt-3 font-bold text-slate-900">
                Avaliações
              </h4>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                {avaliacoesAprovadas} de {totalAvaliacoes} avaliações aprovadas.
              </p>

            </div>

            <div
              className={`rounded-2xl border p-4 ${
                todasSimulacoesConcluidas
                  ? "border-emerald-200 bg-emerald-50"
                  : prontoParaSimulacoes
                    ? "border-blue-200 bg-blue-50"
                    : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Etapa 3
                </span>

                {todasSimulacoesConcluidas ? (
                  <FaCheckCircle className="text-emerald-600" />
                ) : prontoParaSimulacoes ? (
                  <FaClipboardCheck className="text-blue-700" />
                ) : (
                  <FaLock className="text-slate-400" />
                )}
              </div>

              <h4 className="mt-3 font-bold text-slate-900">
                Simulações
              </h4>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                {simulacoes.length === 0
                  ? "Este curso ainda não possui simulações."
                  : todasSimulacoesConcluidas
                    ? `${simulacoesConcluidas} de ${simulacoes.length} simulações concluídas.`
                    : prontoParaSimulacoes
                      ? `${simulacoesConcluidas} de ${simulacoes.length} simulações concluídas.`
                      : "Conclua e aprove todas as avaliações primeiro."}
              </p>

              {prontoParaSimulacoes && simulacoes.length > 0 && (
                <Link
                  href={`/dashboard/simulacoes?curso=${idCurso}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-900"
                >
                  <FaPlayCircle />
                  {todasSimulacoesConcluidas
                    ? "Rever simulações"
                    : "Ir para simulações"}
                </Link>
              )}
            </div>

            <div
              className={`rounded-2xl border p-4 ${
                prontoParaCertificado
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Etapa 4
                </span>

                {prontoParaCertificado ? (
                  <FaCertificate className="text-emerald-600" />
                ) : (
                  <FaLock className="text-slate-400" />
                )}
              </div>

              <h4 className="mt-3 font-bold text-slate-900">
                Certificado
              </h4>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                {prontoParaCertificado
                  ? certificadoEmitido
                    ? "O seu certificado está disponível."
                    : "Curso concluído. O certificado será emitido agora."
                  : "Conclua todas as simulações com aproveitamento."}
              </p>

              {prontoParaCertificado && (
                <Link
                  href="/dashboard/certificados"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
                >
                  <FaCertificate />
                  Obter certificado
                </Link>
              )}
            </div>

          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">

            <p className="text-xs leading-5 text-slate-500">
              <strong className="text-slate-700">
                Regra do SICSI:
              </strong>{" "}
              concluir o conteúdo não gera automaticamente o certificado. O estudante deverá concluir as avaliações, realizar as simulações e cumprir todos os critérios de conclusão definidos pelo sistema.
            </p>

          </div>

        </section>

        <div className="mt-6 pb-4 text-center text-xs text-slate-400">
          SICSI · Sistema de Consciencialização em
          Segurança da Informação
        </div>

      </div>
    </main>
  );
}
