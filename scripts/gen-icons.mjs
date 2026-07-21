// Gera os ícones PNG do PWA a partir de um SVG (carteira em teal).
// Uso: node scripts/gen-icons.mjs
import sharp from "sharp"
import { mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, "..", "public", "icons")
mkdirSync(outDir, { recursive: true })

// Ícone "normal": fundo teal com respiro, carteira branca centralizada.
const wallet = (cx, cy, s, stroke) => `
  <g transform="translate(${cx - s / 2}, ${cy - s / 2})" fill="none"
     stroke="#ffffff" stroke-width="${stroke}" stroke-linecap="round"
     stroke-linejoin="round">
    <path d="M ${s * 0.06} ${s * 0.24}
             h ${s * 0.72}
             a ${s * 0.08} ${s * 0.08} 0 0 1 ${s * 0.08} ${s * 0.08}
             v ${s * 0.44}
             a ${s * 0.08} ${s * 0.08} 0 0 1 -${s * 0.08} ${s * 0.08}
             h -${s * 0.72}
             a ${s * 0.08} ${s * 0.08} 0 0 1 -${s * 0.08} -${s * 0.08}
             v -${s * 0.52}
             a ${s * 0.08} ${s * 0.08} 0 0 1 ${s * 0.08} -${s * 0.08} z" />
    <path d="M ${s * 0.06} ${s * 0.32} h ${s * 0.66}" />
    <circle cx="${s * 0.70}" cy="${s * 0.54}" r="${s * 0.045}" fill="#ffffff" stroke="none"/>
  </g>`

function svg(size, { maskable = false } = {}) {
  const radius = maskable ? 0 : size * 0.22
  // maskable precisa de zona de segurança (ícone menor, centralizado)
  const iconScale = maskable ? 0.56 : 0.72
  const s = size * iconScale
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="#0f8a6b"/>
    ${wallet(size / 2, size / 2, s, Math.max(2, size * 0.03))}
  </svg>`
}

const jobs = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
  { name: "apple-icon.png", size: 180 },
]

for (const j of jobs) {
  const buf = Buffer.from(svg(j.size, { maskable: j.maskable }))
  await sharp(buf).png().toFile(join(outDir, j.name))
  console.log("gerado:", j.name)
}
console.log("OK — ícones em public/icons/")
