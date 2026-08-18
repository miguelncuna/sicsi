"use client";

import { FormEvent, useState } from "react";
import { criarFeedback } from "@/app/dashboard/feedbacks/accoes";

type TipoFeedback = "curso" | "conteudo" | "geral";

type FormularioFeedbackProps = {
  tipo: TipoFeedback;
  cursoId?: number | null;
  conteudoId?: number | null;
  titulo?: string;
  descricao?: string;
};

export default function FormularioFeedback({
  tipo,
  cursoId = null,
  conteudoId = null,
  titulo = "Como foi a sua experiência?",
  descricao = "A sua opinião ajuda-nos a melhorar o SICSI.",
}: FormularioFeedbackProps) {
  const [classificacao, setClassificacao] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setMensagem("");
    setSucesso(false);

    if (classificacao < 1 || classificacao > 5) {
      setMensagem(
        "Seleccione uma classificação entre 1 e 5 estrelas."
      );
      return;
    }

    if (!comentario.trim()) {
      setMensagem(
        "Escreva um comentário antes de enviar."
      );
      return;
    }

    setEnviando(true);

    try {
      const resultado = await criarFeedback(
        tipo,
        classificacao,
        comentario,
        cursoId,
        conteudoId
      );

      if (!resultado.sucesso) {
        setMensagem(resultado.mensagem);
        return;
      }

      setSucesso(true);
      setMensagem(resultado.mensagem);

      setClassificacao(0);
      setComentario("");
    } catch (erro) {
      console.error(
        "Erro ao enviar feedback:",
        erro
      );

      setMensagem(
        "Ocorreu um erro inesperado ao enviar o feedback."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          {titulo}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {descricao}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* =====================================================
            CLASSIFICAÇÃO
        ====================================================== */}

        <div>
          <label className="mb-3 block text-sm font-semibold text-slate-800">
            Classificação
          </label>

          <div
            className="flex items-center gap-2"
            role="radiogroup"
            aria-label="Classificação"
          >
            {[1, 2, 3, 4, 5].map(
              (estrela) => (
                <button
                  key={estrela}
                  type="button"
                  onClick={() =>
                    setClassificacao(estrela)
                  }
                  disabled={enviando}
                  aria-label={`${estrela} ${
                    estrela === 1
                      ? "estrela"
                      : "estrelas"
                  }`}
                  aria-pressed={
                    classificacao === estrela
                  }
                  className={`text-3xl transition-transform duration-150 hover:scale-110 disabled:cursor-not-allowed ${
                    estrela <= classificacao
                      ? "text-yellow-400"
                      : "text-slate-300"
                  }`}
                >
                  ★
                </button>
              )
            )}

            <span className="ml-2 text-sm text-slate-500">
              {classificacao > 0
                ? `${classificacao}/5`
                : "Seleccione uma classificação"}
            </span>
          </div>
        </div>

        {/* =====================================================
            COMENTÁRIO
        ====================================================== */}

        <div>
          <label
            htmlFor="feedback-comentario"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Comentário
          </label>

          <textarea
            id="feedback-comentario"
            value={comentario}
            onChange={(evento) =>
              setComentario(
                evento.target.value
              )
            }
            disabled={enviando}
            maxLength={2000}
            rows={5}
            placeholder="Conte-nos o que achou desta experiência..."
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
          />

          <div className="mt-2 flex justify-end">
            <span className="text-xs text-slate-400">
              {comentario.length}/2000
            </span>
          </div>
        </div>

        {/* =====================================================
            MENSAGEM
        ====================================================== */}

        {mensagem && (
          <div
            role="alert"
            className={`rounded-xl px-4 py-3 text-sm ${
              sucesso
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {mensagem}
          </div>
        )}

        {/* =====================================================
            BOTÃO
        ====================================================== */}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={enviando}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando
              ? "A enviar..."
              : "Enviar feedback"}
          </button>
        </div>
      </form>
    </section>
  );
}