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
