import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

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

export async function PATCH(
  request: NextRequest
) {
  try {
    /*
     * ========================================================
     * 1. VERIFICAR UTILIZADOR AUTENTICADO
     * ========================================================
     */

    const supabaseServidor =
      await criarClienteSupabaseServidor();

    const {
      data: {
        user,
      },
      error: erroUtilizador,
    } =
      await supabaseServidor.auth.getUser();

    if (
      erroUtilizador ||
      !user
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Sessão de administrador inválida ou expirada.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ========================================================
     * 2. VERIFICAR PAPEL ADMINISTRADOR
     * ========================================================
     */

    const {
      data: perfil,
      error: erroPerfil,
    } =
      await supabaseServidor
        .from("perfis")
        .select(
          "id, nome_completo, email, papel, foto_url"
        )
        .eq("id", user.id)
        .single();

    if (
      erroPerfil ||
      !perfil
    ) {
      console.error(
        "Erro ao obter perfil do administrador:",
        erroPerfil
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Não foi possível verificar o perfil administrativo.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      perfil.papel !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Acesso negado. Apenas administradores podem alterar este e-mail.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ========================================================
     * 3. OBTER NOVO E-MAIL
     * ========================================================
     */

    const corpo =
      await request.json();

    const email =
      typeof corpo.email === "string"
        ? corpo.email
            .trim()
            .toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Introduza um endereço de e-mail.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validação simples do formato.
     */

    const formatoEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !formatoEmail.test(email)
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Introduza um endereço de e-mail válido.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * 4. SE O E-MAIL NÃO MUDOU
     * ========================================================
     */

    if (
      email ===
      (
        perfil.email ||
        user.email ||
        ""
      )
        .trim()
        .toLowerCase()
    ) {
      return NextResponse.json(
        {
          sucesso: true,
          mensagem:
            "O e-mail já corresponde ao endereço actual.",
          email,
        },
        {
          status: 200,
        }
      );
    }

    /*
     * ========================================================
     * 5. CLIENTE ADMINISTRATIVO
     * ========================================================
     *
     * A Service Role só existe no servidor.
     */

    const supabaseAdmin =
      obterSupabaseAdmin();

    /*
     * ========================================================
     * 6. ALTERAR E-MAIL NO SUPABASE AUTH
     * ========================================================
     *
     * email_confirm: true
     *
     * Isto evita o fluxo normal de confirmação.
     */

    const {
      data:
        resultadoUtilizador,
      error:
        erroActualizacaoAuth,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          email,
          email_confirm: true,
        }
      );

    if (
      erroActualizacaoAuth
    ) {
      console.error(
        "Erro ao actualizar e-mail no Supabase Auth:",
        erroActualizacaoAuth
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro:
            erroActualizacaoAuth.message ||
            "Não foi possível actualizar o e-mail da conta.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ========================================================
     * 7. ACTUALIZAR TABELA PERFIS
     * ========================================================
     */

    const {
      data:
        perfilActualizado,
      error:
        erroActualizacaoPerfil,
    } =
      await supabaseAdmin
        .from("perfis")
        .update({
          email,
        })
        .eq("id", user.id)
        .select(
          "id, nome_completo, email, papel, foto_url"
        )
        .single();

    if (
      erroActualizacaoPerfil
    ) {
      console.error(
        "Erro ao actualizar e-mail em perfis:",
        erroActualizacaoPerfil
      );

      /*
       * Tentativa de reversão do Auth caso
       * a tabela perfis falhe.
       */

      const emailAnterior =
        perfil.email ||
        user.email;

      if (
        emailAnterior
      ) {
        await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            email:
              emailAnterior,
            email_confirm: true,
          }
        );
      }

      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Não foi possível actualizar o perfil. A alteração foi revertida.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ========================================================
     * 8. RESPOSTA
     * ========================================================
     */

    return NextResponse.json(
      {
        sucesso: true,
        mensagem:
          "E-mail do administrador actualizado com sucesso. Não é necessária confirmação por e-mail.",
        email,
        utilizador: resultadoUtilizador?.user
          ? {
              id:
                resultadoUtilizador.user.id,
              email:
                resultadoUtilizador.user.email,
            }
          : null,
        perfil:
          perfilActualizado,
      },
      {
        status: 200,
      }
    );
  } catch (erro) {
    console.error(
      "Erro na API de alteração de e-mail administrativo:",
      erro
    );

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          erro instanceof Error
            ? erro.message
            : "Ocorreu um erro interno do servidor.",
      },
      {
        status: 500,
      }
    );
  }
}