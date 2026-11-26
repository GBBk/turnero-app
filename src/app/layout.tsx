import type { Metadata } from "next";
import { Big_Shoulders, Public_Sans } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

// Big Shoulders: condensada, de cartel. Se usa para la marca y para los horarios,
// que son el contenido principal de la app. Public Sans: texto de interfaz.
const display = Big_Shoulders({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-big-shoulders",
  adjustFontFallback: false, // Next no tiene métricas de fallback para esta familia
});
const sans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans" });

export const metadata: Metadata = {
  title: "Turnero",
  description: "Reservá tu turno online, sin llamar ni escribir.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen antialiased">
        <Header />
        <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">{children}</main>
      </body>
    </html>
  );
}
