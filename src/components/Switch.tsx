export interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** For settings that apply immediately. Inside a form that is submitted, use a checkbox. */
export function Switch({ label, checked, onChange }: SwitchProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="aui-switch" onClick={() => onChange(!checked)}>
      <span className="aui-switch__track" aria-hidden="true"><span className="aui-switch__thumb" /></span>
      {label}
    </button>
  );
}
