import './Button.css';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  
  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className} ${loading ? 'btn-loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <i className="fas fa-spinner fa-spin btn-spinner"></i>}
      {icon && !loading && <i className={`fas ${icon}`}></i>}
      {children}
    </button>
  );
}
