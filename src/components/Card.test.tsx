import { assertStringIncludes } from "$std/assert/mod.ts";
import { render } from "preact-render-to-string";
import { Card } from "./Card.tsx";

Deno.test("Card renders children with card classes", () => {
  const html = render(<Card><span>content</span></Card>);
  assertStringIncludes(html, "bg-white");
  assertStringIncludes(html, "rounded-2xl");
  assertStringIncludes(html, "shadow-sm");
  assertStringIncludes(html, "max-w-sm");
  assertStringIncludes(html, "content");
});
