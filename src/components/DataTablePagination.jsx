import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

/**
 * Reusable DataTable Pagination Component
 * 
 * @param {number} totalItems - Total count of filtered items
 * @param {number} currentPage - Active page (1-based)
 * @param {number|string} pageSize - Number of items per page or 'ALL'
 * @param {function} onPageChange - Callback when page changes (newPage)
 * @param {function} onPageSizeChange - Callback when page size changes (newSize)
 * @param {Array<number|string>} [pageSizeOptions=[10, 25, 50, 100, 'ALL']] - Selectable page sizes
 * @param {string} [itemLabel='entries'] - Label for items (e.g., 'accounts', 'transactions')
 * @param {boolean} [compact=false] - Compact mode for narrow panels
 */
export default function DataTablePagination({
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100, 'ALL'],
  itemLabel = 'entries',
  compact = false
}) {
  const isAll = pageSize === 'ALL';
  const numericSize = isAll ? Math.max(totalItems, 1) : Number(pageSize) || 10;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / numericSize));

  // Determine item range for current page
  const startItem = totalItems === 0 ? 0 : isAll ? 1 : (currentPage - 1) * numericSize + 1;
  const endItem = isAll ? totalItems : Math.min(currentPage * numericSize, totalItems);

  // Calculate page buttons to show (smart window with ellipsis)
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    if (currentPage !== 1) {
      onPageChange(1);
    }
  };

  const handleLast = () => {
    if (currentPage !== totalPages) {
      onPageChange(totalPages);
    }
  };

  if (totalItems === 0) {
    return (
      <div className="datatable-pagination" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <span>No {itemLabel} to display</span>
      </div>
    );
  }

  return (
    <div className={`datatable-pagination ${compact ? 'compact' : ''}`} style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.75rem',
      padding: compact ? '0.5rem 0.75rem' : '0.85rem 1.15rem',
      borderTop: '1px solid var(--border-color)',
      background: 'var(--bg-card)',
      borderBottomLeftRadius: 'inherit',
      borderBottomRightRadius: 'inherit',
      fontSize: '0.78125rem'
    }}>
      {/* Left side: Showing X to Y of Z & Page size selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ color: 'var(--text-secondary)' }}>
          Showing{' '}
          <strong style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
            {startItem.toLocaleString()}
          </strong>{' '}
          to{' '}
          <strong style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
            {endItem.toLocaleString()}
          </strong>{' '}
          of{' '}
          <strong style={{ color: 'var(--primary-brand)', fontWeight: '800' }}>
            {totalItems.toLocaleString()}
          </strong>{' '}
          {itemLabel}
        </div>

        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                onPageSizeChange(val);
                onPageChange(1);
              }}
              className="form-control"
              style={{
                width: 'auto',
                minWidth: '65px',
                height: '28px',
                padding: '0 0.5rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontWeight: '600'
              }}
              title="Rows per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'ALL' ? 'All Rows' : `${opt} / page`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Navigation buttons */}
      {!isAll && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {/* First Page */}
          <button
            onClick={handleFirst}
            disabled={currentPage === 1}
            className="btn btn-ghost btn-sm pagination-nav-btn"
            style={{
              padding: '0.25rem 0.45rem',
              height: '30px',
              minWidth: '30px',
              opacity: currentPage === 1 ? 0.4 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
            title="First Page"
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Previous Page */}
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="btn btn-ghost btn-sm pagination-nav-btn"
            style={{
              padding: '0.25rem 0.45rem',
              height: '30px',
              minWidth: '30px',
              opacity: currentPage === 1 ? 0.4 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page numbers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    style={{
                      padding: '0 0.35rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      userSelect: 'none'
                    }}
                  >
                    …
                  </span>
                );
              }

              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    padding: '0 0.6rem',
                    height: '30px',
                    minWidth: '30px',
                    fontSize: '0.75rem',
                    fontWeight: isActive ? '800' : '500',
                    borderRadius: '6px',
                    border: isActive ? 'none' : '1px solid transparent',
                    background: isActive ? 'var(--primary-brand)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="btn btn-ghost btn-sm pagination-nav-btn"
            style={{
              padding: '0.25rem 0.45rem',
              height: '30px',
              minWidth: '30px',
              opacity: currentPage === totalPages ? 0.4 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>

          {/* Last Page */}
          <button
            onClick={handleLast}
            disabled={currentPage === totalPages}
            className="btn btn-ghost btn-sm pagination-nav-btn"
            style={{
              padding: '0.25rem 0.45rem',
              height: '30px',
              minWidth: '30px',
              opacity: currentPage === totalPages ? 0.4 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
            title="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Custom React hook for seamless DataTable pagination and column sorting (like Bootstrap DataTables)
 * 
 * @param {Array} items - The filtered or raw items list
 * @param {number|string} defaultPageSize - Default rows per page (default: 10)
 * @param {object} [defaultSort={ key: null, direction: 'asc' }] - Initial sort configuration
 */
export function useDataTablePagination(items = [], defaultPageSize = 10, defaultSort = { key: null, direction: 'asc' }) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);
  const [sortConfig, setSortConfig] = React.useState(defaultSort);

  // Sorting function
  const requestSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return { key: null, direction: 'asc' }; // Reset to natural order on 3rd click
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  // Automatically sort items based on sortConfig with smart resolver
  const sortedItems = React.useMemo(() => {
    if (!sortConfig || !sortConfig.key) return items;

    const { key, direction } = sortConfig;
    const factor = direction === 'asc' ? 1 : -1;

    const getVal = (item, k) => {
      if (!item) return '';
      switch (k) {
        case 'debit':
          return item.debit !== undefined ? item.debit : (item.type === 'Dr' ? Number(item.amount || 0) : 0);
        case 'credit':
          return item.credit !== undefined ? item.credit : (item.type === 'Cr' ? Number(item.amount || 0) : 0);
        case 'balance':
          return item.balance !== undefined ? Number(item.balance || 0) : 0;
        case 'amount':
          return item.amount !== undefined ? Number(item.amount || 0) : 0;
        case 'tran_date':
        case 'date':
          return item.tran_date || item.date || '';
        case 'account_no':
        case 'accountNo':
          return item.account_no || item.accountNo || '';
        case 'tran_no':
        case 'tranNo':
          return item.tran_no || item.tranNo || '';
        case 'particulars':
        case 'notes':
          return item.particulars || item.notes || '';
        case 'status':
        case 'audit_status':
          return item.status || item.auditStatus || item.audit_status || '';
        case 'SUB_CATEGORY':
        case 'subcategory':
          return item.subcategory || item.sub_category || item.categoryName || '';
        case 'utr_no':
        case 'UTR NO':
          return item.utr_no || item.utrNo || item['UTR NO'] || '';
        case 'tx_count':
        case 'txCount':
          return item.txCount !== undefined ? item.txCount : (item.tx_count || 0);
        case 'code':
          return item.code || '';
        case 'name':
          return item.name || '';
        case 'type':
          return item.type || '';
        case 'dump_type':
          return item.dump_type || '';
        default:
          return item[k];
      }
    };

    return [...items].sort((a, b) => {
      let valA = getVal(a, key);
      let valB = getVal(b, key);

      // Handle null / undefined
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      // Check if numeric (including string representations of numbers like "123.45" or "₹1,234.50")
      const cleanA = typeof valA === 'string' ? valA.replace(/[₹,\s]/g, '') : valA;
      const cleanB = typeof valB === 'string' ? valB.replace(/[₹,\s]/g, '') : valB;
      const numA = Number(cleanA);
      const numB = Number(cleanB);

      if (!isNaN(numA) && !isNaN(numB) && typeof valA !== 'boolean' && typeof valB !== 'boolean' && cleanA !== '' && cleanB !== '') {
        return (numA - numB) * factor;
      }

      // Check if date string
      if (typeof valA === 'string' && typeof valB === 'string') {
        const isDateA = /^\d{4}-\d{2}-\d{2}/.test(valA);
        const isDateB = /^\d{4}-\d{2}-\d{2}/.test(valB);
        if (isDateA && isDateB) {
          return (new Date(valA) - new Date(valB)) * factor;
        }
      }

      // Default string comparison
      return String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' }) * factor;
    });
  }, [items, sortConfig]);

  const totalItems = sortedItems.length;
  const isAll = pageSize === 'ALL';
  const numericSize = isAll ? Math.max(totalItems, 1) : Number(pageSize) || 10;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / numericSize));

  // Auto-clamp page if it exceeds total pages
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = React.useMemo(() => {
    if (isAll) return sortedItems;
    const startIndex = (currentPage - 1) * numericSize;
    return sortedItems.slice(startIndex, startIndex + numericSize);
  }, [sortedItems, currentPage, numericSize, isAll]);

  // Sort indicator helper for table headers
  const renderSortIndicator = (key) => {
    const isSorted = sortConfig.key === key;
    return (
      <span
        className={`sort-indicator ${isSorted ? 'active' : 'inactive'}`}
        style={{
          marginLeft: '6px',
          fontSize: '0.72rem',
          display: 'inline-block',
          color: isSorted ? 'var(--primary-brand, #3b82f6)' : 'inherit',
          opacity: isSorted ? 1 : 0.35,
          fontWeight: isSorted ? '800' : 'normal',
          verticalAlign: 'middle'
        }}
        aria-hidden="true"
      >
        {!isSorted ? '↕' : sortConfig.direction === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  // Helper props for a <th> to make it sortable with: {...getSortHeaderProps('col_key', optionalStyle)}
  const getSortHeaderProps = (key, customStyle = {}) => {
    const isSorted = sortConfig.key === key;
    return {
      onClick: () => requestSort(key),
      role: 'button',
      tabIndex: 0,
      'aria-sort': isSorted ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none',
      onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          requestSort(key);
        }
      },
      style: {
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.15s ease',
        ...customStyle
      },
      title: `Sort by ${key} (${isSorted && sortConfig.direction === 'asc' ? 'Descending' : 'Ascending'})`
    };
  };

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    paginatedItems,
    sortedItems,
    sortConfig,
    requestSort,
    renderSortIndicator,
    getSortHeaderProps,
    PaginationComponent: (props) => (
      <DataTablePagination
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        {...props}
      />
    )
  };
}
