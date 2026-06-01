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

  const url = new URL(req.url);
  const query = url.searchParams.get("token");
  if (query && checkToken(query)) return true;

  return false;
}
