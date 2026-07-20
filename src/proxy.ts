import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// Next.js 16: o antigo "middleware" agora se chama "proxy" (runtime nodejs).
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Todas as rotas exceto:
     * - _next/static, _next/image
     * - favicon.ico e arquivos estáticos comuns
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
