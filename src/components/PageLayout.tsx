import type { ComponentChildren } from "preact";

export function PageLayout({ children }: { children: ComponentChildren }) {
  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      {children}
    </div>
  );
}
