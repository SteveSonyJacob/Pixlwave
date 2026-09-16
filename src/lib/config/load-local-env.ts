import { existsSync } from "node:fs";
import path from "node:path";

export function loadLocalEnvFile() {
  for (const name of [".env.local", ".env"]) {
    const file = path.join(process.cwd(), name);
    if (existsSync(file)) {
      process.loadEnvFile(file);
      return;
    }
  }
}
