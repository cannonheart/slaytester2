function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function checkToken(token: string): boolean {
  const expected = Deno.env.get("ADMIN_TOKEN") ?? "";
  if (!expected) return false;
  return constantTimeEqual(token, expected);
}

export function isAuthorized(req: Request): boolean {
  const header = req.headers.get("admin-token");
  if (header && checkToken(header)) return true;

  const cookies = req.headers.get("cookie") ?? "";
  for (const c of cookies.split(";")) {
    const [name, ...rest] = c.trim().split("=");
    if (name === "token" && checkToken(rest.join("="))) return true;
  }

  return false;
}

export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for") ?? "unknown";
}

const failedAuth = new Map<string, { count: number; time: number }>();

export function resetAuthRateLimits() {
  failedAuth.clear();
}

export function checkAuthRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = failedAuth.get(ip);

  if (entry && now - entry.time > 300_000) {
    failedAuth.delete(ip);
    return true;
  }

  if (entry && entry.count >= 5) {
    const excess = entry.count - 5;
    const wait = Math.min(Math.pow(2, excess), 60) * 1000;
    if (now - entry.time < wait) return false;
  }

  return true;
}

export function recordFailedAuth(ip: string): void {
  const entry = failedAuth.get(ip) ?? { count: 0, time: Date.now() };
  entry.count++;
  entry.time = Date.now();
  failedAuth.set(ip, entry);
}


