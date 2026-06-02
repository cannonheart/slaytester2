import { App, staticFiles, trailingSlashes } from "fresh";
import "./lib/env.ts";

export const app = new App()
  .use(staticFiles())
  .use(trailingSlashes("never"));

await app.fsRoutes();

if (import.meta.main) {
  const port = Number(Deno.env.get("PORT") || "5147");
  Deno.serve({ port }, app.handler());
}
