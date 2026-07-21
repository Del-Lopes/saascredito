import { Wallet, LogOut } from "lucide-react"
import { requireUser } from "@/lib/auth"
import { logout } from "@/app/login/actions"
import { AppNav } from "@/components/app-nav"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  const a = partes[0]?.[0] ?? ""
  const b = partes.length > 1 ? partes[partes.length - 1][0] : ""
  return (a + b).toUpperCase()
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await requireUser()
  const nome = profile?.nome ?? user.email ?? "Usuário"

  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="hidden flex-col border-r bg-sidebar md:flex">
        {/* Marca */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Wallet className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-[0.95rem] font-semibold">
              Gestão de Crédito
            </p>
            <p className="text-xs text-muted-foreground">Controle de caixa</p>
          </div>
        </div>

        <div className="flex-1">
          <AppNav />
        </div>

        {/* Rodapé: usuário + tema + sair */}
        <div className="border-t p-3">
          <div className="mb-1 flex items-center gap-2.5 px-2 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              {iniciais(nome)}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{nome}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
          <ThemeToggle />
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <MobileNav />
        <main className="min-w-0 flex-1 overflow-auto bg-background pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}
