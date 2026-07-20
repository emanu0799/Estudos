import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academia Fiscal Piçarras",
  description: "Central pessoal de estudo para concursos e legislação.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
