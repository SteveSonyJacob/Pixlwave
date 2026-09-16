import { existsSync } from "node:fs";
import path from "node:path";

export function loadLocalEnvFile() {
  const file = path.join(process.cwd(), ".env.local");
  if (existsSync(file)) process.loadEnvFile(file);
}
