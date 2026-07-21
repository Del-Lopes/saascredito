import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display serif (títulos) — a face que dá o caráter editorial do roadmap.
// Arquivo variável LOCAL (fontsource) — o subset "latin" do next/font/google
// para a Fraunces NÃO inclui o basic latin (A-Z/a-z), fazendo os títulos
// caírem no fallback. O arquivo local cobre todos os glifos.
const fraunces = localFont({
  src: "../../public/fonts/Fraunces-Variable.woff2",
  variable: "--font-fraunces",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Gestão de Crédito — CRM de Empréstimos",
  description: "Cadastro de empréstimos e controle de fluxo de caixa",
  applicationName: "Gestão de Crédito",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gestão de Crédito",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1512" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
