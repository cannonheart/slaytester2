import { FreshContext } from "$fresh/server.ts";

export const handler = {
  GET(_req: Request, _ctx: FreshContext): Response {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
