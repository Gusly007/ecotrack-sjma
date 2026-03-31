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

  return (
    <div className="table-footer">
      <span className="results-count">
        Affichage {showingFrom}-{showingTo || totalItems} sur {totalItems} {label}
      </span>
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn-sm btn-outline" 
            disabled={currentPage === 1}
            onClick={() => onPageChange?.(currentPage - 1)}
          >
            Précédent
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
          {end < totalPages && <span className="pagination-ellipsis">...</span>}
          <button 
            className="btn-sm btn-outline" 
            disabled={currentPage === totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
