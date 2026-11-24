import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'src');
const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.md', '.html']);
const skipDirs = new Set(['node_modules', '.next', '.git']);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(ent.name))) out.push(p);
  }
  return out;
}

const replacements = [
  [/Voyara Travel Blog/g, 'Royalane Blog'],
  [/Voyara Travel/g, 'Royalane'],
  [/Voyora Travel/g, 'Royalane'],
  [/voyaratravel\.com/gi, 'royalane.com'],
  [/voyaratravel/gi, 'royalane'],
  [/info@royalane\.com/g, 'info@example.com'],
  [/info@voyara[^\s"'<>]*/gi, 'info@example.com'],
  [/example@voyara[^\s"'<>]*/gi, 'info@example.com'],
  [/Voyara/g, 'Royalane'],
  [/Voyora/g, 'Royalane'],
  [/VOYARA/g, 'ROYALANE'],
  [/VOYORA/g, 'ROYALANE'],
  [/voyara/g, 'royalane'],
  [/voyora/g, 'royalane'],
];

let changedFiles = 0;
let totalReplaces = 0;

for (const file of walk(root)) {
  let text = fs.readFileSync(file, 'utf8');
  const original = text;
  let fileCount = 0;

  for (const [re, to] of replacements) {
    const before = text;
    text = text.replace(re, to);
    if (text !== before) {
      const matches = before.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'));
      fileCount += matches ? matches.length : 0;
    }
  }

  if (text !== original) {
    fs.writeFileSync(file, text);
    changedFiles += 1;
    totalReplaces += fileCount;
    console.log(path.relative(process.cwd(), file));
  }
}

console.log('---');
console.log(`files: ${changedFiles}, approx replacements: ${totalReplaces}`);
