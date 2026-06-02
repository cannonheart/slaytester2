function loadDotenv(): void {
  const cwd = Deno.cwd();
  const candidates = [`${cwd}/.env`];
  const parent = cwd.substring(0, cwd.lastIndexOf("/"));
  if (parent && parent !== cwd) candidates.push(`${parent}/.env`);

  for (const envPath of candidates) {
    try {
      if (!Deno.statSync(envPath).isFile) continue;
    } catch {
      continue;
    }
    const text = Deno.readTextFileSync(envPath);
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!Deno.env.has(key)) Deno.env.set(key, value);
    }
    return;
  }
}

loadDotenv();

const REQUIRED = [
  ["ADMIN_TOKEN", ""],
  ["RECORDING_MAX_DURATION_MINUTES", "60"],
  ["RECORDING_MAX_CHUNKS", "900"],
  ["MAX_CHUNK_SIZE_MB", "10"],
] as const;

for (const [name, fallback] of REQUIRED) {
  if (!Deno.env.get(name)) {
    if (fallback) {
      Deno.env.set(name, fallback);
      console.error(`[Slaytester] ${name} not set, using default: ${fallback}`);
    } else {
      console.error(`[Slaytester] Missing required env var: ${name}`);
      Deno.exit(1);
    }
  }
}
