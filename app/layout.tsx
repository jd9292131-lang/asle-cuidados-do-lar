import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASLE - Cuidados do Lar",
  description:
    "Recrutamento, seleção e intermediação de profissionais para cuidados do lar.",
  verification: {
    google: "D-OKemrgVnIjWbZIMk3452y63R4kpScEj5dWLdNPT0k",
     },
  };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-AO">
      <body>{children}</body>
    </html>
  );
}