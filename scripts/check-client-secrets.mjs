import { promises as fs } from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), ".next", "static");
const forbiddenValues = [process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.DATABASE_URL]
  .filter((value) => value && value.length >= 12);

async function files(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}

for (const file of await files(root)) {
  const content = await fs.readFile(file, "utf8").catch(() => "");
  for (const value of forbiddenValues) {
    if (content.includes(value)) throw new Error(`Server secret leaked into browser output: ${path.relative(process.cwd(), file)}`);
  }
}
console.log(`Client bundle secret scan passed (${forbiddenValues.length} configured server values checked).`);
