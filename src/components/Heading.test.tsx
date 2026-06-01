import { assertStringIncludes } from "$std/assert/mod.ts";
import { render } from "preact-render-to-string";
import { Heading } from "./Heading.tsx";

Deno.test("Heading renders text with heading classes", () => {
  const html = render(<Heading>Title Here</Heading>);
  assertStringIncludes(html, "text-2xl");
  assertStringIncludes(html, "font-bold");
  assertStringIncludes(html, "text-center");
  assertStringIncludes(html, "Title Here");
});
