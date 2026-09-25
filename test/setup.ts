import { readFileSync } from "node:fs";
import path from "node:path";

// Load .env.local into process.env so integration tests can reach Postgres.
try {
  const env = readFileSync(path.resolve(__dirname, "../.env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // no .env.local — DB integration tests will be skipped
}
