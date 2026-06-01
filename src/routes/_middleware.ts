import { FreshContext } from "fresh";
import { isAuthorized } from "../lib/auth.ts";

const PUBLIC_PATHS = new Set(["/login"]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/recorder/")) return true;
  if (/\.\w+$/.test(pathname)) return true;
  return false;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function handler(ctx: FreshContext) {
  const req = ctx.req;

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (!isPublic(ctx.url.pathname)) {
    if (!isAuthorized(req)) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/login" },
      });
    }
  }

  const resp = await ctx.next();

  if (ctx.url.pathname.startsWith("/api/")) {
    const headers = new Headers(resp.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      headers.set(k, v);
    }
    return new Response(resp.body, { status: resp.status, headers });
  }

  return resp;
}
