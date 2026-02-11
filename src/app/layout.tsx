import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora, Figtree } from "next/font/google";

import "./globals.css";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Bimverse Comercial",
  description: "Plataforma comercial de propostas da Bimverse",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={figtree.variable}>
      <body className={`${sora.variable} ${ibmPlexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
