import { FreshContext } from "fresh";

export const handler = {
  GET(_ctx: FreshContext): Response {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
