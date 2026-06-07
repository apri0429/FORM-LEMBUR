import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from '../layout/icons';

export function SelectFilter({ value, onChange, options, icon: Icon, placeholder, forceDown = false }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const wrapRef = useRef(null);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropHeight = 248;
    const openUp = !forceDown && spaceBelow < dropHeight + 8 && rect.top > dropHeight + 8;
    setDropPos({
      top: openUp ? null : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : null,
      left: rect.left,
      width: rect.width,
      openUp,
    });
  };

  useEffect(() => {
    if (!open) return;
    calcPos();
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        wrapRef.current && !wrapRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onScroll = () => calcPos();
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className="sf-wrap">
      <button
        ref={triggerRef}
        type="button"
        className={`sf-trigger${open ? ' sf-trigger--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {Icon && <span className="sf-icon-left"><Icon style={{ fontSize: 18 }} /></span>}
        <span className="sf-value">
          {selectedLabel ?? (placeholder ? <em>{placeholder}</em> : null)}
        </span>
        <ChevronDown size={16} className="sf-chevron" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={wrapRef}
          className="sf-dropdown"
          role="listbox"
          style={{
            position: 'fixed',
            ...(dropPos.openUp
              ? { bottom: dropPos.bottom, top: 'auto' }
              : { top: dropPos.top, bottom: 'auto' }
            ),
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 9999,
          }}
        >
          {placeholder && (
            <button
              type="button"
              className={`sf-option sf-option--placeholder${value === '' ? ' sf-option--active' : ''}`}
              role="option"
              aria-selected={value === ''}
              onClick={() => { onChange(''); setOpen(false); }}
            >
              {placeholder}
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`sf-option${value === opt.value ? ' sf-option--active' : ''}`}
              role="option"
              aria-selected={value === opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
              {value === opt.value && <Check size={14} />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export function RowsFilter({ rowsPerPage, onChange, label = 'View' }) {
  const ROWS_OPTIONS = [10, 25, 50, 100];
  return (
    <div className="approval-desktop-rows">
      <span className="approval-unified-pagination__label">{label}</span>
      <SelectFilter
        value={String(rowsPerPage)}
        onChange={onChange}
        options={ROWS_OPTIONS.map((r) => ({ value: String(r), label: String(r) }))}
      />
      <span className="approval-unified-pagination__label">rows</span>
    </div>
  );
}

export default SelectFilter;
