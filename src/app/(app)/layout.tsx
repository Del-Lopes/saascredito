import { requireUser } from "@/lib/auth"
import { logout } from "@/app/login/actions"
import { AppNav } from "@/components/app-nav"
import { Button } from "@/components/ui/button"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await requireUser()

  return (
    <div className="grid min-h-svh grid-cols-[240px_1fr]">
      <aside className="flex flex-col border-r bg-muted/30">
        <div className="border-b px-5 py-4">
          <p className="text-sm font-semibold">Gestão de Crédito</p>
          <p className="truncate text-xs text-muted-foreground">
            {profile?.nome ?? user.email}
          </p>
        </div>
        <div className="flex-1">
          <AppNav />
        </div>
        <div className="border-t p-3">
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
            >
              Sair
            </Button>
          </form>
        </div>
      </aside>
      <main className="overflow-auto">{children}</main>
    </div>
  )
}
