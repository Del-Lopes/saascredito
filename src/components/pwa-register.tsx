"use client"

import { useEffect } from "react"

/** Registra o service worker (apenas em produção, com HTTPS/localhost). */
export function PwaRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // silencioso — a falta do SW não quebra o app
      })
    }
  }, [])

  return null
}
