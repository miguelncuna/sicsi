"use client";

import { ChangeEvent, useState } from "react";
import { criarClienteSupabase } from "@/lib/supabase/client";

interface UploadFotoPerfilProps {
  utilizadorId: string;
}

type TipoMensagem = "sucesso" | "erro" | null;

export default function UploadFotoPerfil({
  utilizadorId,
}: UploadFotoPerfilProps) {
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] =
    useState<TipoMensagem>(null);

  function mostrarMensagem(
    tipo: "sucesso" | "erro",
    texto: string
  ) {
    setTipoMensagem(tipo);
    setMensagem(texto);

    window.setTimeout(() => {
      setMensagem("");
      setTipoMensagem(null);
    }, 5000);
  }

  async function carregarFoto(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    const ficheiro = evento.target.files?.[0];

    if (!ficheiro) {
      return;
    }

    setMensagem("");
    setTipoMensagem(null);
    setCarregando(true);

    try {
      const supabase = criarClienteSupabase();

      // ==========================================================
      // UTILIZADOR AUTENTICADO
      // ==========================================================

      const {
        data: { user },
        error: erroUtilizador,
      } = await supabase.auth.getUser();

      if (erroUtilizador || !user) {
        throw new Error(
          "Não foi possível identificar a sua conta."
        );
      }

      // ==========================================================
      // SEGURANÇA
      // ==========================================================

      if (user.id !== utilizadorId) {
        throw new Error(
          "Não tem permissão para alterar esta fotografia."
        );
      }

      // ==========================================================
      // VALIDAR FICHEIRO
      // ==========================================================

      const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!tiposPermitidos.includes(ficheiro.type)) {
        throw new Error(
          "Formato inválido. Utilize JPG, PNG ou WEBP."
        );
      }

      const tamanhoMaximo = 5 * 1024 * 1024;

      if (ficheiro.size > tamanhoMaximo) {
        throw new Error(
          "A fotografia deve ter no máximo 5 MB."
        );
      }

      // ==========================================================
      // EXTENSÃO
      // ==========================================================

      let extensao = "jpg";

      if (ficheiro.type === "image/png") {
        extensao = "png";
      }

      if (ficheiro.type === "image/webp") {
        extensao = "webp";
      }

      // ==========================================================
      // CAMINHO DO FICHEIRO
      // ==========================================================

      const nomeFicheiro =
        `${user.id}/perfil-${Date.now()}.${extensao}`;

      // ==========================================================
      // UPLOAD
      // ==========================================================

      const {
        error: erroUpload,
      } = await supabase.storage
        .from("avatars")
        .upload(
          nomeFicheiro,
          ficheiro,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: ficheiro.type,
          }
        );

      if (erroUpload) {
        console.error(
          "Erro no upload:",
          erroUpload
        );

        throw new Error(
          "Não foi possível carregar a fotografia."
        );
      }

      // ==========================================================
      // URL PÚBLICA
      // ==========================================================

      const {
        data: dadosUrl,
      } = supabase.storage
        .from("avatars")
        .getPublicUrl(nomeFicheiro);

      const urlFotografia =
        dadosUrl?.publicUrl;

      if (!urlFotografia) {
        throw new Error(
          "Não foi possível obter o endereço da fotografia."
        );
      }

      // ==========================================================
      // ACTUALIZAR PERFIL
      // ==========================================================

      const {
        data: perfilAtualizado,
        error: erroAtualizacao,
      } = await supabase
        .from("perfis")
        .update({
          foto_url: urlFotografia,
        })
        .eq("id", user.id)
        .select("id, foto_url")
        .single();

      if (erroAtualizacao) {
        console.error(
          "Erro ao actualizar perfil:",
          erroAtualizacao
        );

        throw new Error(
          "A fotografia foi carregada, mas não foi possível actualizar o seu perfil."
        );
      }

      if (!perfilAtualizado?.foto_url) {
        throw new Error(
          "A fotografia foi carregada, mas o perfil não foi actualizado."
        );
      }

      // ==========================================================
      // SUCESSO
      // ==========================================================

      mostrarMensagem(
        "sucesso",
        "Fotografia de perfil actualizada com sucesso!"
      );

      // Pequeno atraso para o estudante visualizar a mensagem
      window.setTimeout(() => {
        window.location.reload();
      }, 1200);

    } catch (erro) {
      console.error(
        "Erro ao actualizar fotografia:",
        erro
      );

      const mensagemErro =
        erro instanceof Error
          ? erro.message
          : "Ocorreu um erro ao actualizar a fotografia.";

      mostrarMensagem(
        "erro",
        mensagemErro
      );

    } finally {
      setCarregando(false);

      evento.target.value = "";
    }
  }

  return (
    <div className="mt-4">

      {/* ========================================================
          MENSAGEM DO SISTEMA
      ======================================================== */}

      {mensagem && (
        <div
          className={`mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
            tipoMensagem === "sucesso"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              tipoMensagem === "sucesso"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {tipoMensagem === "sucesso"
              ? "✓"
              : "!"}
          </div>

          <div className="leading-6">
            {mensagem}
          </div>
        </div>
      )}

      {/* ========================================================
          BOTÃO
      ======================================================== */}

      <label
        className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${
          carregando
            ? "cursor-not-allowed bg-slate-400"
            : "cursor-pointer bg-blue-900 hover:bg-blue-800"
        }`}
      >
        {carregando
          ? "A carregar fotografia..."
          : "Seleccionar fotografia"}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={carregarFoto}
          disabled={carregando}
          className="hidden"
        />
      </label>

      <p className="mt-2 text-xs text-slate-500">
        JPG, PNG ou WEBP · máximo 5 MB
      </p>
    </div>
  );
}