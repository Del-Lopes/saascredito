"use client"

import { useActionState, useState } from "react"
import { login, signup, type AuthState } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const action = mode === "login" ? login : signup
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    null
  )

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </CardTitle>
          <CardDescription>
            CRM de Empréstimos — gestão de crédito e fluxo de caixa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            {mode === "signup" && (
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" name="nome" placeholder="Seu nome" required />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@exemplo.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••"
                required
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Button type="submit" disabled={pending} className="w-full">
              {pending
                ? "Aguarde…"
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Criar agora
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
