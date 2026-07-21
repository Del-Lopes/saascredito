"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wallet, LayoutDashboard, Users, HandCoins } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Início", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/emprestimos", label: "Empréstimos", icon: HandCoins },
]

/** Barra superior + navegação inferior fixa (apenas mobile). */
export function MobileNav() {
  const pathname = usePathname()

  return (
    <>
      <header className="flex items-center gap-2.5 border-b bg-sidebar px-4 py-3 md:hidden">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wallet className="size-4" />
        </div>
        <p className="text-sm font-semibold">Gestão de Crédito</p>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t bg-background md:hidden">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-xs font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
