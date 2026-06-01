import type { ComponentChildren } from "preact";

export function Card({ children }: { children: ComponentChildren }) {
  return (
    <div class="bg-white p-8 rounded-2xl shadow-sm border max-w-sm w-full">
      {children}
    </div>
  );
}
