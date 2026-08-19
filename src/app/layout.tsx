import type { Metadata } from "next";
import "./globals.css";
import SecurityLoader from "@/components/ui/SecurityLoader";

export const metadata: Metadata = {
  title: "SICSI | Segurança da Informação",
  description:
    "Sistema de Consciencialização em Segurança da Informação para aprendizagem, prevenção e simulação de ameaças digitais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body>
        <SecurityLoader />
        {children}
      </body>
    </html>
  );
}