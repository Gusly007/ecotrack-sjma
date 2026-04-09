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
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  return (
    <input 
      type={type}
      className="form-input"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      {...props}
    />
  );
}

export function Select({ value, onChange, options, placeholder, disabled }) {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  
  const safeOptions = Array.isArray(options) ? options : [];
  
  return (
    <select 
      className="form-input"
      value={value || ''}
      onChange={handleChange}
      disabled={disabled}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {safeOptions.map((opt, idx) => (
        opt ? <option key={opt.value ?? idx} value={opt.value ?? ''}>{opt.label ?? opt.value ?? ''}</option> : null
      ))}
    </select>
  );
}

export function Textarea({ value, onChange, placeholder, rows = 3, ...props }) {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  return (
    <textarea 
      className="form-textarea"
      value={value || ''}
      onChange={handleChange}
      placeholder={placeholder}
      rows={rows}
      {...props}
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
