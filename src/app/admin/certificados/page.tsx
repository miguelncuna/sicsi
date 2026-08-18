"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaCertificate,
  FaSearch,
  FaEye,
  FaDownload,
  FaCheckCircle,
  FaUsers,
  FaBook,
  FaCalendarAlt,
  FaTimes,
} from "react-icons/fa";

type Utilizador = {
  id: string;
  nome_completo: string;
  email: string;
  foto_url: string | null;
};

type Curso = {
  id: number;
  titulo: string;
};

type Certificado = {
  id: number;
  utilizador_id: string;
  curso_id: number;
  data_emissao: string | null;
  numero: string;
  utilizador: Utilizador;
  curso: Curso;
  estado: "EMITIDO";
};

export default function CertificadosAdminPage() {
  const [certificados, setCertificados] = useState<
    Certificado[]
  >([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const [pesquisa, setPesquisa] =
    useState("");

  const [filtroEstado, setFiltroEstado] =
    useState("TODOS");

  const [
    certificadoSelecionado,
    setCertificadoSelecionado,
  ] = useState<Certificado | null>(null);

  async function carregarCertificados() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        "/api/admin/certificados",
        {
          cache: "no-store",
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok || !resultado.sucesso) {
        throw new Error(
          resultado.erro ||
            "Não foi possível carregar os certificados."
        );
      }

      setCertificados(
        resultado.certificados ?? []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar certificados:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao carregar os certificados."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarCertificados();
  }, []);

  function formatarData(
    data: string | null
  ) {
    if (!data) {
      return "Data não disponível";
    }

    return new Intl.DateTimeFormat(
      "pt-PT",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ).format(new Date(data));
  }

  function formatarDataCurta(
    data: string | null
  ) {
    if (!data) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "pt-PT",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    ).format(new Date(data));
  }

  const certificadosFiltrados =
    useMemo(() => {
      const termo =
        pesquisa.trim().toLowerCase();

      return certificados.filter(
        (certificado) => {
          const correspondePesquisa =
            !termo ||
            certificado.numero
              .toLowerCase()
              .includes(termo) ||
            certificado.utilizador.nome_completo
              .toLowerCase()
              .includes(termo) ||
            certificado.utilizador.email
              .toLowerCase()
              .includes(termo) ||
            certificado.curso.titulo
              .toLowerCase()
              .includes(termo);

          const correspondeEstado =
            filtroEstado === "TODOS" ||
            certificado.estado ===
              filtroEstado;

          return (
            correspondePesquisa &&
            correspondeEstado
          );
        }
      );
    }, [
      certificados,
      pesquisa,
      filtroEstado,
    ]);

  const totalCertificados =
    certificados.length;

  const totalEstudantes = new Set(
    certificados.map(
      (certificado) =>
        certificado.utilizador_id
    )
  ).size;

  const totalCursos = new Set(
    certificados.map(
      (certificado) =>
        certificado.curso_id
    )
  ).size;

  function abrirCertificado(
    certificado: Certificado
  ) {
    setCertificadoSelecionado(
      certificado
    );
  }

  function imprimirCertificado(
    certificado: Certificado
  ) {
    const nome =
      certificado.utilizador.nome_completo ||
      "Estudante SICSI";

    const curso =
      certificado.curso.titulo ||
      `Curso #${certificado.curso_id}`;

    const data =
      formatarData(
        certificado.data_emissao
      );

    const janela = window.open(
      "",
      "_blank",
      "width=1400,height=950"
    );

    if (!janela) {
      alert(
        "Não foi possível abrir o certificado. Permita janelas pop-up no navegador."
      );
      return;
    }

    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>
            ${certificado.numero} - Certificado SICSI
          </title>

          <style>
            @page {
              size: A4 landscape;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              min-height: 100%;
            }

            body {
              background: #e8edf5;
              color: #0f172a;
              font-family:
                "Segoe UI",
                Arial,
                Helvetica,
                sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .pagina {
              width: 297mm;
              min-height: 210mm;
              margin: 24px auto;
              padding: 10mm;
              background: #ffffff;
            }

            .certificado {
              position: relative;
              width: 100%;
              min-height: 190mm;
              overflow: hidden;
              background:
                radial-gradient(
                  circle at 88% 12%,
                  rgba(37, 99, 235, 0.12),
                  transparent 26%
                ),
                radial-gradient(
                  circle at 10% 92%,
                  rgba(16, 185, 129, 0.10),
                  transparent 24%
                ),
                #ffffff;

              border: 1px solid #dbe4f0;

              box-shadow:
                0 18px 50px rgba(
                  15,
                  23,
                  42,
                  0.14
                );
            }

            .faixa-superior {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 8mm;

              background:
                linear-gradient(
                  90deg,
                  #0f2f78 0%,
                  #1d4ed8 52%,
                  #0f8b62 100%
                );
            }

            .faixa-inferior {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 4mm;

              background:
                linear-gradient(
                  90deg,
                  #0f2f78 0%,
                  #1d4ed8 52%,
                  #0f8b62 100%
                );
            }

            .moldura {
              position: absolute;
              inset: 6mm;
              border: 1px solid #b7c6dd;
              pointer-events: none;
            }

            .conteudo {
              position: relative;
              z-index: 2;
              min-height: 190mm;
              padding:
                16mm
                20mm
                12mm
                20mm;

              display: flex;
              flex-direction: column;
            }

            .cabecalho {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }

            .marca {
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .simbolo {
              width: 18mm;
              height: 18mm;
              border-radius: 6mm;

              background:
                linear-gradient(
                  145deg,
                  #0f2f78,
                  #1d4ed8
                );

              color: #ffffff;

              display: flex;
              align-items: center;
              justify-content: center;

              font-size: 28px;
              font-weight: 900;
            }

            .marca-nome {
              color: #0f2f78;
              font-size: 17px;
              font-weight: 900;
              letter-spacing: 2px;
            }

            .marca-sub {
              margin-top: 4px;
              color: #64748b;
              font-size: 8.5px;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
            }

            .estado {
              padding: 8px 13px;
              border-radius: 999px;

              background: #ecfdf5;
              border: 1px solid #bbf7d0;

              color: #047857;

              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
            }

            .titulo {
              margin-top: 18mm;
              text-align: center;
            }

            .titulo-pequeno {
              color: #64748b;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 3px;
              text-transform: uppercase;
            }

            h1 {
              margin: 4mm 0 0;
              color: #0f172a;

              font-family:
                Georgia,
                "Times New Roman",
                serif;

              font-size: 34px;
            }

            .linha {
              width: 48mm;
              height: 2px;
              margin: 5mm auto 0;

              background:
                linear-gradient(
                  90deg,
                  transparent,
                  #1d4ed8,
                  #10b981,
                  transparent
                );
            }

            .intro {
              margin-top: 7mm;
              color: #475569;
              font-size: 12px;
              text-align: center;
            }

            .nome {
              margin-top: 4mm;
              color: #0f2f78;

              font-family:
                Georgia,
                "Times New Roman",
                serif;

              font-size: 31px;
              font-weight: 700;
              text-align: center;
            }

            .curso {
              width: 205mm;
              max-width: 90%;
              margin: 8mm auto 0;
              padding: 6mm 12mm;

              text-align: center;

              background:
                linear-gradient(
                  135deg,
                  #f8fbff,
                  #eef5ff
                );

              border: 1px solid #d7e3f4;
              border-radius: 5mm;
            }

            .curso-label {
              color: #64748b;
              font-size: 8px;
              font-weight: 800;
              letter-spacing: 2px;
              text-transform: uppercase;
            }

            .curso-titulo {
              margin-top: 2mm;
              color: #163b8c;
              font-size: 18px;
              font-weight: 800;
            }

            .mensagem {
              margin: 5mm auto 0;
              max-width: 195mm;
              color: #475569;
              font-size: 10.5px;
              line-height: 1.6;
              text-align: center;
            }

            .dados {
              margin-top: auto;
              padding-top: 6mm;

              display: grid;
              grid-template-columns:
                1fr 1fr 1fr;

              gap: 12mm;
            }

            .campo {
              text-align: center;
            }

            .linha-campo {
              height: 1px;
              margin-bottom: 2.5mm;
              background: #94a3b8;
            }

            .principal {
              color: #1e293b;
              font-size: 9.5px;
              font-weight: 800;
            }

            .secundario {
              margin-top: 1mm;
              color: #64748b;
              font-size: 7.5px;
            }

            .rodape {
              margin-top: 5mm;

              display: flex;
              justify-content: space-between;

              color: #64748b;
              font-size: 7px;
            }

            @media print {
              body {
                background: #ffffff;
              }

              .pagina {
                margin: 0;
              }

              .certificado {
                box-shadow: none;
              }
            }
          </style>
        </head>

        <body>

          <div class="pagina">

            <section class="certificado">

              <div class="faixa-superior"></div>
              <div class="faixa-inferior"></div>
              <div class="moldura"></div>

              <div class="conteudo">

                <header class="cabecalho">

                  <div class="marca">

                    <div class="simbolo">
                      S
                    </div>

                    <div>

                      <div class="marca-nome">
                        SICSI
                      </div>

                      <div class="marca-sub">
                        Sistema de Consciencialização em Segurança da Informação
                      </div>

                    </div>

                  </div>

                  <div class="estado">
                    ✓ Certificação concluída
                  </div>

                </header>

                <section class="titulo">

                  <div class="titulo-pequeno">
                    Certificado de Conclusão
                  </div>

                  <h1>
                    Certificado de Conclusão
                  </h1>

                  <div class="linha"></div>

                  <p class="intro">
                    Certificamos que
                  </p>

                  <div class="nome">
                    ${nome}
                  </div>

                  <p class="intro">
                    concluiu com aproveitamento todas as etapas de formação
                    exigidas pelo Sistema de Consciencialização em Segurança
                    da Informação (SICSI).
                  </p>

                  <div class="curso">

                    <div class="curso-label">
                      Formação concluída
                    </div>

                    <div class="curso-titulo">
                      ${curso}
                    </div>

                  </div>

                  <p class="mensagem">
                    Este certificado reconhece a conclusão da formação,
                    incluindo os conteúdos de aprendizagem, a avaliação de
                    conhecimentos e as simulações de segurança previstas no
                    percurso formativo.
                  </p>

                </section>

                <div class="dados">

                  <div class="campo">

                    <div class="linha-campo"></div>

                    <div class="principal">
                      ${data}
                    </div>

                    <div class="secundario">
                      Data de emissão
                    </div>

                  </div>

                  <div class="campo">

                    <div class="linha-campo"></div>

                    <div class="principal">
                      SICSI
                    </div>

                    <div class="secundario">
                      Entidade emissora
                    </div>

                  </div>

                  <div class="campo">

                    <div class="linha-campo"></div>

                    <div class="principal">
                      ${certificado.numero}
                    </div>

                    <div class="secundario">
                      Número do certificado
                    </div>

                  </div>

                </div>

                <div class="rodape">

                  <span>
                    <strong>SICSI</strong>
                    · Segurança da Informação
                  </span>

                  <span>
                    Emitido em ${formatarDataCurta(
                      certificado.data_emissao
                    )}
                  </span>

                </div>

              </div>

            </section>

          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 500);
            };
          </script>

        </body>
      </html>
    `);

    janela.document.close();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">

      {/* =====================================================
          CABEÇALHO
      ====================================================== */}

      <div className="mb-8">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <FaCertificate />
              </div>

              <div>

                <h1 className="text-2xl font-bold text-slate-900">
                  Certificados
                </h1>

                <p className="text-sm text-slate-500">
                  Gestão dos certificados emitidos pelo SICSI.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          ESTATÍSTICAS
      ====================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Total de certificados
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalCertificados}
              </p>

            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FaCertificate />
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Estudantes certificados
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalEstudantes}
              </p>

            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FaUsers />
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Cursos certificados
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalCursos}
              </p>

            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <FaBook />
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          PESQUISA / FILTROS
      ====================================================== */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row">

          <div className="relative flex-1">

            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={pesquisa}
              onChange={(evento) =>
                setPesquisa(
                  evento.target.value
                )
              }
              placeholder="Pesquisar por estudante, email, curso ou número..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

          </div>

          <select
            value={filtroEstado}
            onChange={(evento) =>
              setFiltroEstado(
                evento.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          >

            <option value="TODOS">
              Todos os estados
            </option>

            <option value="EMITIDO">
              Emitidos
            </option>

          </select>

        </div>

      </div>

      {/* =====================================================
          ERRO
      ====================================================== */}

      {erro && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* =====================================================
          TABELA
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">

          <div>

            <h2 className="font-semibold text-slate-900">
              Certificados emitidos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {certificadosFiltrados.length} certificado
              {certificadosFiltrados.length === 1
                ? ""
                : "s"} encontrado
              {certificadosFiltrados.length === 1
                ? ""
                : "s"}.
            </p>

          </div>

        </div>

        {carregando ? (

          <div className="flex min-h-[300px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="text-sm text-slate-500">
                A carregar certificados...
              </p>

            </div>

          </div>

        ) : certificadosFiltrados.length === 0 ? (

          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FaCertificate />
            </div>

            <h3 className="font-semibold text-slate-900">
              Nenhum certificado encontrado
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Não existem certificados que correspondam aos
              critérios seleccionados.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Certificado
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estudante
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Curso
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Data de emissão
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acções
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {certificadosFiltrados.map(
                  (certificado) => (

                    <tr
                      key={certificado.id}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="px-6 py-4">

                        <p className="font-semibold text-slate-900">
                          {certificado.numero}
                        </p>

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-semibold text-blue-700">

                            {certificado.utilizador.foto_url ? (
                              <img
                                src={
                                  certificado
                                    .utilizador
                                    .foto_url
                                }
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              certificado
                                .utilizador
                                .nome_completo
                                .charAt(0)
                                .toUpperCase()
                            )}

                          </div>

                          <div className="min-w-0">

                            <p className="truncate font-medium text-slate-900">
                              {
                                certificado
                                  .utilizador
                                  .nome_completo
                              }
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {
                                certificado
                                  .utilizador
                                  .email
                              }
                            </p>

                          </div>

                        </div>

                      </td>

                      <td className="px-6 py-4">

                        <p className="max-w-[240px] truncate text-sm font-medium text-slate-800">
                          {
                            certificado.curso
                              .titulo
                          }
                        </p>

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-2 text-sm text-slate-600">

                          <FaCalendarAlt className="text-slate-400" />

                          {formatarDataCurta(
                            certificado.data_emissao
                          )}

                        </div>

                      </td>

                      <td className="px-6 py-4">

                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">

                          <FaCheckCircle />

                          Emitido

                        </span>

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              abrirCertificado(
                                certificado
                              )
                            }
                            title="Visualizar certificado"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <FaEye />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              imprimirCertificado(
                                certificado
                              )
                            }
                            title="Imprimir / emitir PDF"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                          >
                            <FaDownload />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =====================================================
          MODAL DE VISUALIZAÇÃO
      ====================================================== */}

      {certificadoSelecionado && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={() =>
            setCertificadoSelecionado(null)
          }
        >

          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onMouseDown={(evento) =>
              evento.stopPropagation()
            }
          >

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <div className="flex items-center gap-2">

                  <FaCertificate className="text-blue-600" />

                  <h2 className="font-bold text-slate-900">
                    Certificado
                  </h2>

                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {certificadoSelecionado.numero}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setCertificadoSelecionado(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <FaTimes />
              </button>

            </div>

            <div className="space-y-5 p-6">

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                <div className="flex items-center gap-3">

                  <FaCheckCircle className="text-emerald-600" />

                  <div>

                    <p className="font-semibold text-emerald-800">
                      Certificado emitido
                    </p>

                    <p className="text-sm text-emerald-700">
                      Este certificado foi emitido automaticamente
                      após a conclusão do percurso formativo.
                    </p>

                  </div>

                </div>

              </div>

              <div className="grid gap-4 md:grid-cols-2">

                <div className="rounded-xl border border-slate-200 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Número
                  </p>

                  <p className="mt-2 font-bold text-slate-900">
                    {
                      certificadoSelecionado
                        .numero
                    }
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Data de emissão
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {formatarData(
                      certificadoSelecionado
                        .data_emissao
                    )}
                  </p>

                </div>

              </div>

              <div className="rounded-xl border border-slate-200 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Estudante
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {
                    certificadoSelecionado
                      .utilizador
                      .nome_completo
                  }
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    certificadoSelecionado
                      .utilizador
                      .email
                  }
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Curso
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {
                    certificadoSelecionado
                      .curso
                      .titulo
                  }
                </p>

              </div>

            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  setCertificadoSelecionado(
                    null
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() =>
                  imprimirCertificado(
                    certificadoSelecionado
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <FaDownload />
                Imprimir / PDF
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}