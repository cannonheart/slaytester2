import { assertStringIncludes } from "$std/assert/mod.ts";
import { render } from "preact-render-to-string";
import { Button } from "./Button.tsx";

Deno.test("Button renders text with button classes", () => {
  const html = render(<Button type="submit">Login</Button>);
  assertStringIncludes(html, "type=\"submit\"");
  assertStringIncludes(html, "bg-black");
  assertStringIncludes(html, "text-white");
  assertStringIncludes(html, "rounded-lg");
  assertStringIncludes(html, "Login");
});
