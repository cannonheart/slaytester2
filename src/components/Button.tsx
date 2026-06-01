import type { ComponentChildren } from "preact";

export function Button({
  children,
  ...props
}: { children: ComponentChildren; type?: string }) {
  return (
    <button
      type={props.type ?? "submit"}
      class="bg-black text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-800 w-full"
    >
      {children}
    </button>
  );
}
