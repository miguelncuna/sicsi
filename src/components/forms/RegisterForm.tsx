"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserPlus,
} from "react-icons/fa";

export default function RegisterForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [palavraPasse, setPalavraPasse] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function registar() {
    if (!nome || !email || !palavraPasse) {
      alert("Preencha todos os campos.");
      return;
    }

    if (palavraPasse.length < 6) {
      alert("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: palavraPasse,
      });

      if (error) {
        alert(error.message);
        return;
      }

      if (!data.user) {
        alert("Não foi possível criar o utilizador.");
        return;
      }

      const { error: erroPerfil } = await supabase
        .from("perfis")
        .insert({
          id: data.user.id,
          nome_completo: nome,
          email: email,
          papel: "ESTUDANTE",
        });

      if (erroPerfil) {
        alert(erroPerfil.message);
        return;
      }

      alert("Conta criada com sucesso!");

      setNome("");
      setEmail("");
      setPalavraPasse("");
    } catch (erro) {
      alert("Ocorreu um erro inesperado.");
      console.error(erro);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-900 sm:text-4xl">
          Criar conta
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Preencha os seus dados para criar uma conta
        </p>
      </div>

      {/* Nome */}
      <div className="mb-5">
        <label className="mb-2 block font-medium text-gray-700">
          Nome completo
        </label>

        <div className="flex items-center rounded-xl border-2 border-blue-200 px-4 py-3 focus-within:border-blue-600">
          <FaUser className="mr-3 text-blue-700" />

          <input
            type="text"
            placeholder="Digite o seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* E-mail */}
      <div className="mb-5">
        <label className="mb-2 block font-medium text-gray-700">
          E-mail
        </label>

        <div className="flex items-center rounded-xl border-2 border-blue-200 px-4 py-3 focus-within:border-blue-600">
          <FaEnvelope className="mr-3 text-blue-700" />

          <input
            type="email"
            placeholder="Digite o seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Palavra-passe */}
      <div className="mb-6">
        <label className="mb-2 block font-medium text-gray-700">
          Palavra-passe
        </label>

        <div className="flex items-center rounded-xl border-2 border-blue-200 px-4 py-3 focus-within:border-blue-600">
          <FaLock className="mr-3 text-blue-700" />

          <input
            type={mostrarSenha ? "text" : "password"}
            placeholder="Digite a sua palavra-passe"
            value={palavraPasse}
            onChange={(e) => setPalavraPasse(e.target.value)}
            className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
          />

          <button
            type="button"
            onClick={() => setMostrarSenha(!mostrarSenha)}
          >
            {mostrarSenha ? (
              <FaEyeSlash className="text-blue-700" />
            ) : (
              <FaEye className="text-blue-700" />
            )}
          </button>
        </div>
      </div>

      {/* Botão */}
      <button
        onClick={registar}
        disabled={carregando}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
      >
        <FaUserPlus />

        {carregando ? "A criar..." : "Registar"}
      </button>

      <p className="mt-6 text-center text-sm text-gray-500">
        Já tem uma conta?

        <span className="ml-1 cursor-pointer font-semibold text-blue-700">
          Iniciar sessão
        </span>
      </p>
    </div>
  );
}