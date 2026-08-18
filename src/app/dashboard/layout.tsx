import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await criarClienteSupabaseServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * ============================================================
   * 1. UTILIZADOR NÃO AUTENTICADO
   * ============================================================
   */

  if (!user) {
    redirect("/login");
  }

  /*
   * ============================================================
   * 2. OBTER PAPEL DO UTILIZADOR
   * ============================================================
   */

  const { data: perfil, error } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user.id)
    .single();

  /*
   * ============================================================
   * 3. PERFIL INVÁLIDO
   * ============================================================
   */

  if (error || !perfil) {
    redirect("/login");
  }

  /*
   * ============================================================
   * 4. ADMIN NÃO PODE ACEDER À ÁREA DO ESTUDANTE
   * ============================================================
   */

  if (perfil.papel === "ADMIN") {
    redirect("/admin");
  }

  /*
   * ============================================================
   * 5. APENAS ESTUDANTES PODEM PERMANECER NO DASHBOARD
   * ============================================================
   */

  if (perfil.papel !== "ESTUDANTE") {
    redirect("/login");
  }

  /*
   * ============================================================
   * 6. ÁREA DO ESTUDANTE
   * ============================================================
   */

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="min-h-screen min-w-0 lg:ml-72">
        {children}
      </main>
    </div>
  );
}