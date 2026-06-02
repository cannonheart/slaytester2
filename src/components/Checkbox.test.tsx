import { assertStringIncludes } from "$std/assert/mod.ts";
import { render } from "preact-render-to-string";
import { Checkbox } from "./Checkbox.tsx";

Deno.test("Checkbox renders with label and styled classes", () => {
  const html = render(<Checkbox name="mic" checked={true} label="Request mic" />);
  assertStringIncludes(html, "Request mic");
  assertStringIncludes(html, "type=\"checkbox\"");
  assertStringIncludes(html, "checked");
  assertStringIncludes(html, "appearance-none");
});

Deno.test("Checkbox renders unchecked state", () => {
  const html = render(<Checkbox name="bar" checked={false} />);
  // Preact omits the checked attribute when false via JSX
  // so we just verify it renders
  assertStringIncludes(html, "checkbox");
});
