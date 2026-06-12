import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'Bolão da Copa',
  description: 'Bolão para jogar com os amigos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 antialiased"
      suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
