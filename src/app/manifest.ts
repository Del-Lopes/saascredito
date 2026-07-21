import type { MetadataRoute } from "next"

/** Web App Manifest — torna o app instalável (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestão de Crédito — CRM de Empréstimos",
    short_name: "Gestão de Crédito",
    description:
      "Cadastro de empréstimos, controle de vencimentos e fluxo de caixa.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d1512",
    theme_color: "#0d1512",
    lang: "pt-BR",
    categories: ["finance", "business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
