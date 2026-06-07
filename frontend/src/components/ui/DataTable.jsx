import React, { useState } from 'react';
import '../../styles/templateComponents.css';

/* ── DataTableStatus ──────────────────────────────────────────────────────── */
export function DataTableStatus({ variant, inline, children }) {
  const cls = [
    'users-table__status',
    inline  ? 'users-table__status--inline' : '',
    variant === 'app'     ? 'users-table__status--app'     : '',
    variant === 'active'  ? 'users-table__status--active'  : '',
    variant === 'pending' ? 'users-table__status--pending' : '',
  ].filter(Boolean).join(' ');
  return <span className={cls}>{children}</span>;
}

/* ── Pagination ───────────────────────────────────────────────────────────── */
function Pagination({ pagination }) {
  if (!pagination) return null;
  const {
    summary, currentPage, totalPages, items,
    onPrevious, onNext, onSelect,
    previousLabel = 'Previous', nextLabel = 'Next',
    pageSizeNode,
  } = pagination;

  return (
    <div className="users-table-pagination">
      <div className="users-table-pagination__left">
        {summary && (
          <span className="users-table-pagination__summary">{summary}</span>
        )}
        {pageSizeNode && (
          <div className="users-table-pagination__meta">
            {pageSizeNode}
          </div>
        )}
      </div>
      <div className="users-table-pagination__controls">
        <button
          type="button"
          className="users-table-pagination__button"
          onClick={onPrevious}
          disabled={currentPage <= 1}
        >
          {previousLabel}
        </button>

        {(items || []).map((item, i) =>
          item === '...' ? (
            <span key={`ell-${i}`} className="users-table-pagination__ellipsis">…</span>
          ) : (
            <button
              key={item}
              type="button"
              className={`users-table-pagination__button${item === currentPage ? ' users-table-pagination__button--active' : ''}`}
              onClick={() => onSelect(item)}
              disabled={item === currentPage}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          className="users-table-pagination__button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

/* ── DataTable ────────────────────────────────────────────────────────────── */
export default function DataTable({
  rows = [],
  columns = [],
  getRowId,
  detail,
  pagination,
  tableLabel,
  className,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const totalCols = columns.length + (detail ? 1 : 0);

  const toggleRow = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className={['users-table-card', className].filter(Boolean).join(' ')}>
      <div className="users-table-wrapper">
        <table
          className="users-table"
          aria-label={tableLabel}
          style={{ width: '100%', borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={col.cellStyle}>{col.header}</th>
              ))}
              {detail && (
                <th className="users-table__detail-header" style={{ width: '1%', whiteSpace: 'nowrap' }}>
                  {detail.columnLabel || 'Detail'}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map(row => {
              const id       = getRowId ? getRowId(row) : row.id;
              const expanded = expandedId === id;

              return (
                <React.Fragment key={id}>
                  <tr
                    className={`users-table__row${expanded ? ' users-table__row--expanded' : ''}`}
                    onClick={detail ? () => toggleRow(id) : undefined}
                    style={detail ? { cursor: 'pointer' } : undefined}
                  >
                    {columns.map(col => (
                      <td key={col.key} style={col.cellStyle}>
                        {col.render
                          ? col.render(row)
                          : col.accessor
                          ? row[col.accessor]
                          : row[col.key]}
                      </td>
                    ))}

                    {detail && (
                      <td
                        className="users-table__detail-cell"
                        onClick={e => { e.stopPropagation(); toggleRow(id); }}
                        style={{ textAlign: 'center' }}
                      >
                        <button
                          type="button"
                          className="users-table__detail-button"
                          aria-expanded={expanded}
                        >
                          <span className="users-table__detail-icon-label">
                            {detail.buttonLabel || 'Detail'}
                          </span>
                          <span className={`users-table__detail-icon${expanded ? ' users-table__detail-icon--open' : ''}`}>
                            ▾
                          </span>
                        </button>
                      </td>
                    )}
                  </tr>

                  {detail && expanded && (
                    <tr className="users-table__accordion-row">
                      <td colSpan={totalCols} style={{ padding: '0 0 10px' }}>
                        <div className="users-table__accordion">
                          {(detail.eyebrow || detail.title || detail.description) && (
                            <div style={{ marginBottom: 4 }}>
                              {detail.eyebrow && (
                                <p className="users-table__accordion-eyebrow">{detail.eyebrow}</p>
                              )}
                              {detail.title && (
                                <p className="users-table__accordion-title">
                                  {typeof detail.title === 'function' ? detail.title(row) : detail.title}
                                </p>
                              )}
                              {detail.description && (
                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#7f8ea3' }}>
                                  {typeof detail.description === 'function' ? detail.description(row) : detail.description}
                                </p>
                              )}
                            </div>
                          )}

                          {detail.render && detail.render(row)}

                          {detail.actions && detail.actions.filter(a => !a.hidden || !a.hidden(row)).length > 0 && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8 }}>
                              {detail.actions
                                .filter(a => !a.hidden || !a.hidden(row))
                                .map(a => (
                                  <button
                                    key={a.key}
                                    type="button"
                                    className={`dashboard-popup__button dashboard-popup__button--${a.variant === 'danger' ? 'danger' : 'primary'}`}
                                    style={{ height: 34, fontSize: '0.82rem', padding: '0 16px' }}
                                    onClick={e => { e.stopPropagation(); a.onClick(row); }}
                                  >
                                    {a.label}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={totalCols}
                  className="users-table__empty"
                  style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontStyle: 'italic' }}
                >
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination pagination={pagination} />
    </div>
  );
}
