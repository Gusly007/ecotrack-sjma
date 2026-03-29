import './Form.css';

export function FormGroup({ label, children, required }) {
  return (
    <div className="form-group">
      {label && (
        <label>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

export function FormRow({ children }) {
  return <div className="form-row">{children}</div>;
}

export function Input({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  disabled,
  required,
  ...props 
}) {
  return (
    <input 
      type={type}
      className="form-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      {...props}
    />
  );
}

export function Select({ value, onChange, options, placeholder, disabled }) {
  return (
    <select 
      className="form-input"
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea 
      className="form-textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

export function ColorPicker({ value, onChange, colors = [] }) {
  return (
    <div className="color-picker">
      {colors.map(color => (
        <button
          key={color}
          type="button"
          className={`color-option ${value === color ? 'selected' : ''}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
