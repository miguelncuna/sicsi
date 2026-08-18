import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SICSI",
  description: "Sistema de Consciencialização em Segurança da Informação",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}