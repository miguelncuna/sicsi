import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function obterSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Configuração do Supabase incompleta. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/* =========================================================
   GET — LISTAR UTILIZADORES
========================================================= */

export async function GET() {
  try {
    const supabase = obterSupabaseAdmin();

    const { data, error } = await supabase
      .from("perfis")
      .select(`
        id,
        nome_completo,
        email,
        papel,
        foto_url,
        criado_em
      `)
      .order("criado_em", {
        ascending: false,
      });

    if (error) {
      console.error("Erro ao obter utilizadores:", error);

      return NextResponse.json(
        {
          sucesso: false,
          erro: error.message,
          utilizadores: [],
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        utilizadores: data ?? [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro na API de utilizadores:", error);

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          error instanceof Error
            ? error.message
            : "Erro interno do servidor.",
        utilizadores: [],
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST — CRIAR UTILIZADOR
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const supabase = obterSupabaseAdmin();

    const corpo = await request.json();

    const nomeCompleto = String(
      corpo.nome_completo ?? ""
    ).trim();

    const email = String(
      corpo.email ?? ""
    )
      .trim()
      .toLowerCase();

    const papel = String(
      corpo.papel ?? "ESTUDANTE"
    ).toUpperCase();

    const fotoUrl =
      corpo.foto_url === null ||
      corpo.foto_url === undefined ||
      String(corpo.foto_url).trim() === ""
        ? null
        : String(corpo.foto_url).trim();

    const password = String(
      corpo.password ?? ""
    );

    /* -----------------------------
       VALIDAÇÕES
    ----------------------------- */

    if (!nomeCompleto) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Introduza o nome completo.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Introduza o email.",
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Introduza uma palavra-passe.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A palavra-passe deve ter pelo menos 6 caracteres.",
        },
        { status: 400 }
      );
    }

    if (
      papel !== "ADMIN" &&
      papel !== "ESTUDANTE"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Papel inválido.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------
       CRIAR UTILIZADOR NO AUTH
    ----------------------------- */

    const {
      data: utilizadorAuth,
      error: erroAuth,
    } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (erroAuth || !utilizadorAuth.user) {
      console.error(
        "Erro ao criar utilizador no Auth:",
        erroAuth
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro:
            erroAuth?.message ||
            "Não foi possível criar o utilizador.",
        },
        { status: 400 }
      );
    }

    const id = utilizadorAuth.user.id;

    /* -----------------------------
       CRIAR PERFIL
    ----------------------------- */

    const { data: perfil, error: erroPerfil } =
      await supabase
        .from("perfis")
        .insert({
          id,
          nome_completo: nomeCompleto,
          email,
          papel,
          foto_url: fotoUrl,
        })
        .select(`
          id,
          nome_completo,
          email,
          papel,
          foto_url,
          criado_em
        `)
        .single();

    /* -----------------------------
       SE O PERFIL FALHAR,
       APAGAR AUTH PARA EVITAR
       UTILIZADOR ÓRFÃO
    ----------------------------- */

    if (erroPerfil || !perfil) {
      console.error(
        "Erro ao criar perfil:",
        erroPerfil
      );

      await supabase.auth.admin.deleteUser(id);

      return NextResponse.json(
        {
          sucesso: false,
          erro:
            erroPerfil?.message ||
            "Não foi possível criar o perfil do utilizador.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        mensagem:
          "Utilizador criado com sucesso.",
        utilizador: perfil,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erro no POST de utilizadores:",
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
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT — EDITAR UTILIZADOR
========================================================= */

export async function PUT(request: NextRequest) {
  try {
    const supabase = obterSupabaseAdmin();

    const corpo = await request.json();

    const id = String(
      corpo.id ?? ""
    ).trim();

    const nomeCompleto = String(
      corpo.nome_completo ?? ""
    ).trim();

    const email = String(
      corpo.email ?? ""
    )
      .trim()
      .toLowerCase();

    const papel = String(
      corpo.papel ?? ""
    ).toUpperCase();

    const fotoUrl =
      corpo.foto_url === null ||
      corpo.foto_url === undefined ||
      String(corpo.foto_url).trim() === ""
        ? null
        : String(corpo.foto_url).trim();

    const password =
      corpo.password !== undefined
        ? String(corpo.password)
        : "";

    /* -----------------------------
       VALIDAÇÕES
    ----------------------------- */

    if (!id) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "ID do utilizador não informado.",
        },
        { status: 400 }
      );
    }

    if (!nomeCompleto) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Introduza o nome completo.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Introduza o email.",
        },
        { status: 400 }
      );
    }

    if (
      papel !== "ADMIN" &&
      papel !== "ESTUDANTE"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Papel inválido.",
        },
        { status: 400 }
      );
    }

    if (
      password.trim() &&
      password.length < 6
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A nova palavra-passe deve ter pelo menos 6 caracteres.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------
       VERIFICAR PERFIL
    ----------------------------- */

    const {
      data: perfilAtual,
      error: erroPerfilAtual,
    } = await supabase
      .from("perfis")
      .select(`
        id,
        nome_completo,
        email,
        papel,
        foto_url,
        criado_em
      `)
      .eq("id", id)
      .single();

    if (erroPerfilAtual || !perfilAtual) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            erroPerfilAtual?.message ||
            "Utilizador não encontrado.",
        },
        { status: 404 }
      );
    }

    /* -----------------------------
       ACTUALIZAR AUTH
    ----------------------------- */

    const dadosAuth: {
      email?: string;
      password?: string;
    } = {};

    if (email !== perfilAtual.email) {
      dadosAuth.email = email;
    }

    if (password.trim()) {
      dadosAuth.password = password;
    }

    if (Object.keys(dadosAuth).length > 0) {
      const {
        error: erroAtualizarAuth,
      } =
        await supabase.auth.admin.updateUserById(
          id,
          dadosAuth
        );

      if (erroAtualizarAuth) {
        console.error(
          "Erro ao actualizar Auth:",
          erroAtualizarAuth
        );

        return NextResponse.json(
          {
            sucesso: false,
            erro:
              erroAtualizarAuth.message,
          },
          { status: 400 }
        );
      }
    }

    /* -----------------------------
       ACTUALIZAR PERFIL
    ----------------------------- */

    const {
      data: perfilAtualizado,
      error: erroAtualizarPerfil,
    } = await supabase
      .from("perfis")
      .update({
        nome_completo: nomeCompleto,
        email,
        papel,
        foto_url: fotoUrl,
      })
      .eq("id", id)
      .select(`
        id,
        nome_completo,
        email,
        papel,
        foto_url,
        criado_em
      `)
      .single();

    if (
      erroAtualizarPerfil ||
      !perfilAtualizado
    ) {
      console.error(
        "Erro ao actualizar perfil:",
        erroAtualizarPerfil
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro:
            erroAtualizarPerfil?.message ||
            "Não foi possível actualizar o perfil.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        mensagem:
          "Utilizador actualizado com sucesso.",
        utilizador: perfilAtualizado,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erro no PUT de utilizadores:",
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
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE — ELIMINAR UTILIZADOR
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const supabase = obterSupabaseAdmin();

    const corpo = await request.json();

    const id = String(
      corpo.id ?? ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "ID do utilizador não informado.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------
       ELIMINAR DO AUTH

       A tabela perfis possui:
       FOREIGN KEY (id)
       REFERENCES auth.users(id)
       ON DELETE CASCADE

       Portanto, o perfil será
       eliminado automaticamente.
    ----------------------------- */

    const {
      error: erroEliminar,
    } =
      await supabase.auth.admin.deleteUser(id);

    if (erroEliminar) {
      console.error(
        "Erro ao eliminar utilizador:",
        erroEliminar
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro: erroEliminar.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        mensagem:
          "Utilizador eliminado com sucesso.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erro no DELETE de utilizadores:",
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
      { status: 500 }
    );
  }
}