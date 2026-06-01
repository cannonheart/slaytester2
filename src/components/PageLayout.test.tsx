import { assertStringIncludes } from "$std/assert/mod.ts";
import { render } from "preact-render-to-string";
import { PageLayout } from "./PageLayout.tsx";

Deno.test("PageLayout renders children with centered layout classes", () => {
  const html = render(<PageLayout><p>hello</p></PageLayout>);
  assertStringIncludes(html, "min-h-screen");
  assertStringIncludes(html, "items-center");
  assertStringIncludes(html, "justify-center");
  assertStringIncludes(html, "bg-gray-50");
  assertStringIncludes(html, "hello");
});
