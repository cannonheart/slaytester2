import type { ComponentChildren } from "preact";

export function Heading({ children }: { children: ComponentChildren }) {
  return (
    <h1 class="text-2xl font-bold text-center mb-6">{children}</h1>
  );
}
