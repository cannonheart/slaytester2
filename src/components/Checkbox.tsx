export function Checkbox(
  props: { name?: string; checked?: boolean; label?: string; class?: string },
) {
  return (
    <label class={`inline-flex items-center gap-2 text-sm cursor-pointer ${props.class ?? ""}`}>
      <input
        type="checkbox" name={props.name} value="on"
        checked={props.checked}
        class="appearance-none h-4 w-4 rounded border border-gray-300 bg-white checked:bg-black checked:border-black focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
      />
      {props.label}
    </label>
  );
}
