"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaBook,
  FaChevronDown,
  FaChevronRight,
  FaCheckCircle,
  FaEdit,
  FaFileAlt,
  FaLayerGroup,
  FaPlus,
  FaQuestionCircle,
  FaSave,
  FaTrash,
  FaBullseye,
  FaVideo,
  FaSyncAlt,
  FaEye,
  FaEyeSlash,
  FaTimesCircle,
} from "react-icons/fa";
import { supabase } from "@/lib/supabase";

type ToastTipo = "sucesso" | "erro" | "aviso" | "info";

type Curso = {
  id: number;
  titulo: string;
  descricao: string;
  nivel: string;
  ativo: boolean;
  criado_em: string;
};

type Modulo = {
  id: number;
  curso_id: number;
  titulo: string;
  descricao: string;
  ordem: number;
  criado_em?: string;
};

type Conteudo = {
  id: number;
  modulo_id: number;
  titulo: string;
  tipo_conteudo: string;
  conteudo: string;
  ordem: number;
  criado_em?: string;
};

type Questionario = {
  id: number;
  modulo_id: number;
  titulo: string;
  descricao: string;
  pontuacao_minima: number;
  criado_em?: string;
};

type Pergunta = {
  id: number;
  questionario_id: number;
  enunciado: string;
  ordem: number;
  criado_em?: string;
};

type Alternativa = {
  id: number;
  pergunta_id: number;
  texto: string;
  correta: boolean;
  criado_em?: string;
};

type Simulacao = {
  id: number;
  modulo_id: number;
  titulo: string;
  descricao: string;
  nivel: string;
  criado_em?: string;
};

type ModalState = {
  tipo: "curso" | "modulo" | "conteudo" | "pergunta" | "simulacao" | null;
  item?: unknown;
  parentId?: number;
};

