import fs from 'fs'
import path from 'path'

const root = path.join(process.cwd(), 'src')
const skip = new Set(['node_modules', '.next', '.git'])
const rule = `

.brandLogoImg {
  width: auto;
  height: 42px;
  max-width: 200px;
  object-fit: contain;
  display: block;
}
`

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (skip.has(name)) continue
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (name.endsWith('.module.css')) out.push(p)
  }
  return out
}

let n = 0
for (const file of walk(root)) {
  const s = fs.readFileSync(file, 'utf8')
  if (!s.includes('.brandLogo') || s.includes('.brandLogoImg')) continue
  fs.writeFileSync(file, s.trimEnd() + rule)
  n++
  console.log('css', path.relative(process.cwd(), file))
}
console.log('css updated', n)
