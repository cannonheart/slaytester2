export function Input(
  props: { type?: string; name?: string; placeholder?: string; required?: boolean; class?: string },
) {
  return (
    <input
      type={props.type ?? "text"}
      name={props.name}
      placeholder={props.placeholder}
      required={props.required}
      class={`border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gray-500 ${props.class ?? ""}`}
    />
  );
}
