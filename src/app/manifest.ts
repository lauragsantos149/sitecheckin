import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Movimento & Bem-Estar — Laura Gonzalez",
    short_name: "Laura App",
    description:
      "Compre créditos, envie comprovante e agende suas aulas de forma rápida.",
    start_url: "/agenda",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f97316",
    lang: "pt-BR",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
