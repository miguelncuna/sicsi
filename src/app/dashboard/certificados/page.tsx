"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaCertificate,
  FaBook,
  FaCalendarAlt,
  FaDownload,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
  FaUserGraduate,
  FaShieldAlt,
} from "react-icons/fa";
import { criarClienteSupabase } from "@/lib/supabase/client";

interface Perfil {
  id: string;
  nome_completo: string;
  email: string;
  papel: string;
}

interface Certificado {
  id: number;
  utilizador_id: string;
  curso_id: number;
  data_emissao: string | null;
  curso: {
    id: number;
    titulo: string;
  } | null;
}

export default function CertificadosPage() {
  const router = useRouter();

  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        setErro("");

        const supabase = criarClienteSupabase();

        const {
          data: { user },
          error: erroUtilizador,
        } = await supabase.auth.getUser();

        if (erroUtilizador || !user) {
          router.push("/login");
          return;
        }

        const { data: perfilData, error: perfilError } = await supabase
          .from("perfis")
          .select("id, nome_completo, email, papel")
          .eq("id", user.id)
          .single();

        if (perfilError || !perfilData) {
          console.error(
            "Erro ao carregar perfil:",
            perfilError?.message
          );
          router.push("/login");
          return;
        }

        if (perfilData.papel !== "ESTUDANTE") {
          router.push("/login");
          return;
        }

        setPerfil(perfilData as Perfil);

        const { data, error } = await supabase
          .from("certificados")
          .select(`
            id,
            utilizador_id,
            curso_id,
            data_emissao,
            curso:cursos (
              id,
              titulo
            )
          `)
          .eq("utilizador_id", user.id)
          .order("data_emissao", {
            ascending: false,
          });

        if (error) {
          console.error(
            "Erro ao carregar certificados:",
            error.message
          );

          setErro(
            "Não foi possível carregar os seus certificados."
          );
          return;
        }

        setCertificados(
          (data ?? []) as unknown as Certificado[]
        );
      } catch (error) {
        console.error(
          "Erro inesperado ao carregar certificados:",
          error
        );

        setErro(
          "Ocorreu um erro inesperado ao carregar os certificados."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [router]);

  function formatarData(data: string | null) {
    if (!data) {
      return "Data não disponível";
    }

    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(data));
  }

  function formatarDataCurta(data: string | null) {
    if (!data) {
      return "—";
    }

    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(data));
  }

  function escaparHTML(valor: string) {
    return valor
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function gerarCertificado(certificado: Certificado) {
    const nomeEstudante =
      perfil?.nome_completo?.trim() ||
      "Estudante SICSI";

    const tituloCurso =
      certificado.curso?.titulo?.trim() ||
      "Curso de Segurança da Informação";

    const dataEmissao = formatarData(
      certificado.data_emissao
    );

    const dataCurta = formatarDataCurta(
      certificado.data_emissao
    );

    const numeroCertificado =
      `SICSI-${String(certificado.id).padStart(6, "0")}`;

    const janela = window.open(
      "",
      "_blank",
      "width=1400,height=950"
    );

    if (!janela) {
      alert(
        "Não foi possível abrir o certificado. Permita janelas pop-up no navegador e tente novamente."
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
            Certificado SICSI — ${escaparHTML(tituloCurso)}
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
                0 18px 50px rgba(15, 23, 42, 0.14);
            }

            .moldura-externa {
              position: absolute;
              inset: 6mm;
              border: 1.2px solid #b7c6dd;
              pointer-events: none;
            }

            .moldura-interna {
              position: absolute;
              inset: 8mm;
              border: 0.6px solid #e0e7f1;
              pointer-events: none;
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
              gap: 18px;
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
              box-shadow:
                0 8px 20px rgba(29, 78, 216, 0.24);
            }

            .marca-texto {
              line-height: 1.1;
            }

            .marca-nome {
              color: #0f2f78;
              font-size: 17px;
              font-weight: 900;
              letter-spacing: 2.2px;
            }

            .marca-sub {
              margin-top: 4px;
              color: #64748b;
              font-size: 8.5px;
              font-weight: 700;
              letter-spacing: 1.5px;
              text-transform: uppercase;
            }

            .estado {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              padding: 8px 13px;
              border-radius: 999px;
              background: #ecfdf5;
              border: 1px solid #bbf7d0;
              color: #047857;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .titulo-area {
              margin-top: 12mm;
              text-align: center;
            }

            .titulo-pequeno {
              color: #64748b;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 3.2px;
              text-transform: uppercase;
            }

            h1 {
              margin: 4mm 0 0;
              color: #0f172a;
              font-family: Georgia, "Times New Roman", serif;
              font-size: 34px;
              line-height: 1.05;
              letter-spacing: 0.4px;
            }

            .linha-titulo {
              width: 48mm;
              height: 1.5px;
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

            .texto-introducao {
              margin: 7mm auto 0;
              max-width: 205mm;
              color: #475569;
              font-size: 12px;
              line-height: 1.65;
              text-align: center;
            }

            .nome-estudante {
              margin-top: 4mm;
              color: #0f2f78;
              font-family: Georgia, "Times New Roman", serif;
              font-size: 31px;
              font-weight: 700;
              line-height: 1.15;
            }

            .nome-linha {
              width: 125mm;
              max-width: 80%;
              height: 1px;
              margin: 3mm auto 0;
              background: #cbd5e1;
            }

            .curso-area {
              margin: 8mm auto 0;
              width: 205mm;
              max-width: 90%;
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
              font-weight: 850;
              line-height: 1.25;
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
              grid-template-columns: 1fr 1fr 1fr;
              gap: 12mm;
              align-items: end;
            }

            .campo {
              text-align: center;
            }

            .campo-linha {
              height: 1px;
              margin-bottom: 2.5mm;
              background: #94a3b8;
            }

            .campo-principal {
              color: #1e293b;
              font-size: 9.5px;
              font-weight: 800;
            }

            .campo-secundario {
              margin-top: 1mm;
              color: #64748b;
              font-size: 7.5px;
            }

            .selo {
              position: absolute;
              right: 17mm;
              bottom: 31mm;
              width: 24mm;
              height: 24mm;
              border: 1.2px solid #1d4ed8;
              border-radius: 50%;
              background: rgba(239, 246, 255, 0.9);
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              color: #1d4ed8;
              font-size: 6.5px;
              font-weight: 900;
              line-height: 1.25;
              letter-spacing: 0.8px;
              text-transform: uppercase;
              transform: rotate(-8deg);
            }

            .selo::before {
              content: "";
              position: absolute;
              inset: 3px;
              border: 1px dashed #60a5fa;
              border-radius: 50%;
            }

            .rodape-certificado {
              margin-top: 5mm;
              display: flex;
              justify-content: space-between;
              gap: 20px;
              color: #64748b;
              font-size: 7px;
            }

            .rodape-certificado strong {
              color: #334155;
            }

            @media print {
              body {
                background: #ffffff;
              }

              .pagina {
                width: 297mm;
                min-height: 210mm;
                margin: 0;
                padding: 10mm;
              }

              .certificado {
                box-shadow: none;
              }
            }

            @media screen {
              .instrucoes {
                width: 297mm;
                margin: 14px auto 0;
                padding: 12px 16px;
                border-radius: 10px;
                background: #0f172a;
                color: #e2e8f0;
                font-size: 12px;
                text-align: center;
              }
            }

            @media print {
              .instrucoes {
                display: none !important;
              }
            }
          </style>
        </head>

        <body>
          <div class="pagina">
            <section class="certificado">
              <div class="faixa-superior"></div>
              <div class="faixa-inferior"></div>
              <div class="moldura-externa"></div>
              <div class="moldura-interna"></div>

              <div class="conteudo">
                <header class="cabecalho">
                  <div class="marca">
                    <div class="simbolo">S</div>

                    <div class="marca-texto">
                      <div class="marca-nome">SICSI</div>
                      <div class="marca-sub">
                        Sistema de Consciencialização em Segurança da Informação
                      </div>
                    </div>
                  </div>

                  <div class="estado">
                    ✓ Certificação concluída
                  </div>
                </header>

                <section class="titulo-area">
                  <div class="titulo-pequeno">
                    Certificado de Conclusão
                  </div>

                  <h1>Certificado de Conclusão</h1>

                  <div class="linha-titulo"></div>

                  <p class="texto-introducao">
                    Certificamos que
                  </p>

                  <div class="nome-estudante">
                    ${escaparHTML(nomeEstudante)}
                  </div>

                  <div class="nome-linha"></div>

                  <p class="texto-introducao">
                    concluiu com aproveitamento todas as etapas de formação
                    exigidas pelo Sistema de Consciencialização em Segurança
                    da Informação (SICSI).
                  </p>

                  <div class="curso-area">
                    <div class="curso-label">
                      Formação concluída
                    </div>

                    <div class="curso-titulo">
                      ${escaparHTML(tituloCurso)}
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
                    <div class="campo-linha"></div>
                    <div class="campo-principal">
                      ${escaparHTML(dataEmissao)}
                    </div>
                    <div class="campo-secundario">
                      Data de emissão
                    </div>
                  </div>

                  <div class="campo">
                    <div class="campo-linha"></div>
                    <div class="campo-principal">
                      SICSI
                    </div>
                    <div class="campo-secundario">
                      Entidade emissora
                    </div>
                  </div>

                  <div class="campo">
                    <div class="campo-linha"></div>
                    <div class="campo-principal">
                      ${escaparHTML(numeroCertificado)}
                    </div>
                    <div class="campo-secundario">
                      Número do certificado
                    </div>
                  </div>
                </div>

                <div class="selo">
                  SICSI<br />
                  Formação<br />
                  Concluída
                </div>

                <div class="rodape-certificado">
                  <span>
                    <strong>SICSI</strong> · Segurança da Informação
                  </span>

                  <span>
                    Emitido em ${escaparHTML(dataCurta)}
                  </span>
                </div>
              </div>
            </section>

            <div class="instrucoes">
              O certificado está pronto. Na janela de impressão, escolha
              <strong>“Guardar como PDF”</strong> e mantenha o formato
              <strong>A4 · Horizontal</strong>.
            </div>
          </div>

          <script>
            window.addEventListener("load", function () {
              setTimeout(function () {
                window.print();
              }, 450);
            });
          </script>
        </body>
      </html>
    `);

    janela.document.close();
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="mx-auto flex max-w-6xl items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <FaSpinner className="animate-spin text-4xl text-blue-700" />

            <p className="text-gray-600">
              A carregar os seus certificados...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <div className="flex items-start gap-4">
              <FaExclamationCircle className="mt-1 text-xl" />

              <div>
                <h2 className="font-bold">
                  Não foi possível carregar os certificados
                </h2>

                <p className="mt-1 text-sm">
                  {erro}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">

        <section className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <FaCertificate className="text-xl" />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                    SICSI
                  </p>

                  <h1 className="text-3xl font-bold text-gray-900">
                    Os meus certificados
                  </h1>
                </div>
              </div>

              <p className="text-gray-600">
                Consulte e emita os certificados obtidos através
                das suas formações concluídas.
              </p>
            </div>

            <div className="rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-100">
              <p className="text-sm text-gray-500">
                Certificados obtidos
              </p>

              <p className="text-2xl font-bold text-blue-800">
                {certificados.length}
              </p>
            </div>
          </div>
        </section>

        {certificados.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <FaCertificate className="text-3xl" />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Ainda não possui certificados
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-gray-500">
              Conclua as formações disponíveis no SICSI para
              obter os seus certificados.
            </p>

            <button
              type="button"
              onClick={() => router.push("/dashboard/cursos")}
              className="
                mt-6 inline-flex items-center gap-2
                rounded-xl bg-blue-700 px-6 py-3
                font-semibold text-white
                transition hover:bg-blue-800
              "
            >
              <FaBook />
              Ver meus cursos
            </button>
          </section>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {certificados.map((certificado) => (
              <article
                key={certificado.id}
                className="
                  overflow-hidden rounded-2xl
                  border border-gray-100 bg-white
                  shadow-sm transition
                  hover:-translate-y-1 hover:shadow-lg
                "
              >
                <div className="bg-gradient-to-r from-blue-950 via-blue-800 to-emerald-700 p-6 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
                        <FaCertificate className="text-2xl" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
                          Certificado SICSI
                        </p>

                        <p className="mt-1 text-sm text-blue-100">
                          Certificado de conclusão
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                      Emitido
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-sm font-medium text-gray-500">
                    Estudante
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-gray-900">
                    <FaUserGraduate className="text-blue-700" />

                    <h2 className="text-xl font-bold">
                      {perfil?.nome_completo || "Estudante SICSI"}
                    </h2>
                  </div>

                  <p className="mt-5 text-sm font-medium text-gray-500">
                    Formação concluída
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-gray-900">
                    {certificado.curso?.titulo ||
                      `Curso #${certificado.curso_id}`}
                  </h3>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <FaCheckCircle className="text-emerald-600" />
                      <span>
                        Formação concluída com aproveitamento
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <FaCalendarAlt className="text-blue-600" />
                      <span>
                        Emitido em{" "}
                        <strong>
                          {formatarData(
                            certificado.data_emissao
                          )}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <FaShieldAlt className="text-blue-600" />
                      <span>
                        Certificação SICSI
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <button
                      type="button"
                      onClick={() =>
                        gerarCertificado(certificado)
                      }
                      className="
                        flex w-full items-center
                        justify-center gap-2
                        rounded-xl
                        bg-gradient-to-r
                        from-blue-800
                        to-emerald-700
                        px-5 py-3
                        font-semibold text-white
                        shadow-md
                        transition
                        hover:from-blue-900
                        hover:to-emerald-800
                      "
                    >
                      <FaDownload />
                      Emitir certificado em PDF
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
