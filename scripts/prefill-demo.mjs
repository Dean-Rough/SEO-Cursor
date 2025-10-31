import { readFile } from "node:fs/promises";
import { extractBusinessProfile } from "../src/lib/prefill";

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error("Usage: node scripts/prefill-demo.mjs <html-file>");
  process.exit(1);
}

const html = await readFile(htmlPath, "utf8");
const result = extractBusinessProfile(html);
console.log(JSON.stringify(result, null, 2));
