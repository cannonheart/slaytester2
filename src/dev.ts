import { Builder } from "fresh/dev";
import { app } from "./main.ts";
import { tailwind } from "@fresh/plugin-tailwind";

const builder = new Builder({});
tailwind(builder);

if (Deno.args.includes("build")) {
  await builder.build();
} else {
  await builder.listen(async () => app, { port: 5147 });
}
