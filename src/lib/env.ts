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

const VARS: Record<string, { desc: string; default: string }> = {
  ADMIN_TOKEN: {
    desc: "The admin password for the dashboard. Set this to something unique.",
    default: "",
  },
  RECORDING_MAX_DURATION_MINUTES: {
    desc: "Max recording length per session in minutes. Chunks uploaded after this limit are rejected.",
    default: "60",
  },
  RECORDING_MAX_CHUNKS: {
    desc: "Max chunks per session. With 4-second timeslices: 900 chunks = ~60 minutes.",
    default: "900",
  },
  MAX_CHUNK_SIZE_MB: {
    desc: "Max size per uploaded chunk in megabytes. Larger chunks are rejected.",
    default: "10",
  },
};

for (const [name, info] of Object.entries(VARS)) {
  if (!Deno.env.get(name)) {
    if (info.default) {
      Deno.env.set(name, info.default);
      console.error(`[Slaytester] ${name} not set, using default: ${info.default} (${info.desc})`);
    } else {
      console.error(`[Slaytester] Missing required env var: ${name}`);
      console.error(`  ${info.desc}`);
      console.error(`  Set it in your .env file or export it as an environment variable.`);
      Deno.exit(1);
    }
  }
}
