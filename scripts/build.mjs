// Build voor statische hosting (GitHub Pages e.d.).
// Bundelt src/main.ts → dist/main.js en schrijft een dist/index.html die naar
// het gebundelde bestand wijst (de browser kan TypeScript niet direct laden).
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

mkdirSync("dist", { recursive: true });

await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "esm",
  outfile: "dist/main.js",
  minify: true,
  target: ["es2022"],
});

// Eén bron van waarheid voor de HTML: neem de root-index.html en herschrijf de
// dev-verwijzing (./src/main.ts) naar het gebundelde bestand (./main.js).
const html = readFileSync("index.html", "utf8").replace("./src/main.ts", "./main.js");
writeFileSync("dist/index.html", html);

console.log("Built dist/ — main.js + index.html");
