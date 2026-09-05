import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASLE - Cuidados do Lar",
  description:
    "Recrutamento e intermediação de profissionais domésticas para famílias e clientes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
