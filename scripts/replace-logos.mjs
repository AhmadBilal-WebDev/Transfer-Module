import fs from 'fs'
import path from 'path'

const root = process.cwd()
const exts = new Set(['.js', '.jsx', '.tsx', '.ts'])
const skip = new Set(['node_modules', '.next', '.git'])

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (skip.has(name)) continue
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (exts.has(path.extname(name))) out.push(p)
  }
  return out
}

const voyBlock =
  /<div className=\{styles\.brandLogo\} aria-label="Voyara">\s*<span className=\{styles\.brandLogoDark\}>Voy<\/span>\s*<span className=\{styles\.brandLogoRed\}>ara<\/span>\s*<\/div>/g
const voyFooter =
  /<p className=\{styles\.voucherFooterBrand\} aria-label="Voyara">\s*<span className=\{styles\.brandLogoDark\}>Voy<\/span>\s*<span className=\{styles\.brandLogoRed\}>ara<\/span>\s*<\/p>/g
const royalTransfer =
  /<div className=\{styles\.brandLogo\} aria-label="Voyara">\s*ROYALANE\s*<\/div>/g

const voyReplace = `<div className={styles.brandLogo} aria-label="Royalane">
                    <img src="/updatedImages/Main-Logo.png" alt="Royalane" width={180} height={44} className={styles.brandLogoImg} />
                  </div>`
const voyFooterReplace = `<p className={styles.voucherFooterBrand} aria-label="Royalane">
                    <img src="/updatedImages/Main-Logo.png" alt="Royalane" width={140} height={34} className={styles.brandLogoImg} />
                  </p>`
const royalReplace = `<div className={styles.brandLogo} aria-label="Royalane">
                    <img src="/updatedImages/Main-Logo.png" alt="Royalane" width={180} height={44} className={styles.brandLogoImg} />
                  </div>`

const files = walk(path.join(root, 'src'))
let changed = 0

for (const file of files) {
  let s = fs.readFileSync(file, 'utf8')
  const before = s
  s = s.replaceAll('/images/logoblack.png', '/updatedImages/Main-Logo.png')
  s = s.replaceAll('/images/logo.png', '/updatedImages/Main-Logo.png')
  s = s.replaceAll('%2Fimages%2Flogo.png', '%2FupdatedImages%2FMain-Logo.png')
  s = s.replace(voyBlock, voyReplace)
  s = s.replace(voyFooter, voyFooterReplace)
  s = s.replace(royalTransfer, royalReplace)
  if (s !== before) {
    fs.writeFileSync(file, s)
    changed++
    console.log('updated', path.relative(root, file))
  }
}

console.log('files changed', changed)
