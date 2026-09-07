#!/usr/bin/env node
/**
 * Asserts that the bundled plugin references no Node builtins.
 *
 * manifest.json declares `isDesktopOnly: false`, so this plugin loads on
 * Obsidian mobile, where there is no Node runtime and a stray
 * `require("fs")` is a hard load failure. The SDK we bundle
 * (`@sentilis/cli`) is isomorphic by design and guards that on its side,
 * but this is the check on the artifact users actually install — the one
 * that would catch a future dependency, or an errant import, before a
 * release does.
 *
 * Both spellings are checked. `builtinModules` lists bare names only
 * ("fs"), while our own code uses the prefixed form ("node:fs"), and
 * esbuild lowers a dynamic `await import("node:fs")` of an external into
 * `Promise.resolve().then(() => require("node:fs"))`, so the literal
 * survives minification either way.
 */
import { readFileSync } from "node:fs";
import { builtinModules } from "node:module";

const BUNDLE = "main.js";

let bundle;
try {
  bundle = readFileSync(BUNDLE, "utf8");
} catch {
  console.error(`ERROR: ${BUNDLE} not found — run the esbuild step first.`);
  process.exit(1);
}

const names = builtinModules
  .filter((name) => !name.startsWith("_"))
  .flatMap((name) => [name, `node:${name}`]);

const hits = [];
for (const name of names) {
  const pattern = new RegExp(
    String.raw`(?:require|__require)\(\s*["'\`]` +
      name.replace("/", "\\/") +
      String.raw`["'\`]\s*\)`,
    "g",
  );
  const found = bundle.match(pattern);
  if (found !== null) hits.push(`${name} (${found.length}x)`);
}

if (hits.length > 0) {
  console.error(
    `ERROR: ${BUNDLE} references Node builtins — this breaks Obsidian mobile:`,
  );
  for (const hit of hits) console.error(`  - ${hit}`);
  process.exit(1);
}

console.log(`OK — ${BUNDLE} is mobile-safe (no Node builtin requires)`);
