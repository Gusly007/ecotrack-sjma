import './Pagination.css';

export default function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange,
  showingFrom = 1,
  showingTo,
  totalItems = 0,
  label = 'éléments'
}) {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeTotalItems = totalItems || 0;
  
  return (
    <div className="table-footer" style={{ display: 'flex !important', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
      <span className="results-count">
        {safeTotalPages > 1 
          ? `Affichage ${showingFrom || 1}-${showingTo || safeTotalItems} sur ${safeTotalItems} ${label}`
          : `${safeTotalItems} ${label}${safeTotalItems !== 1 ? 's' : ''}`
        }
      </span>
      <div className="pagination">
        <button 
          className="btn-sm btn-outline" 
          disabled={currentPage === 1}
          onClick={() => onPageChange?.(currentPage - 1)}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        {start > 1 && <span className="pagination-ellipsis">...</span>}
        {pages.map(page => (
          <button
            key={page}
            className={`btn-sm ${page === currentPage ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onPageChange?.(page)}
          >
            {page}
          </button>
        ))}
        {end < safeTotalPages && <span className="pagination-ellipsis">...</span>}
        <button 
          className="btn-sm btn-outline" 
          disabled={currentPage === safeTotalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}