export default function CursosAdminPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoAtual, setCursoAtual] = useState<Curso | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [questionarios, setQuestionarios] = useState<Questionario[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [alternativas, setAlternativas] = useState<Alternativa[]>([]);
  const [simulacoes, setSimulacoes] = useState<Simulacao[]>([]);

  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modal, setModal] = useState<ModalState>({ tipo: null });
  const [modulosAbertos, setModulosAbertos] = useState<number[]>([]);
  const [avaliacoesAbertas, setAvaliacoesAbertas] = useState<number[]>([]);

  const [confirmacao, setConfirmacao] = useState<{
    aberto: boolean;
    titulo: string;
    mensagem: string;
    acao?: () => Promise<void>;
  }>({ aberto: false, titulo: "", mensagem: "" });

  const [toast, setToast] = useState<{
    aberto: boolean;
    mensagem: string;
    tipo: ToastTipo;
  }>({ aberto: false, mensagem: "", tipo: "sucesso" });

  function mostrarToast(mensagem: string, tipo: ToastTipo = "sucesso") {
    setToast({ aberto: true, mensagem, tipo });
    window.setTimeout(() => {
      setToast((anterior) => ({ ...anterior, aberto: false }));
    }, 3500);
  }

  function erroSupabase(erro: unknown): string {
    if (erro && typeof erro === "object") {
      const valor = erro as { message?: string; details?: string; hint?: string };
      return [valor.message, valor.details, valor.hint].filter(Boolean).join(" — ");
    }
    return "Erro desconhecido.";
  }

  async function carregarCursos() {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) throw error;
      setCursos((data ?? []) as Curso[]);
    } catch (erro) {
      console.error("carregarCursos:", erro);
      mostrarToast(`Não foi possível carregar os cursos. ${erroSupabase(erro)}`, "erro");
    } finally {
      setCarregando(false);
    }
  }

  /**
   * Carregamento em cadeia:
   * curso -> módulos -> conteúdos/avaliações/simulações -> perguntas -> alternativas.
   * Não fazemos consultas dependentes antes de possuir os IDs necessários.
   */
  async function carregarEstruturaCurso(cursoId: number) {
    try {
      setCarregando(true);

      setModulos([]);
      setConteudos([]);
      setQuestionarios([]);
      setPerguntas([]);
      setAlternativas([]);
      setSimulacoes([]);

      const modulosResultado = await supabase
        .from("modulos")
        .select("*")
        .eq("curso_id", cursoId)
        .order("ordem", { ascending: true });

      if (modulosResultado.error) throw modulosResultado.error;

      const modulosCarregados = (modulosResultado.data ?? []) as Modulo[];
      setModulos(modulosCarregados);

      if (modulosCarregados.length === 0) return;

      const moduloIds = modulosCarregados.map((modulo) => modulo.id);

      const [conteudosResultado, questionariosResultado, simulacoesResultado] =
        await Promise.all([
          supabase
            .from("conteudos")
            .select("*")
            .in("modulo_id", moduloIds)
            .order("ordem", { ascending: true }),
          supabase
            .from("questionarios")
            .select("*")
            .in("modulo_id", moduloIds)
            .order("id", { ascending: true }),
          supabase
            .from("simulacoes")
            .select("*")
            .in("modulo_id", moduloIds)
            .order("id", { ascending: true }),
        ]);

      if (conteudosResultado.error) throw conteudosResultado.error;
      if (questionariosResultado.error) throw questionariosResultado.error;
      if (simulacoesResultado.error) throw simulacoesResultado.error;

      const conteudosCarregados = (conteudosResultado.data ?? []) as Conteudo[];
      const questionariosCarregados = (questionariosResultado.data ?? []) as Questionario[];
      const simulacoesCarregadas = (simulacoesResultado.data ?? []) as Simulacao[];

      setConteudos(conteudosCarregados);
      setQuestionarios(questionariosCarregados);
      setSimulacoes(simulacoesCarregadas);

      if (questionariosCarregados.length === 0) return;

      const questionarioIds = questionariosCarregados.map((item) => item.id);

      const perguntasResultado = await supabase
        .from("perguntas")
        .select("*")
        .in("questionario_id", questionarioIds)
        .order("ordem", { ascending: true });

      if (perguntasResultado.error) throw perguntasResultado.error;

      const perguntasCarregadas = (perguntasResultado.data ?? []) as Pergunta[];
      setPerguntas(perguntasCarregadas);

      if (perguntasCarregadas.length === 0) return;

      const perguntaIds = perguntasCarregadas.map((item) => item.id);

      const alternativasResultado = await supabase
        .from("alternativas")
        .select("*")
        .in("pergunta_id", perguntaIds)
        .order("id", { ascending: true });

      if (alternativasResultado.error) throw alternativasResultado.error;
      setAlternativas((alternativasResultado.data ?? []) as Alternativa[]);
    } catch (erro) {
      console.error("carregarEstruturaCurso:", erro);
      mostrarToast(
        `Não foi possível carregar a estrutura do curso. ${erroSupabase(erro)}`,
        "erro"
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarCursos();
  }, []);

  const cursosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    if (!termo) return cursos;

    return cursos.filter((curso) =>
      [curso.titulo, curso.descricao, curso.nivel]
        .filter(Boolean)
        .some((valor) => valor.toLowerCase().includes(termo))
    );
  }, [cursos, pesquisa]);

  function abrirCurso(curso: Curso) {
    setCursoAtual(curso);
    setModulosAbertos([]);
    setAvaliacoesAbertas([]);
    void carregarEstruturaCurso(curso.id);
  }

  function voltarCursos() {
    if (guardando) return;
    setCursoAtual(null);
    setModulos([]);
    setConteudos([]);
    setQuestionarios([]);
    setPerguntas([]);
    setAlternativas([]);
    setSimulacoes([]);
  }

  function abrirModal(tipo: ModalState["tipo"], item?: unknown, parentId?: number) {
    setModal({ tipo, item, parentId });
  }

  function fecharModal() {
    if (guardando) return;
    setModal({ tipo: null });
  }

  async function guardarCurso(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const titulo = String(dados.get("titulo") ?? "").trim();
    const descricao = String(dados.get("descricao") ?? "").trim();
    const nivel = String(dados.get("nivel") ?? "Básico");

    if (!titulo) {
      mostrarToast("Informe o título do curso.", "aviso");
      return;
    }

    try {
      setGuardando(true);
      const existente = modal.item as Curso | undefined;

      if (existente) {
        const { data, error } = await supabase
          .from("cursos")
          .update({ titulo, descricao, nivel })
          .eq("id", existente.id)
          .select()
          .single();
        if (error) throw error;

        const actualizado = data as Curso;
        setCursos((lista) => lista.map((item) => (item.id === actualizado.id ? actualizado : item)));
        if (cursoAtual?.id === actualizado.id) setCursoAtual(actualizado);
        mostrarToast("Curso actualizado com sucesso.");
      } else {
        const { data, error } = await supabase
          .from("cursos")
          .insert({ titulo, descricao, nivel, ativo: false })
          .select()
          .single();
        if (error) throw error;

        setCursos((lista) => [data as Curso, ...lista]);
        mostrarToast("Curso criado como rascunho.");
      }

      fecharModal();
    } catch (erro) {
      console.error("guardarCurso:", erro);
      mostrarToast(`Não foi possível guardar o curso. ${erroSupabase(erro)}`, "erro");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarModulo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!cursoAtual) return;

    const dados = new FormData(evento.currentTarget);
    const titulo = String(dados.get("titulo") ?? "").trim();
    const descricao = String(dados.get("descricao") ?? "").trim();

    if (!titulo) {
      mostrarToast("Informe o título do módulo.", "aviso");
      return;
    }

    try {
      setGuardando(true);
      const existente = modal.item as Modulo | undefined;

      if (existente) {
        const { data, error } = await supabase
          .from("modulos")
          .update({ titulo, descricao })
          .eq("id", existente.id)
          .select()
          .single();
        if (error) throw error;

        setModulos((lista) => lista.map((item) => (item.id === existente.id ? (data as Modulo) : item)));
        mostrarToast("Módulo actualizado com sucesso.");
      } else {
        const ordem = modulos.length ? Math.max(...modulos.map((item) => item.ordem)) + 1 : 1;
        const { data, error } = await supabase
          .from("modulos")
          .insert({ curso_id: cursoAtual.id, titulo, descricao, ordem })
          .select()
          .single();
        if (error) throw error;

        setModulos((lista) => [...lista, data as Modulo]);
        mostrarToast("Módulo criado com sucesso.");
      }

      fecharModal();
    } catch (erro) {
      console.error("guardarModulo:", erro);
      mostrarToast(`Não foi possível guardar o módulo. ${erroSupabase(erro)}`, "erro");
    } finally {
      setGuardando(false);
    }
  }

  function inferirTipoConteudo(referencia: string): string {
    const valor = referencia.toLowerCase().split("?")[0].split("#")[0];
    if (valor.endsWith(".pdf")) return "PDF";
    if (
      valor.includes("youtube.com") ||
      valor.includes("youtu.be") ||
      valor.includes("vimeo.com") ||
      /\.(mp4|webm|mov|m3u8)$/.test(valor)
    ) return "VIDEO";
    return "TEXTO";
  }

  async function guardarConteudo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const moduloId = Number(modal.parentId);
    const referencia = String(new FormData(evento.currentTarget).get("referencia") ?? "").trim();

    if (!moduloId || !referencia) {
      mostrarToast("Informe o link de referência.", "aviso");
      return;
    }

    try {
      setGuardando(true);
      const existente = modal.item as Conteudo | undefined;
      const tipo = inferirTipoConteudo(referencia);

      if (existente) {
        const { data, error } = await supabase
          .from("conteudos")
          .update({ conteudo: referencia, tipo_conteudo: tipo })
          .eq("id", existente.id)
          .select()
          .single();
        if (error) throw error;

        setConteudos((lista) => lista.map((item) => (item.id === existente.id ? (data as Conteudo) : item)));
        mostrarToast("Conteúdo actualizado com sucesso.");
      } else {
        const doModulo = conteudos.filter((item) => item.modulo_id === moduloId);
        const ordem = doModulo.length ? Math.max(...doModulo.map((item) => item.ordem)) + 1 : 1;

        const { data, error } = await supabase
          .from("conteudos")
          .insert({
            modulo_id: moduloId,
            titulo: `Conteúdo ${ordem}`,
            tipo_conteudo: tipo,
            conteudo: referencia,
            ordem,
          })
          .select()
          .single();
        if (error) throw error;

        setConteudos((lista) => [...lista, data as Conteudo]);
        mostrarToast("Conteúdo criado com sucesso.");
      }

      fecharModal();
    } catch (erro) {
      console.error("guardarConteudo:", erro);
      mostrarToast(`Não foi possível guardar o conteúdo. ${erroSupabase(erro)}`, "erro");
    } finally {
      setGuardando(false);
    }
  }

  async function criarAvaliacao(moduloId: number) {
    if (!moduloId) return;
    if (questionarios.some((item) => item.modulo_id === moduloId)) {
      const existente = questionarios.find((item) => item.modulo_id === moduloId);
      if (existente) setAvaliacoesAbertas((lista) => lista.includes(existente.id) ? lista : [...lista, existente.id]);
      return;
    }

    try {
      setGuardando(true);
      const modulo = modulos.find((item) => item.id === moduloId);

      const { data, error } = await supabase
        .from("questionarios")
        .insert({
          modulo_id: moduloId,
          titulo: modulo ? `Avaliação — ${modulo.titulo}` : "Avaliação do módulo",
          descricao: "Avaliação de conhecimentos do módulo.",
          pontuacao_minima: 70,
        })
        .select()
        .single();
      if (error) throw error;

      const avaliacao = data as Questionario;
      setQuestionarios((lista) => [...lista, avaliacao]);
      setAvaliacoesAbertas((lista) => [...lista, avaliacao.id]);
      mostrarToast("Avaliação criada. Adicione as perguntas.");
    } catch (erro) {
      console.error("criarAvaliacao:", erro);
      mostrarToast(`Não foi possível criar a avaliação. ${erroSupabase(erro)}`, "erro");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarPergunta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const questionarioId = Number(modal.parentId);
    const dados = new FormData(evento.currentTarget);
    const enunciado = String(dados.get("enunciado") ?? "").trim();
    const textos = [1, 2, 3, 4].map((numero) => String(dados.get(`alternativa_${numero}`) ?? "").trim());
    const correcta = Number(dados.get("correcta") ?? 0);

    if (!questionarioId || !enunciado) {
      mostrarToast("Informe a pergunta.", "aviso");
      return;
    }
    if (textos.some((texto) => !texto)) {
      mostrarToast("Preencha as 4 alternativas.", "aviso");
      return;
    }
    if (![1, 2, 3, 4].includes(correcta)) {
      mostrarToast("Seleccione a resposta correcta.", "aviso");
      return;
    }

    try {
      setGuardando(true);
      const existente = modal.item as Pergunta | undefined;

      if (existente) {
        const { data: pergunta, error: erroPergunta } = await supabase
          .from("perguntas")
          .update({ enunciado })
          .eq("id", existente.id)
          .select()
          .single();
        if (erroPergunta) throw erroPergunta;

        const existentes = alternativas
          .filter((item) => item.pergunta_id === existente.id)
          .sort((a, b) => a.id - b.id);

        if (existentes.length !== 4) {
          throw new Error("A pergunta existente não possui exactamente 4 alternativas na base de dados.");
        }

        for (let indice = 0; indice < 4; indice += 1) {
          const { data: alternativa, error } = await supabase
            .from("alternativas")
            .update({ texto: textos[indice], correta: correcta === indice + 1 })
            .eq("id", existentes[indice].id)
            .select()
            .single();
          if (error) throw error;

          setAlternativas((lista) => lista.map((item) => item.id === existentes[indice].id ? alternativa as Alternativa : item));
        }

        setPerguntas((lista) => lista.map((item) => item.id === existente.id ? pergunta as Pergunta : item));
        mostrarToast("Pergunta actualizada com sucesso.");
      } else {
        const doQuestionario = perguntas.filter((item) => item.questionario_id === questionarioId);
        const ordem = doQuestionario.length ? Math.max(...doQuestionario.map((item) => item.ordem)) + 1 : 1;

        const { data: pergunta, error: erroPergunta } = await supabase
          .from("perguntas")
          .insert({ questionario_id: questionarioId, enunciado, ordem })
          .select()
          .single();
        if (erroPergunta) throw erroPergunta;

        const perguntaCriada = pergunta as Pergunta;
        const payload = textos.map((texto, indice) => ({
          pergunta_id: perguntaCriada.id,
          texto,
          correta: correcta === indice + 1,
        }));

        const { data: novasAlternativas, error: erroAlternativas } = await supabase
          .from("alternativas")
          .insert(payload)
          .select();
        if (erroAlternativas) {
          // Evita deixar uma pergunta órfã se a criação das alternativas falhar.
          await supabase.from("perguntas").delete().eq("id", perguntaCriada.id);
          throw erroAlternativas;
        }

        setPerguntas((lista) => [...lista, perguntaCriada]);
        setAlternativas((lista) => [...lista, ...((novasAlternativas ?? []) as Alternativa[])]);
        mostrarToast("Pergunta criada com as 4 alternativas.");
      }

      fecharModal();
    } catch (erro) {
      console.error("guardarPergunta:", erro);
      mostrarToast(`Não foi possível guardar a pergunta. ${erroSupabase(erro)}`, "erro");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarSimulacao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const moduloId = Number(modal.parentId);
    const dados = new FormData(evento.currentTarget);
    const titulo = String(dados.get("titulo") ?? "").trim();
    const descricao = String(dados.get("descricao") ?? "").trim();
    const nivel = String(dados.get("nivel") ?? "MÉDIO");

    if (!moduloId || !titulo) {
      mostrarToast("Informe o título da simulação.", "aviso");
      return;
    }

    try {
      setGuardando(true);
      const existente = modal.item as Simulacao | undefined;

      if (existente) {
        const { data, error } = await supabase
          .from("simulacoes")
          .update({ titulo, descricao, nivel })
          .eq("id", existente.id)
          .select()
          .single();
        if (error) throw error;

        setSimulacoes((lista) => lista.map((item) => item.id === existente.id ? data as Simulacao : item));
        mostrarToast("Simulação actualizada com sucesso.");
      } else {
        const { data, error } = await supabase
          .from("simulacoes")
          .insert({ modulo_id: moduloId, titulo, descricao, nivel })
          .select()
          .single();
        if (error) throw error;

        setSimulacoes((lista) => [...lista, data as Simulacao]);
        mostrarToast("Simulação criada com sucesso.");
      }

      fecharModal();
    } catch (erro) {
      console.error("guardarSimulacao:", erro);
      mostrarToast(`Não foi possível guardar a simulação. ${erroSupabase(erro)}`, "erro");
    } finally {
      setGuardando(false);
    }
  }

  function validarCursoParaPublicacao(): string | null {
    if (!cursoAtual) return "Curso não seleccionado.";
    if (modulos.length === 0) return "Adicione pelo menos um módulo ao curso.";

    for (const modulo of modulos) {
      const conteudosModulo = conteudos.filter((item) => item.modulo_id === modulo.id);
      if (!conteudosModulo.length) return `O módulo “${modulo.titulo}” precisa de pelo menos um conteúdo.`;

      const avaliacao = questionarios.find((item) => item.modulo_id === modulo.id);
      if (!avaliacao) return `O módulo “${modulo.titulo}” precisa de uma avaliação.`;

      const perguntasAvaliacao = perguntas.filter((item) => item.questionario_id === avaliacao.id);
      if (!perguntasAvaliacao.length) return `A avaliação de “${modulo.titulo}” precisa de pelo menos uma pergunta.`;

      for (const pergunta of perguntasAvaliacao) {
        const alternativasPergunta = alternativas.filter((item) => item.pergunta_id === pergunta.id);
        if (alternativasPergunta.length !== 4) return `A pergunta “${pergunta.enunciado}” precisa exactamente de 4 alternativas.`;
        if (alternativasPergunta.filter((item) => item.correta).length !== 1) return `A pergunta “${pergunta.enunciado}” precisa de exactamente uma resposta correcta.`;
      }

      const simulacao = simulacoes.find((item) => item.modulo_id === modulo.id);
      if (!simulacao) return `O módulo “${modulo.titulo}” precisa de uma simulação.`;
    }

    return null;
  }

  function pedirPublicacao() {
    const erro = validarCursoParaPublicacao();
    if (erro) {
      mostrarToast(erro, "aviso");
      return;
    }

    setConfirmacao({
      aberto: true,
      titulo: "Publicar curso",
      mensagem: "O curso ficará disponível para os estudantes. Pretende publicar este curso?",
      acao: publicarCurso,
    });
  }

  async function publicarCurso() {
    if (!cursoAtual) return;
    try {
      setGuardando(true);
      const { data, error } = await supabase
        .from("cursos")
        .update({ ativo: true })
        .eq("id", cursoAtual.id)
        .select()
        .single();
      if (error) throw error;

      const actualizado = data as Curso;
      setCursoAtual(actualizado);
      setCursos((lista) => lista.map((item) => item.id === actualizado.id ? actualizado : item));
      mostrarToast("Curso publicado com sucesso.");
    } catch (erro) {
      console.error("publicarCurso:", erro);
      mostrarToast(`Não foi possível publicar o curso. ${erroSupabase(erro)}`, "erro");
    } finally {
      setGuardando(false);
      setConfirmacao((estado) => ({ ...estado, aberto: false }));
    }
  }

  function pedirRetiradaPublicacao() {
    setConfirmacao({
      aberto: true,
      titulo: "Retirar curso da publicação",
      mensagem: "O curso voltará ao estado de rascunho e deixará de aparecer como disponível para os estudantes. Pretende continuar?",
      acao: retirarPublicacao,
    });
  }

  async function retirarPublicacao() {
    if (!cursoAtual) return;
    try {
      setGuardando(true);
      const { data, error } = await supabase
        .from("cursos")
        .update({ ativo: false })
        .eq("id", cursoAtual.id)
        .select()
        .single();
      if (error) throw error;

      const actualizado = data as Curso;
      setCursoAtual(actualizado);
      setCursos((lista) => lista.map((item) => item.id === actualizado.id ? actualizado : item));
      mostrarToast("Curso colocado novamente em rascunho.");
    } catch (erro) {
      console.error("retirarPublicacao:", erro);
      mostrarToast(`Não foi possível alterar o estado do curso. ${erroSupabase(erro)}`, "erro");
    } finally {
      setGuardando(false);
      setConfirmacao((estado) => ({ ...estado, aberto: false }));
    }
  }

  type TabelaAdmin = "cursos" | "modulos" | "conteudos" | "questionarios" | "perguntas" | "simulacoes";

  async function eliminarRegisto(tabela: TabelaAdmin, id: number) {
    const { error } = await supabase.from(tabela).delete().eq("id", id);
    if (error) throw error;
  }

  function pedirEliminacao(
    tabela: TabelaAdmin,
    id: number,
    nome: string
  ) {
    setConfirmacao({
      aberto: true,
      titulo: `Eliminar ${nome}`,
      mensagem: `Tem a certeza que pretende eliminar ${nome}? Esta operação não poderá ser desfeita.`,
      acao: async () => {
        try {
          setGuardando(true);

          // As relações existentes na base de dados tratam dos filhos quando houver ON DELETE CASCADE.
          // No estado local limpamos também os descendentes para não mostrar dados que já não existem.
          await eliminarRegisto(tabela, id);

          if (tabela === "cursos") {
            setCursos((lista) => lista.filter((item) => item.id !== id));
            if (cursoAtual?.id === id) voltarCursos();
          }

          if (tabela === "modulos") {
            const questionariosIds = questionarios.filter((item) => item.modulo_id === id).map((item) => item.id);
            const perguntasIds = perguntas.filter((item) => questionariosIds.includes(item.questionario_id)).map((item) => item.id);
            setModulos((lista) => lista.filter((item) => item.id !== id));
            setConteudos((lista) => lista.filter((item) => item.modulo_id !== id));
            setQuestionarios((lista) => lista.filter((item) => item.modulo_id !== id));
            setPerguntas((lista) => lista.filter((item) => !questionariosIds.includes(item.questionario_id)));
            setAlternativas((lista) => lista.filter((item) => !perguntasIds.includes(item.pergunta_id)));
            setSimulacoes((lista) => lista.filter((item) => item.modulo_id !== id));
          }

          if (tabela === "conteudos") setConteudos((lista) => lista.filter((item) => item.id !== id));

          if (tabela === "questionarios") {
            const perguntasIds = perguntas.filter((item) => item.questionario_id === id).map((item) => item.id);
            setQuestionarios((lista) => lista.filter((item) => item.id !== id));
            setPerguntas((lista) => lista.filter((item) => item.questionario_id !== id));
            setAlternativas((lista) => lista.filter((item) => !perguntasIds.includes(item.pergunta_id)));
          }

          if (tabela === "perguntas") {
            setPerguntas((lista) => lista.filter((item) => item.id !== id));
            setAlternativas((lista) => lista.filter((item) => item.pergunta_id !== id));
          }

          if (tabela === "simulacoes") setSimulacoes((lista) => lista.filter((item) => item.id !== id));

          mostrarToast(`${nome.charAt(0).toUpperCase()}${nome.slice(1)} eliminado com sucesso.`);
        } catch (erro) {
          console.error("eliminarRegisto:", erro);
          mostrarToast(`Não foi possível eliminar ${nome}. ${erroSupabase(erro)}`, "erro");
        } finally {
          setGuardando(false);
          setConfirmacao((estado) => ({ ...estado, aberto: false }));
        }
      },
    });
  }

  function alternarModulo(id: number) {
    setModulosAbertos((lista) => lista.includes(id) ? lista.filter((item) => item !== id) : [...lista, id]);
  }

  function alternarAvaliacao(id: number) {
    setAvaliacoesAbertas((lista) => lista.includes(id) ? lista.filter((item) => item !== id) : [...lista, id]);
  }

  if (!cursoAtual) {
    return (
      <main className="min-h-screen bg-slate-50 p-5 text-slate-900 md:p-8">
        <ToastUI {...toast} aoFechar={() => setToast((estado) => ({ ...estado, aberto: false }))} />
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
                  <FaBook />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Gestão de Cursos</h1>
                  <p className="mt-1 text-sm text-slate-500">Curso → Módulos → Conteúdos → Avaliação → Simulação</p>
                </div>
              </div>
              <button type="button" onClick={() => abrirModal("curso")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">
                <FaPlus /> Novo curso
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input value={pesquisa} onChange={(evento) => setPesquisa(evento.target.value)} placeholder="Pesquisar cursos..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:bg-white md:max-w-md" />
              <button type="button" onClick={() => void carregarCursos()} disabled={carregando} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                <FaSyncAlt className={carregando ? "animate-spin" : ""} /> Actualizar
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{cursos.length} cursos</Badge>
              <Badge verde>{cursos.filter((curso) => curso.ativo).length} publicados</Badge>
              <Badge>{cursos.filter((curso) => !curso.ativo).length} rascunhos</Badge>
            </div>
          </section>

          {carregando ? (
            <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white"><FaSyncAlt className="animate-spin text-xl text-blue-700" /></div>
          ) : cursosFiltrados.length === 0 ? (
            <EmptyState texto={pesquisa ? "Nenhum curso encontrado." : "Ainda não existem cursos."} botao={!pesquisa} aoClicar={() => abrirModal("curso")} />
          ) : (
            <section className="grid gap-4">
              {cursosFiltrados.map((curso) => (
                <article key={curso.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold">{curso.titulo}</h2>
                        <Status publicado={curso.ativo} />
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{curso.nivel}</span>
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{curso.descricao || "Sem descrição definida."}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => abrirModal("curso", curso)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><FaEdit /> Editar</button>
                      <button type="button" onClick={() => abrirCurso(curso)} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"><FaLayerGroup /> Gerir curso</button>
                      <button type="button" onClick={() => pedirEliminacao("cursos", curso.id, "curso")} className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50" title="Eliminar curso"><FaTrash /></button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>

        <Modal aberto={modal.tipo === "curso"} titulo={modal.item ? "Editar curso" : "Novo curso"} aoFechar={fecharModal}>
          <form onSubmit={guardarCurso} className="space-y-5">
            <Campo nome="titulo" etiqueta="Título" valor={modal.item ? (modal.item as Curso).titulo : ""} required />
            <CampoArea nome="descricao" etiqueta="Descrição" valor={modal.item ? (modal.item as Curso).descricao : ""} />
            <Select nome="nivel" etiqueta="Nível" valor={modal.item ? (modal.item as Curso).nivel : "Básico"} opcoes={["Básico", "Intermédio", "Avançado"]} />
            <BotoesModal aGuardar={guardando} texto={modal.item ? "Guardar alterações" : "Criar curso"} aoCancelar={fecharModal} />
          </form>
        </Modal>

        <Confirmacao estado={confirmacao} guardando={guardando} aoCancelar={() => setConfirmacao((estado) => ({ ...estado, aberto: false }))} />
      </main>
    );
  }

  const totalConteudos = conteudos.length;
  const totalAvaliacoes = questionarios.length;
  const totalSimulacoes = simulacoes.length;

  return (
    <main className="min-h-screen bg-slate-50 p-5 text-slate-900 md:p-8">
      <ToastUI {...toast} aoFechar={() => setToast((estado) => ({ ...estado, aberto: false }))} />
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <button type="button" onClick={voltarCursos} className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50" title="Voltar"><FaArrowLeft /></button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold">{cursoAtual.titulo}</h1>
                  <Status publicado={cursoAtual.ativo} />
                </div>
                <p className="mt-1 text-sm text-slate-500">Gestão sequencial do conteúdo do curso.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {cursoAtual.ativo ? (
                <button type="button" onClick={pedirRetiradaPublicacao} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100"><FaEyeSlash /> Retirar da publicação</button>
              ) : (
                <button type="button" onClick={pedirPublicacao} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"><FaEye /> Publicar curso</button>
              )}
              <button type="button" onClick={() => void carregarEstruturaCurso(cursoAtual.id)} disabled={carregando} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><FaSyncAlt className={carregando ? "animate-spin" : ""} /> Actualizar</button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Resumo titulo="Módulos" valor={modulos.length} />
            <Resumo titulo="Conteúdos" valor={totalConteudos} />
            <Resumo titulo="Avaliações" valor={totalAvaliacoes} />
            <Resumo titulo="Simulações" valor={totalSimulacoes} />
          </div>
        </section>

        {carregando ? (
          <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white"><div className="text-center"><FaSyncAlt className="mx-auto animate-spin text-xl text-blue-700" /><p className="mt-3 text-sm text-slate-500">A carregar estrutura...</p></div></div>
        ) : (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Estrutura do curso</h2>
                <p className="mt-1 text-xs text-slate-500">Cada módulo segue a mesma sequência: conteúdo, avaliação e simulação.</p>
              </div>
              <button type="button" onClick={() => abrirModal("modulo")} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"><FaPlus /> Novo módulo</button>
            </div>

            {modulos.length === 0 ? (
              <EmptyState texto="Este curso ainda não possui módulos." botao aoClicar={() => abrirModal("modulo")} />
            ) : (
              <div className="space-y-4">
                {modulos.map((modulo, moduloIndex) => {
                  const aberto = modulosAbertos.includes(modulo.id);
                  const conteudosModulo = conteudos.filter((item) => item.modulo_id === modulo.id).sort((a, b) => a.ordem - b.ordem);
                  const avaliacao = questionarios.find((item) => item.modulo_id === modulo.id);
                  const simulacao = simulacoes.find((item) => item.modulo_id === modulo.id);
                  const perguntasAvaliacao = avaliacao ? perguntas.filter((item) => item.questionario_id === avaliacao.id).sort((a, b) => a.ordem - b.ordem) : [];

                  return (
                    <article key={modulo.id} className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-3 bg-slate-50 p-4">
                        <button type="button" onClick={() => alternarModulo(modulo.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm hover:text-blue-800">
                          {aberto ? <FaChevronDown /> : <FaChevronRight />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-800">MÓDULO {moduloIndex + 1}</span>
                            <h3 className="truncate text-sm font-bold">{modulo.titulo}</h3>
                          </div>
                          {modulo.descricao && <p className="mt-1 truncate text-xs text-slate-500">{modulo.descricao}</p>}
                        </div>
                        <button type="button" onClick={() => abrirModal("modulo", modulo)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-blue-800" title="Editar módulo"><FaEdit /></button>
                        <button type="button" onClick={() => pedirEliminacao("modulos", modulo.id, "módulo")} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar módulo"><FaTrash /></button>
                      </div>

                      {aberto && (
                        <div className="space-y-6 p-5">
                          <Bloco titulo="Conteúdo" icone={<FaFileAlt />} botaoTexto="Adicionar" aoAdicionar={() => abrirModal("conteudo", undefined, modulo.id)}>
                            {conteudosModulo.length === 0 ? <LinhaVazia texto="Nenhum conteúdo adicionado." /> : (
                              <div className="space-y-2">
                                {conteudosModulo.map((conteudo, index) => (
                                  <div key={conteudo.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                                    <TipoConteudoIcon tipo={conteudo.tipo_conteudo} />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-slate-500">Conteúdo {index + 1} · {conteudo.tipo_conteudo}</p>
                                      <a href={conteudo.conteudo} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm font-semibold text-blue-800 hover:underline">{conteudo.conteudo}</a>
                                    </div>
                                    <button type="button" onClick={() => abrirModal("conteudo", conteudo, modulo.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-blue-800" title="Editar conteúdo"><FaEdit /></button>
                                    <button type="button" onClick={() => pedirEliminacao("conteudos", conteudo.id, "conteúdo")} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar conteúdo"><FaTrash /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Bloco>

                          <Bloco titulo="Avaliação" icone={<FaQuestionCircle />} botaoTexto={avaliacao ? "Abrir" : "Criar avaliação"} aoAdicionar={() => {
                            if (!avaliacao) {
                              void criarAvaliacao(modulo.id);
                            } else {
                              alternarAvaliacao(avaliacao.id);
                            }
                          }}>
                            {!avaliacao ? (
                              <LinhaVazia texto="Nenhuma avaliação criada para este módulo." />
                            ) : (
                              <div className="rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3 p-4">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-800"><FaQuestionCircle /></div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold">{avaliacao.titulo}</p>
                                    <p className="mt-1 text-xs text-slate-500">{perguntasAvaliacao.length} pergunta(s) · aprovação {avaliacao.pontuacao_minima}%</p>
                                  </div>
                                  <button type="button" onClick={() => alternarAvaliacao(avaliacao.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-blue-800">{avaliacoesAbertas.includes(avaliacao.id) ? <FaChevronDown /> : <FaChevronRight />}</button>
                                  <button type="button" onClick={() => pedirEliminacao("questionarios", avaliacao.id, "avaliação")} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar avaliação"><FaTrash /></button>
                                </div>

                                {avaliacoesAbertas.includes(avaliacao.id) && (
                                  <div className="border-t border-slate-200 bg-slate-50/50 p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Perguntas</p>
                                      <button type="button" onClick={() => abrirModal("pergunta", undefined, avaliacao.id)} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:text-blue-900"><FaPlus /> Nova pergunta</button>
                                    </div>

                                    {perguntasAvaliacao.length === 0 ? (
                                      <LinhaVazia texto="Adicione a primeira pergunta desta avaliação." />
                                    ) : (
                                      <div className="space-y-3">
                                        {perguntasAvaliacao.map((pergunta) => {
                                          const alternativasPergunta = alternativas.filter((item) => item.pergunta_id === pergunta.id).sort((a, b) => a.id - b.id);
                                          return (
                                            <div key={pergunta.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                              <div className="flex items-start gap-3">
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-sm font-semibold">{pergunta.ordem}. {pergunta.enunciado}</p>
                                                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                    {[0, 1, 2, 3].map((indice) => {
                                                      const alternativa = alternativasPergunta[indice];
                                                      return (
                                                        <div key={indice} className={`rounded-lg border px-3 py-2 text-xs ${alternativa?.correta ? "border-blue-200 bg-blue-50 text-blue-900" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                                                          <span className="mr-2 font-bold">{String.fromCharCode(65 + indice)}.</span>
                                                          {alternativa?.texto ?? "Alternativa em falta"}
                                                          {alternativa?.correta && <FaCheckCircle className="ml-2 inline text-blue-700" />}
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                  <button type="button" onClick={() => abrirModal("pergunta", pergunta, avaliacao.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-blue-800" title="Editar pergunta"><FaEdit /></button>
                                                  <button type="button" onClick={() => pedirEliminacao("perguntas", pergunta.id, "pergunta")} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar pergunta"><FaTrash /></button>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </Bloco>

                          <Bloco titulo="Simulação" icone={<FaBullseye />} botaoTexto={simulacao ? "Editar" : "Criar simulação"} aoAdicionar={() => abrirModal("simulacao", simulacao, modulo.id)}>
                            {!simulacao ? (
                              <LinhaVazia texto="Nenhuma simulação criada para este módulo." />
                            ) : (
                              <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-800"><FaBullseye /></div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold">{simulacao.titulo}</p>
                                  <p className="mt-1 text-xs text-slate-500">Nível: {simulacao.nivel}</p>
                                  {simulacao.descricao && <p className="mt-2 text-xs leading-5 text-slate-500">{simulacao.descricao}</p>}
                                </div>
                                <button type="button" onClick={() => pedirEliminacao("simulacoes", simulacao.id, "simulação")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar simulação"><FaTrash /></button>
                              </div>
                            )}
                          </Bloco>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      <Modal aberto={modal.tipo === "modulo"} titulo={modal.item ? "Editar módulo" : "Novo módulo"} aoFechar={fecharModal}>
        <form onSubmit={guardarModulo} className="space-y-5">
          <Campo nome="titulo" etiqueta="Título" valor={modal.item ? (modal.item as Modulo).titulo : ""} required />
          <CampoArea nome="descricao" etiqueta="Descrição" valor={modal.item ? (modal.item as Modulo).descricao : ""} />
          <BotoesModal aGuardar={guardando} texto={modal.item ? "Guardar alterações" : "Criar módulo"} aoCancelar={fecharModal} />
        </form>
      </Modal>

      <Modal aberto={modal.tipo === "conteudo"} titulo={modal.item ? "Editar conteúdo" : "Novo conteúdo"} aoFechar={fecharModal}>
        <form onSubmit={guardarConteudo} className="space-y-5">
          <Campo nome="referencia" etiqueta="Link de referência" valor={modal.item ? (modal.item as Conteudo).conteudo : ""} required />
          <p className="text-xs leading-5 text-slate-500">O tipo é identificado automaticamente: PDF, vídeo ou texto.</p>
          <BotoesModal aGuardar={guardando} texto={modal.item ? "Guardar alterações" : "Adicionar conteúdo"} aoCancelar={fecharModal} />
        </form>
      </Modal>

      <Modal aberto={modal.tipo === "pergunta"} titulo={modal.item ? "Editar pergunta" : "Nova pergunta"} aoFechar={fecharModal}>
        <form onSubmit={guardarPergunta} className="space-y-5">
          <CampoArea nome="enunciado" etiqueta="Pergunta" valor={modal.item ? (modal.item as Pergunta).enunciado : ""} grande required />
          <div className="space-y-3">
            <div>
              <p className="text-sm font-bold">4 alternativas</p>
              <p className="mt-1 text-xs text-slate-500">Preencha as quatro opções e marque apenas uma como correcta.</p>
            </div>
            {[1, 2, 3, 4].map((numero) => {
              const alternativasPergunta = modal.item ? alternativas.filter((item) => item.pergunta_id === (modal.item as Pergunta).id).sort((a, b) => a.id - b.id) : [];
              const alternativa = alternativasPergunta[numero - 1];
              return (
                <div key={numero} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-500">{String.fromCharCode(64 + numero)}</span>
                  <input name={`alternativa_${numero}`} defaultValue={alternativa?.texto ?? ""} required placeholder={`Alternativa ${numero}`} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600" />
                  <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-600"><input type="radio" name="correcta" value={numero} defaultChecked={Boolean(alternativa?.correta)} className="h-4 w-4 accent-blue-700" /> Correcta</label>
                </div>
              );
            })}
          </div>
          <BotoesModal aGuardar={guardando} texto={modal.item ? "Guardar pergunta" : "Criar pergunta"} aoCancelar={fecharModal} />
        </form>
      </Modal>

      <Modal aberto={modal.tipo === "simulacao"} titulo={modal.item ? "Editar simulação" : "Nova simulação"} aoFechar={fecharModal}>
        <form onSubmit={guardarSimulacao} className="space-y-5">
          <Campo nome="titulo" etiqueta="Título" valor={modal.item ? (modal.item as Simulacao).titulo : ""} required />
          <CampoArea nome="descricao" etiqueta="Descrição" valor={modal.item ? (modal.item as Simulacao).descricao : ""} />
          <Select nome="nivel" etiqueta="Nível" valor={modal.item ? (modal.item as Simulacao).nivel : "MÉDIO"} opcoes={["FÁCIL", "MÉDIO", "DIFÍCIL"]} />
          <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">A simulação não precisa de alternativas ou resposta correcta nesta fase. A configuração da resposta correcta pertence à avaliação.</p>
          <BotoesModal aGuardar={guardando} texto={modal.item ? "Guardar alterações" : "Criar simulação"} aoCancelar={fecharModal} />
        </form>
      </Modal>

      <Confirmacao estado={confirmacao} guardando={guardando} aoCancelar={() => setConfirmacao((estado) => ({ ...estado, aberto: false }))} />
    </main>
  );
}

function Status({ publicado }: { publicado: boolean }) {
  return publicado ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Publicado</span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Rascunho activo</span>
  );
}

function Badge({ children, verde = false }: { children: ReactNode; verde?: boolean }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verde ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-600"}`}>{children}</span>;
}

function Resumo({ titulo, valor }: { titulo: string; valor: number }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">{titulo}</p><p className="mt-1 text-xl font-bold">{valor}</p></div>;
}

function Bloco({ titulo, icone, botaoTexto, aoAdicionar, children }: { titulo: string; icone: ReactNode; botaoTexto: string; aoAdicionar: () => void; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><span className="text-sm text-blue-800">{icone}</span><h3 className="text-sm font-bold">{titulo}</h3></div>
        <button type="button" onClick={aoAdicionar} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:text-blue-900"><FaPlus /> {botaoTexto}</button>
      </div>
      {children}
    </section>
  );
}

function LinhaVazia({ texto }: { texto: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">{texto}</div>;
}

function EmptyState({ texto, botao, aoClicar }: { texto: string; botao?: boolean; aoClicar?: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <FaBook className="mx-auto text-2xl text-slate-300" />
      <p className="mt-3 text-sm text-slate-500">{texto}</p>
      {botao && aoClicar && <button type="button" onClick={aoClicar} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"><FaPlus /> Criar</button>}
    </div>
  );
}

function TipoConteudoIcon({ tipo }: { tipo: string }) {
  return tipo === "VIDEO" ? (
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><FaVideo /></span>
  ) : (
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><FaFileAlt /></span>
  );
}

function Campo({ nome, etiqueta, valor, required = false }: { nome: string; etiqueta: string; valor: string; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{etiqueta}</span><input name={nome} defaultValue={valor} required={required} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:bg-white" /></label>;
}

function CampoArea({ nome, etiqueta, valor, grande = false, required = false }: { nome: string; etiqueta: string; valor: string; grande?: boolean; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{etiqueta}</span><textarea name={nome} defaultValue={valor} required={required} rows={grande ? 6 : 4} className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-600 focus:bg-white" /></label>;
}

function Select({ nome, etiqueta, valor, opcoes }: { nome: string; etiqueta: string; valor: string; opcoes: string[] }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{etiqueta}</span><select name={nome} defaultValue={valor} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:bg-white">{opcoes.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}</select></label>;
}

function BotoesModal({ aGuardar, texto, aoCancelar }: { aGuardar: boolean; texto: string; aoCancelar: () => void }) {
  return <div className="flex justify-end gap-2 border-t border-slate-100 pt-5"><button type="button" onClick={aoCancelar} disabled={aGuardar} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancelar</button><button type="submit" disabled={aGuardar} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{aGuardar ? <FaSyncAlt className="animate-spin" /> : <FaSave />} {texto}</button></div>;
}

function Modal({ aberto, titulo, aoFechar, children }: { aberto: boolean; titulo: string; aoFechar: () => void; children: ReactNode }) {
  if (!aberto) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-xl font-bold">{titulo}</h2><button type="button" onClick={aoFechar} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"><FaTimesCircle /></button></div>{children}</div></div>;
}

function Confirmacao({ estado, guardando, aoCancelar }: { estado: { aberto: boolean; titulo: string; mensagem: string; acao?: () => Promise<void> }; guardando: boolean; aoCancelar: () => void }) {
  if (!estado.aberto) return null;
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-bold">{estado.titulo}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{estado.mensagem}</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={aoCancelar} disabled={guardando} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button><button type="button" onClick={() => void estado.acao?.()} disabled={guardando} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{guardando ? "A processar..." : "Confirmar"}</button></div></div></div>;
}

function ToastUI({ aberto, mensagem, tipo, aoFechar }: { aberto: boolean; mensagem: string; tipo: ToastTipo; aoFechar: () => void }) {
  if (!aberto) return null;
  const classes: Record<ToastTipo, string> = { sucesso: "border-blue-200 bg-blue-50 text-blue-900", erro: "border-red-200 bg-red-50 text-red-800", aviso: "border-amber-200 bg-amber-50 text-amber-800", info: "border-blue-200 bg-blue-50 text-blue-800" };
  return <div className={`fixed right-5 top-5 z-[70] flex max-w-xl items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl ${classes[tipo]}`}><p className="flex-1 leading-5">{mensagem}</p><button type="button" onClick={aoFechar} className="opacity-60 hover:opacity-100">×</button></div>;
}