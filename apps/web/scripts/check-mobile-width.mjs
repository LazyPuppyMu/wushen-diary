import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const stylesheetPath = fileURLToPath(new URL("../src/app/styles.css", import.meta.url));
const stylesheet = await readFile(stylesheetPath, "utf8");
const mobileBlock = stylesheet.match(/@media\s*\(max-width:\s*420px\)\s*{([\s\S]*?)\n}/)?.[1] ?? "";

if (!/body\s*{\s*min-width:\s*0\s*;\s*}/.test(mobileBlock)) {
  throw new Error("The 420px breakpoint must reset body min-width to 0.");
}

console.log("Mobile width CSS check passed.");
