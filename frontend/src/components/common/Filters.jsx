import './Filters.css';

export default function Filters({ children }) {
  return <div className="filters-section">{children}</div>;
}

export function SearchBox({ value, onChange, onSubmit, placeholder = 'Rechercher...' }) {
  const handleBlur = () => {
    onSubmit?.();
  };
  
  return (
    <div className="search-box">
      <i className="fas fa-search"></i>
      <input 
        type="text" 
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
          }
        }}
        onBlur={handleBlur}
      />
    </div>
  );
}

export function SelectFilter({ value, onChange, options, placeholder }) {
  return (
    <select 
      className="form-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
