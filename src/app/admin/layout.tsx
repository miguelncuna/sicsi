import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
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
   * 2. OBTER PAPEL
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
   * 4. APENAS ADMINISTRADORES
   * ============================================================
   */

  if (perfil.papel !== "ADMIN") {
    redirect("/dashboard");
  }

  /*
   * ============================================================
   * 5. ÁREA ADMINISTRATIVA
   * ============================================================
   */

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="min-h-screen min-w-0 lg:ml-72">
        {children}
      </main>
    </div>
  );
}