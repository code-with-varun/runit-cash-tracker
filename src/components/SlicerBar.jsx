import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Filter,
  X,
  RotateCcw,
  Search,
  ChevronDown,
  CheckSquare,
  Square,
  Check,
  ListFilter
} from 'lucide-react';

/**
 * Enterprise Multi-Select Dropdown Slicer Component
 * 
 * Each slicer is rendered as a compact, multiple-select dropdown filter
 * with search within dropdown, select/clear all, and active badges.
 * 
 * @param {Array} groups - Slicer filter groups
 *    Each group has:
 *      - id: string
 *      - label: string
 *      - icon: LucideIcon
 *      - options: Array<{ value, label, count, color, bg }> or Array<string>
 *      - selected: string | Array<string>
 *      - onChange: (newVal: Array<string> | string) => void
 *      - multiSelect: boolean (default true)
 * @param {string} [searchTerm] - Search term value
 * @param {function} [onSearchChange] - Search change handler
 * @param {string} [searchPlaceholder='Search records...']
 * @param {function} [onResetAll] - Callback to reset all slicers
 * @param {number} [totalCount] - Total records count
 * @param {number} [filteredCount] - Filtered records count
 * @param {React.ReactNode} [extraActions] - Additional action buttons
 */
export default function SlicerBar({
  groups = [],
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  onResetAll,
  totalCount,
  filteredCount,
  extraActions
}) {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute active slicers for the breadcrumb tag row
  const activeSlicers = [];

  groups.forEach(g => {
    const isMulti = g.multiSelect !== false;
    const selected = g.selected;

    if (isMulti) {
      const selectedArray = Array.isArray(selected)
        ? selected
        : (selected && selected !== 'ALL' ? [selected] : []);

      const isCustom = selectedArray.length > 0 && !selectedArray.includes('ALL');

      if (isCustom) {
        selectedArray.forEach(val => {
          const opt = (g.options || []).find(o => (typeof o === 'object' ? o.value : o) === val);
          const label = typeof opt === 'object' ? opt.label : opt || val;
          activeSlicers.push({
            groupId: g.id,
            groupLabel: g.label,
            value: val,
            label: `${g.label}: ${label}`,
            onRemove: () => {
              const updated = selectedArray.filter(x => x !== val);
              g.onChange(updated.length === 0 ? ['ALL'] : updated);
            }
          });
        });
      }
    } else {
      if (selected && selected !== 'ALL') {
        const opt = (g.options || []).find(o => (typeof o === 'object' ? o.value : o) === selected);
        const label = typeof opt === 'object' ? opt.label : opt || selected;
        activeSlicers.push({
          groupId: g.id,
          groupLabel: g.label,
          value: selected,
          label: `${g.label}: ${label}`,
          onRemove: () => g.onChange('ALL')
        });
      }
    }
  });

  if (searchTerm && searchTerm.trim()) {
    activeSlicers.push({
      groupId: 'search',
      groupLabel: 'Search',
      value: searchTerm,
      label: `Keyword: "${searchTerm}"`,
      onRemove: () => onSearchChange && onSearchChange('')
    });
  }

  const hasActiveFilters = activeSlicers.length > 0;

  return (
    <div
      ref={containerRef}
      className={`card glass-card slicer-panel-container ${openDropdownId ? 'has-open' : ''}`}
      style={{
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        zIndex: openDropdownId ? 1000 : 20,
        overflow: 'visible'
      }}
    >
      {/* Main Single-Line Toolbar: Search + Multi-Select Slicer Dropdowns + Extra Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem'
      }}>
        {/* Left Section: Live Search Bar & Filtered Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {onSearchChange !== undefined && (
            <div style={{ position: 'relative', width: '260px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="form-control"
                style={{
                  paddingLeft: '2rem',
                  paddingRight: searchTerm ? '2rem' : '0.75rem',
                  height: '34px',
                  fontSize: '0.8125rem',
                  borderRadius: '8px'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Records summary count badge */}
          {filteredCount !== undefined && totalCount !== undefined && (
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span style={{
                fontWeight: '700',
                color: 'var(--text-primary)',
                background: 'var(--bg-input)',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem'
              }}>
                {filteredCount.toLocaleString()} / {totalCount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Center / Right Section: Row of Compact Multi-Select Dropdowns */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          flex: '1 1 auto',
          justifyContent: 'flex-start'
        }}>
          {groups.map((group, idx) => (
            <MultiSelectDropdown
              key={group.id}
              group={group}
              isRightAligned={groups.length > 2 && idx >= groups.length - 2}
              isOpen={openDropdownId === group.id}
              onToggle={() => setOpenDropdownId(openDropdownId === group.id ? null : group.id)}
              onClose={() => setOpenDropdownId(null)}
            />
          ))}
        </div>

        {/* Far Right Section: Extra Action Buttons & Global Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {extraActions}

          {hasActiveFilters && onResetAll && (
            <button
              onClick={onResetAll}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-dr)',
                padding: '0.3rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                background: 'rgba(239, 68, 68, 0.08)',
                fontWeight: '600'
              }}
              title="Reset all active slicers"
            >
              <RotateCcw size={12} />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips Tray (Quick visual tags with '✕' to clear) */}
      {hasActiveFilters && (
        <div style={{
          marginTop: '0.65rem',
          paddingTop: '0.65rem',
          borderTop: '1px dashed var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.35rem',
          fontSize: '0.6875rem'
        }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.65rem' }}>
            Active Slicers:
          </span>
          {activeSlicers.map((s, idx) => (
            <span
              key={`${s.groupId}-${s.value}-${idx}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--primary-brand)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                fontWeight: '600',
                fontSize: '0.7rem'
              }}
            >
              <span>{s.label}</span>
              <button
                onClick={s.onRemove}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Remove filter"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          {onResetAll && (
            <button
              onClick={onResetAll}
              className="btn btn-ghost"
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                padding: '2px 6px',
                textDecoration: 'underline',
                fontWeight: '600'
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Multi-Select Dropdown Popover Slicer
 */
function MultiSelectDropdown({ group, isOpen, onToggle, onClose, isRightAligned = false }) {
  const [optionSearch, setOptionSearch] = useState('');
  const GroupIcon = group.icon || ListFilter;
  const isMulti = group.multiSelect !== false;
  const options = group.options || [];

  // Normalize selected state to an array for multi-select
  const selectedArray = useMemo(() => {
    if (Array.isArray(group.selected)) {
      return group.selected;
    }
    if (group.selected && group.selected !== 'ALL') {
      return [group.selected];
    }
    return ['ALL'];
  }, [group.selected]);

  // Is this dropdown actively filtering?
  const isAllSelected = selectedArray.length === 0 || selectedArray.includes('ALL');
  const isActive = !isAllSelected && selectedArray.length > 0;

  // Compute trigger button label
  const triggerLabel = useMemo(() => {
    if (isAllSelected) {
      return `${group.label}: All`;
    }
    if (selectedArray.length === 1) {
      const matchOpt = options.find(o => (typeof o === 'object' ? o.value : o) === selectedArray[0]);
      const optLabel = typeof matchOpt === 'object' ? matchOpt.label : matchOpt || selectedArray[0];
      return `${group.label}: ${optLabel}`;
    }
    return `${group.label} (${selectedArray.length})`;
  }, [group.label, isAllSelected, selectedArray, options]);

  // Handle option toggle in multi-select mode
  const handleToggleOption = (val) => {
    if (!isMulti) {
      group.onChange(val);
      onClose();
      return;
    }

    if (val === 'ALL') {
      group.onChange(['ALL']);
      return;
    }

    let nextSelected = selectedArray.filter(x => x !== 'ALL');
    if (nextSelected.includes(val)) {
      nextSelected = nextSelected.filter(x => x !== val);
    } else {
      nextSelected = [...nextSelected, val];
    }

    if (nextSelected.length === 0) {
      group.onChange(['ALL']);
    } else {
      group.onChange(nextSelected);
    }
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    group.onChange(['ALL']);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    group.onChange(['ALL']);
  };

  // Filter options if optionSearch is provided
  const filteredOptions = useMemo(() => {
    if (!optionSearch.trim()) return options;
    const q = optionSearch.toLowerCase();
    return options.filter(opt => {
      const label = (typeof opt === 'object' ? opt.label : opt) || '';
      return String(label).toLowerCase().includes(q);
    });
  }, [options, optionSearch]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={onToggle}
        className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
        style={{
          fontSize: '0.75rem',
          height: '34px',
          padding: '0.3rem 0.65rem',
          borderRadius: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          border: isActive
            ? '1px solid var(--primary-brand)'
            : '1px solid var(--border-color)',
          background: isActive
            ? 'rgba(59, 130, 246, 0.12)'
            : 'var(--bg-input)',
          color: isActive ? 'var(--primary-brand)' : 'var(--text-primary)',
          fontWeight: isActive ? '700' : '500',
          transition: 'all 0.15s ease'
        }}
        title={`Filter by ${group.label}`}
      >
        <GroupIcon size={13} style={{ color: isActive ? 'var(--primary-brand)' : 'var(--text-muted)' }} />
        <span>{triggerLabel}</span>
        {isActive && (
          <span
            style={{
              background: 'var(--primary-brand)',
              color: '#fff',
              fontSize: '0.625rem',
              fontWeight: '800',
              padding: '1px 6px',
              borderRadius: '10px',
              marginLeft: '2px'
            }}
          >
            {selectedArray.length}
          </span>
        )}
        <ChevronDown
          size={13}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'var(--text-muted)'
          }}
        />
        {isActive && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              group.onChange(['ALL']);
            }}
            style={{
              padding: '1px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              color: 'var(--text-muted)',
              marginLeft: '2px'
            }}
            title="Reset this filter"
          >
            <X size={12} />
          </span>
        )}
      </button>

      {/* Dropdown Floating Popover */}
      {isOpen && (
        <div
          className="slicer-dropdown-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: isRightAligned ? 'auto' : 0,
            right: isRightAligned ? 0 : 'auto',
            zIndex: 999999,
            minWidth: '240px',
            maxWidth: '320px',
            background: 'var(--bg-card-solid)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.25)',
            padding: '0.6rem',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Header with Quick Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.4rem',
            marginBottom: '0.4rem',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.71875rem'
          }}>
            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
              {group.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                className="btn btn-ghost btn-sm"
                style={{ padding: '1px 5px', fontSize: '0.6875rem', color: 'var(--primary-brand)', fontWeight: '600' }}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-ghost btn-sm"
                style={{ padding: '1px 5px', fontSize: '0.6875rem', color: 'var(--text-muted)' }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Search box inside dropdown if many options */}
          {options.length > 5 && (
            <div style={{ position: 'relative', marginBottom: '0.45rem' }}>
              <Search
                size={12}
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                placeholder={`Search ${group.label.toLowerCase()}...`}
                value={optionSearch}
                onChange={(e) => setOptionSearch(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  height: '28px',
                  fontSize: '0.75rem',
                  paddingLeft: '1.75rem',
                  paddingRight: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {/* Scrollable Checkbox List */}
          <div style={{
            maxHeight: '220px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                No options match "{optionSearch}"
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const val = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                const optCount = typeof opt === 'object' ? opt.count : undefined;
                const customBg = typeof opt === 'object' ? opt.bg : undefined;
                const customColor = typeof opt === 'object' ? opt.color : undefined;

                const isChecked = val === 'ALL'
                  ? isAllSelected
                  : selectedArray.includes(val);

                return (
                  <div
                    key={val}
                    onClick={() => handleToggleOption(val)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      background: isChecked ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      color: isChecked ? 'var(--primary-brand)' : 'var(--text-primary)',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isChecked) e.currentTarget.style.background = 'var(--bg-card-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isChecked) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                      {isChecked ? (
                        <CheckSquare size={14} style={{ color: 'var(--primary-brand)', flexShrink: 0 }} />
                      ) : (
                        <Square size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      )}
                      <span style={{
                        fontWeight: isChecked ? '700' : '500',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                        {optLabel}
                      </span>
                    </div>

                    {optCount !== undefined && (
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: customBg || 'var(--bg-input)',
                        color: customColor || 'var(--text-muted)',
                        fontWeight: '700',
                        marginLeft: '0.5rem',
                        flexShrink: 0
                      }}>
                        {optCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Done button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.4rem',
            marginTop: '0.4rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.6875rem'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isAllSelected ? 'All selected' : `${selectedArray.length} selected`}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary btn-sm"
              style={{ padding: '0.2rem 0.65rem', fontSize: '0.7rem', fontWeight: '700' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
