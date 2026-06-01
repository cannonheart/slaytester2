import { assertStringIncludes } from "$std/assert/mod.ts";
import { render } from "preact-render-to-string";
import { Input } from "./Input.tsx";

Deno.test("Input renders with styled classes and attributes", () => {
  const html = render(
    <Input type="password" name="token" placeholder="Admin" required />,
  );
  assertStringIncludes(html, "type=\"password\"");
  assertStringIncludes(html, "name=\"token\"");
  assertStringIncludes(html, "placeholder=\"Admin\"");
  assertStringIncludes(html, "required");
  assertStringIncludes(html, "rounded-lg");
  assertStringIncludes(html, "border-gray-300");
});
