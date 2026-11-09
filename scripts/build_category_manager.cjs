const fs = require('fs');

const fileContent = `import React, { useState, useMemo } from 'react';
import {
  Tags,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Layers,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Target,
  Star,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  X,
  Compass,
  PieChart,
  Briefcase,
  FolderGit2,
  HelpCircle,
  Building2,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { exportCategoriesToExcel, parseCategoriesExcel, downloadCategoryMasterTemplate } from '../utils/excel';
import {
  importStandardCategoriesAPI,
  addMasterAPI,
  updateMasterAPI,
  deleteMasterAPI,
  resetDefaultMastersAPI
} from '../utils/api';
import SlicerBar from './SlicerBar';
import DataTablePagination, { useDataTablePagination } from './DataTablePagination';

export const DIVISIONS = [
  'LIVING',
  'MOBILITY',
  'EARNINGS',
  'PROTECTION',
  'WEALTH',
  'LIFESTYLE',
  'COMPLIANCE',
  'SERVICES',
  'FINANCING',
  'ROTATIONS',
  'INTERNAL'
];

export const SUB_TYPES = [
  'NEEDS',
  'WANTS',
  'EMERGENCY',
  'INCOME',
  'ASSETS',
  'REPAYMENTS',
  'LOANS',
  'LEVERAGE',
  'RECEIVABLES',
  'INTERNAL'
];

export const TRANSACTION_TYPES = ['ACTUAL', 'COMPENSATIONAL', 'ROTATIONAL'];

export default function CategoryManager({
  categories = [],
  masters = { budgets: [], cost_centers: [], profit_centers: [], projects: [] },
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onBulkAddCategories,
  onReloadCategories,
  onReloadMasters,
}) {
  const [activeMasterTab, setActiveMasterTab] = useState('taxonomy'); // 'taxonomy' | 'budgets' | 'cost_centers' | 'profit_centers' | 'projects'
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportingStandard, setIsImportingStandard] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [selectedTxType, setSelectedTxType] = useState('ALL');
  const [selectedSubType, setSelectedSubType] = useState('ALL');
  const [viewMode, setViewMode] = useState('table');
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Category Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'add',
    category: null
  });

  const [formData, setFormData] = useState({
    id: null,
    subcategory: '',
    category: 'PROVISIONS',
    division: 'LIVING',
    suffix: 'DR',
    info_type: 'BOTH',
    transaction_type: 'ACTUAL',
    group_type: 'LIVING',
    net_type: 'NEEDS',
    sub_type: 'NEEDS',
    description: '',
    type: 'Dr'
  });

  // Management Master Modal State
  const [masterModalState, setMasterModalState] = useState({
    isOpen: false,
    mode: 'add', // 'add' | 'edit'
    type: 'budgets', // 'budgets' | 'cost_centers' | 'profit_centers' | 'projects'
    item: null
  });

  const [masterFormData, setMasterFormData] = useState({
    id: null,
    code: '',
    name: '',
    description: '',
    category_group: 'LIVING',
    status: 'active'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Statistics for Categories
  const stats = useMemo(() => {
    const total = categories.length;
    const actual = categories.filter(c => (c.transaction_type || 'ACTUAL') === 'ACTUAL').length;
    const rotational = categories.filter(c => c.transaction_type === 'ROTATIONAL').length;
    const compensational = categories.filter(c => c.transaction_type === 'COMPENSATIONAL').length;
    const needs = categories.filter(c => c.sub_type === 'NEEDS').length;
    const wants = categories.filter(c => c.sub_type === 'WANTS').length;
    const emergency = categories.filter(c => c.sub_type === 'EMERGENCY').length;

    return { total, actual, rotational, compensational, needs, wants, emergency };
  }, [categories]);

  const matchesMulti = (filterVal, itemVal) => {
    if (!filterVal || filterVal === 'ALL') return true;
    if (Array.isArray(filterVal)) {
      if (filterVal.length === 0 || filterVal.includes('ALL')) return true;
      return filterVal.includes(itemVal);
    }
    return filterVal === itemVal;
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      const subcat = (c.subcategory || c.name || '').toLowerCase();
      const parentCat = (c.category || '').toLowerCase();
      const div = (c.division || '').toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = !searchTerm || subcat.includes(search) || parentCat.includes(search) || div.includes(search) || desc.includes(search);
      const matchesDivision = matchesMulti(selectedDivision, c.division);
      const matchesTxType = matchesMulti(selectedTxType, c.transaction_type || 'ACTUAL');
      const matchesSubType = matchesMulti(selectedSubType, c.sub_type);

      return matchesSearch && matchesDivision && matchesTxType && matchesSubType;
    });
  }, [categories, searchTerm, selectedDivision, selectedTxType, selectedSubType]);

  // DataTable Pagination Hook for Categories
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedCategories,
    PaginationComponent,
    getSortHeaderProps,
    renderSortIndicator
  } = useDataTablePagination(filteredCategories, 15);

  // Slicer Groups Configuration for Category Taxonomy
  const categorySlicerGroups = [
    {
      id: 'division',
      label: 'Division',
      icon: Layers,
      selected: selectedDivision,
      onChange: setSelectedDivision,
      options: [
        { value: 'ALL', label: 'All Divisions', count: categories.length },
        ...DIVISIONS.map(d => ({
          value: d,
          label: d,
          count: categories.filter(c => c.division === d).length
        }))
      ]
    },
    {
      id: 'txType',
      label: 'Tx Type',
      icon: Target,
      selected: selectedTxType,
      onChange: setSelectedTxType,
      options: [
        { value: 'ALL', label: 'All Tx Types', count: categories.length },
        { value: 'ACTUAL', label: 'ACTUAL', count: stats.actual, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
        { value: 'COMPENSATIONAL', label: 'COMPENSATIONAL', count: stats.compensational, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
        { value: 'ROTATIONAL', label: 'ROTATIONAL', count: stats.rotational, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }
      ]
    },
    {
      id: 'subType',
      label: 'SubType',
      icon: Star,
      selected: selectedSubType,
      onChange: setSelectedSubType,
      options: [
        { value: 'ALL', label: 'All SubTypes', count: categories.length },
        ...SUB_TYPES.map(st => ({
          value: st,
          label: st,
          count: categories.filter(c => c.sub_type === st).length
        }))
      ]
    }
  ];

  // Open Add Category Modal
  const handleOpenAddCategory = () => {
    setFormData({
      id: null,
      subcategory: '',
      category: 'PROVISIONS',
      division: 'LIVING',
      suffix: 'DR',
      info_type: 'BOTH',
      transaction_type: 'ACTUAL',
      group_type: 'LIVING',
      net_type: 'NEEDS',
      sub_type: 'NEEDS',
      description: '',
      type: 'Dr'
    });
    setModalState({ isOpen: true, mode: 'add', category: null });
  };

  // Open Edit Category Modal
  const handleOpenEditCategory = (cat) => {
    setFormData({
      id: cat.id,
      subcategory: cat.subcategory || cat.name || '',
      category: cat.category || 'GENERAL',
      division: cat.division || 'LIVING',
      suffix: cat.suffix || (cat.type === 'Cr' ? 'CR' : 'DR'),
      info_type: cat.info_type || 'BOTH',
      transaction_type: cat.transaction_type || 'ACTUAL',
      group_type: cat.group_type || cat.division || 'LIVING',
      net_type: cat.net_type || cat.sub_type || 'NEEDS',
      sub_type: cat.sub_type || 'NEEDS',
      description: cat.description || '',
      type: cat.type || 'Dr'
    });
    setModalState({ isOpen: true, mode: 'edit', category: cat });
  };

  // Save Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.subcategory.trim()) {
      setError('SubCategory Name is required.');
      return;
    }

    const payload = {
      ...formData,
      name: formData.subcategory.trim(),
      subcategory: formData.subcategory.trim(),
      category: formData.category.trim(),
      division: formData.division.trim(),
      group_type: formData.division.trim(),
      net_type: formData.sub_type.trim(),
      sub_type: formData.sub_type.trim(),
      description: formData.description.trim(),
      type: formData.division === 'EARNINGS' || formData.sub_type === 'INCOME' ? 'Cr' : formData.type,
      suffix: formData.division === 'EARNINGS' || formData.sub_type === 'INCOME' ? 'CR' : formData.suffix
    };

    try {
      if (modalState.mode === 'add') {
        if (onAddCategory) await onAddCategory(payload);
        setSuccess('Category created successfully!');
      } else {
        if (onUpdateCategory) await onUpdateCategory(payload);
        setSuccess('Category updated successfully!');
      }
      setModalState({ isOpen: false, mode: 'add', category: null });
      if (onReloadCategories) await onReloadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save category.');
    }
  };

  // Import Standard 64 Taxonomy Categories
  const handleImportStandard = async () => {
    if (!window.confirm('Import the official 64-item Category Taxonomy into your account? This ensures complete synchronization with standard reporting masters.')) {
      return;
    }

    try {
      setIsImportingStandard(true);
      await importStandardCategoriesAPI();
      setSuccess('Successfully imported standard taxonomy categories!');
      if (onReloadCategories) await onReloadCategories();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to import standard categories.');
    } finally {
      setIsImportingStandard(false);
    }
  };

  // Export Categories to Excel
  const handleExportCategories = () => {
    exportCategoriesToExcel(categories);
  };

  // Import Categories Excel
  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseCategoriesExcel(file);
      if (parsed && parsed.length > 0) {
        if (onBulkAddCategories) {
          await onBulkAddCategories(parsed);
          setSuccess(\`Successfully imported \${parsed.length} categories from Excel!\`);
          if (onReloadCategories) await onReloadCategories();
          setTimeout(() => setSuccess(''), 3500);
        }
      } else {
        setError('No valid categories found in the uploaded file.');
      }
    } catch (err) {
      setError('Excel import failed: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  // Open Master Modal (Budgets, Cost Centers, Profit Centers, Projects)
  const handleOpenMasterModal = (type, mode = 'add', item = null) => {
    setMasterModalState({ isOpen: true, mode, type, item });
    if (mode === 'edit' && item) {
      setMasterFormData({
        id: item.id,
        code: item.code || '',
        name: item.name || '',
        description: item.description || '',
        category_group: item.category_group || 'LIVING',
        status: item.status || 'active'
      });
    } else {
      const list = masters[type] || [];
      const prefix = type === 'budgets' ? 'B' : type === 'cost_centers' ? 'CC' : type === 'profit_centers' ? 'PC' : 'PR';
      setMasterFormData({
        id: null,
        code: \`\${prefix}\${String(list.length + 1).padStart(3, '0')}\`,
        name: '',
        description: '',
        category_group: 'LIVING',
        status: 'active'
      });
    }
  };

  // Save Master item
  const handleSaveMaster = async (e) => {
    e.preventDefault();
    if (!masterFormData.name.trim()) {
      alert('Master Name is required.');
      return;
    }

    try {
      const payload = {
        ...masterFormData,
        type: masterModalState.type
      };

      if (masterModalState.mode === 'add') {
        await addMasterAPI(payload);
        setSuccess(\`Created \${masterFormData.name} successfully!\`);
      } else {
        await updateMasterAPI(payload);
        setSuccess(\`Updated \${masterFormData.name} successfully!\`);
      }

      setMasterModalState({ isOpen: false, mode: 'add', type: 'budgets', item: null });
      if (onReloadMasters) await onReloadMasters();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Failed to save master: ' + err.message);
    }
  };

  // Delete Master item
  const handleDeleteMaster = async (type, id, name) => {
    if (!window.confirm(\`Are you sure you want to delete "\${name}" from \${type}?\`)) return;
    try {
      await deleteMasterAPI(id, type);
      setSuccess(\`Deleted "\${name}" successfully!\`);
      if (onReloadMasters) await onReloadMasters();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Failed to delete master: ' + err.message);
    }
  };

  // Reset Default Masters
  const handleResetDefaultMasters = async () => {
    if (!window.confirm('Reset all management masters (Budgets B001-B008, Cost Centers CC001-CC008, Profit Centers PC001-PC006, Projects PR001-PR005) to default?')) {
      return;
    }
    try {
      await resetDefaultMastersAPI();
      setSuccess('Restored default management masters!');
      if (onReloadMasters) await onReloadMasters();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Failed to reset default masters: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner / Education on Taxonomy Hierarchies */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem', borderLeft: '4px solid var(--primary-brand)', background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(16,185,129,0.03) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Compass size={18} style={{ color: 'var(--primary-brand)' }} />
              <h2 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Enterprise Financial Taxonomy & Management Masters
              </h2>
              <span className="badge badge-primary" style={{ fontSize: '0.6875rem', fontWeight: '800' }}>2026 ARCHITECTURE</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '960px', lineHeight: 1.5 }}>
              <strong>Category = What happened?</strong> (Fixed functional hierarchy: Division &gt; Category &gt; SubCategory).<br />
              <strong>Budget = Spending Plan?</strong> | <strong>Cost Center = Consumed By Whom?</strong> | <strong>Profit Center = Earned By Whom?</strong> | <strong>Project = For What Purpose?</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={handleImportStandard}
              disabled={isImportingStandard}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem' }}
              title="Import 64-item standardized category taxonomy"
            >
              <RefreshCw size={13} className={isImportingStandard ? 'animate-spin' : ''} style={{ marginRight: '5px' }} />
              {isImportingStandard ? 'Importing...' : 'Sync Standard 64 Taxonomy'}
            </button>
            <button
              onClick={handleResetDefaultMasters}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem' }}
              title="Reset Budgets, Cost Centers, Profit Centers, Projects to standard"
            >
              <Sparkles size={13} style={{ marginRight: '5px', color: '#eab308' }} />
              Reset Default Masters
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={15} /></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={15} /></button>
        </div>
      )}

      {/* Primary Masters Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => setActiveMasterTab('taxonomy')}
          style={{
            padding: '0.65rem 1.15rem',
            background: activeMasterTab === 'taxonomy' ? 'var(--primary-brand)' : 'transparent',
            color: activeMasterTab === 'taxonomy' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            fontWeight: '700',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Tags size={15} />
          Category Taxonomy
          <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '10px', background: activeMasterTab === 'taxonomy' ? 'rgba(255,255,255,0.25)' : 'var(--border-color)', color: activeMasterTab === 'taxonomy' ? '#fff' : 'var(--text-primary)' }}>
            {categories.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMasterTab('budgets')}
          style={{
            padding: '0.65rem 1.15rem',
            background: activeMasterTab === 'budgets' ? 'var(--primary-brand)' : 'transparent',
            color: activeMasterTab === 'budgets' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            fontWeight: '700',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Target size={15} />
          Budget Master (Why/Bucket)
          <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '10px', background: activeMasterTab === 'budgets' ? 'rgba(255,255,255,0.25)' : 'var(--border-color)', color: activeMasterTab === 'budgets' ? '#fff' : 'var(--text-primary)' }}>
            {(masters.budgets || []).length}
          </span>
        </button>

        <button
          onClick={() => setActiveMasterTab('cost_centers')}
          style={{
            padding: '0.65rem 1.15rem',
            background: activeMasterTab === 'cost_centers' ? 'var(--primary-brand)' : 'transparent',
            color: activeMasterTab === 'cost_centers' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            fontWeight: '700',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Building2 size={15} />
          Cost Center Master (Where/Who)
          <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '10px', background: activeMasterTab === 'cost_centers' ? 'rgba(255,255,255,0.25)' : 'var(--border-color)', color: activeMasterTab === 'cost_centers' ? '#fff' : 'var(--text-primary)' }}>
            {(masters.cost_centers || []).length}
          </span>
        </button>

        <button
          onClick={() => setActiveMasterTab('profit_centers')}
          style={{
            padding: '0.65rem 1.15rem',
            background: activeMasterTab === 'profit_centers' ? 'var(--primary-brand)' : 'transparent',
            color: activeMasterTab === 'profit_centers' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            fontWeight: '700',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <TrendingUp size={15} />
          Profit Center Master (Income Earners)
          <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '10px', background: activeMasterTab === 'profit_centers' ? 'rgba(255,255,255,0.25)' : 'var(--border-color)', color: activeMasterTab === 'profit_centers' ? '#fff' : 'var(--text-primary)' }}>
            {(masters.profit_centers || []).length}
          </span>
        </button>

        <button
          onClick={() => setActiveMasterTab('projects')}
          style={{
            padding: '0.65rem 1.15rem',
            background: activeMasterTab === 'projects' ? 'var(--primary-brand)' : 'transparent',
            color: activeMasterTab === 'projects' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            fontWeight: '700',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <FolderGit2 size={15} />
          Project Master (Purpose)
          <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '10px', background: activeMasterTab === 'projects' ? 'rgba(255,255,255,0.25)' : 'var(--border-color)', color: activeMasterTab === 'projects' ? '#fff' : 'var(--text-primary)' }}>
            {(masters.projects || []).length}
          </span>
        </button>
      </div>

      {/* TAB 1: CATEGORY TAXONOMY VIEW */}
      {activeMasterTab === 'taxonomy' && (
        <>
          {/* Action Toolbar */}
          <div className="glass-card" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search subcategory, category, division, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.8125rem' }}
                />
              </div>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="btn btn-outline" style={{ height: '36px', padding: '0 0.6rem' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={handleOpenAddCategory} className="btn btn-primary" style={{ fontSize: '0.8125rem', height: '36px', padding: '0 0.9rem' }}>
                <Plus size={15} style={{ marginRight: '5px' }} />
                Add Category
              </button>

              <button onClick={handleExportCategories} className="btn btn-outline" style={{ fontSize: '0.8125rem', height: '36px', padding: '0 0.85rem' }} title="Export Category Taxonomy Excel">
                <Download size={14} style={{ marginRight: '5px' }} />
                Export XLSX
              </button>

              <label className="btn btn-outline" style={{ fontSize: '0.8125rem', height: '36px', padding: '0 0.85rem', cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center' }} title="Import Category Taxonomy Excel">
                <Upload size={14} style={{ marginRight: '5px' }} />
                Import XLSX
                <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} style={{ display: 'none' }} />
              </label>

              <button onClick={downloadCategoryMasterTemplate} className="btn btn-outline" style={{ fontSize: '0.8125rem', height: '36px', padding: '0 0.75rem' }} title="Download Template">
                <FileSpreadsheet size={14} />
              </button>
            </div>
          </div>

          {/* Slicers Bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <SlicerBar
              groups={categorySlicerGroups}
              onResetFilters={() => {
                setSelectedDivision('ALL');
                setSelectedTxType('ALL');
                setSelectedSubType('ALL');
                setSearchTerm('');
              }}
            />
          </div>

          {/* Categories Grid / Table */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-solid)', borderBottom: '1px solid var(--border-color)' }}>
                    <th {...getSortHeaderProps('id')} style={{ padding: '0.75rem 1rem', width: '60px', textAlign: 'center' }}>
                      # {renderSortIndicator('id')}
                    </th>
                    <th {...getSortHeaderProps('subcategory')} style={{ padding: '0.75rem 1rem', minWidth: '170px' }}>
                      SUBCATEGORY {renderSortIndicator('subcategory')}
                    </th>
                    <th {...getSortHeaderProps('category')} style={{ padding: '0.75rem 1rem', minWidth: '140px' }}>
                      CATEGORY {renderSortIndicator('category')}
                    </th>
                    <th {...getSortHeaderProps('division')} style={{ padding: '0.75rem 1rem', minWidth: '130px' }}>
                      DIVISION {renderSortIndicator('division')}
                    </th>
                    <th {...getSortHeaderProps('sub_type')} style={{ padding: '0.75rem 1rem', minWidth: '120px' }}>
                      SUBTYPE {renderSortIndicator('sub_type')}
                    </th>
                    <th {...getSortHeaderProps('transaction_type')} style={{ padding: '0.75rem 1rem', minWidth: '130px' }}>
                      TX TYPE {renderSortIndicator('transaction_type')}
                    </th>
                    <th style={{ padding: '0.75rem 1rem', minWidth: '280px' }}>
                      DESCRIPTION
                    </th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '90px' }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategories.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No categories found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedCategories.map((c, idx) => {
                      const isEarnings = c.division === 'EARNINGS' || c.sub_type === 'INCOME';
                      const isRotational = c.transaction_type === 'ROTATIONAL';
                      const isCompensational = c.transaction_type === 'COMPENSATIONAL';

                      return (
                        <tr
                          key={c.id || idx}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-card-solid)'
                          }}
                        >
                          <td style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>
                            {c.id}
                          </td>
                          <td style={{ padding: '0.65rem 1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                            {c.subcategory || c.name}
                          </td>
                          <td style={{ padding: '0.65rem 1rem' }}>
                            <span className="badge badge-neutral" style={{ fontSize: '0.71875rem', fontWeight: '700' }}>
                              {c.category}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 1rem' }}>
                            <span style={{
                              fontSize: '0.71875rem',
                              fontWeight: '800',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: isEarnings ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.12)',
                              color: isEarnings ? 'var(--accent-cr)' : 'var(--primary-brand)'
                            }}>
                              {c.division}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 1rem' }}>
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: c.sub_type === 'EMERGENCY' ? 'rgba(239,68,68,0.12)' : c.sub_type === 'NEEDS' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                              color: c.sub_type === 'EMERGENCY' ? '#ef4444' : c.sub_type === 'NEEDS' ? '#3b82f6' : '#f59e0b'
                            }}>
                              {c.sub_type}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 1rem' }}>
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: '800',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: isRotational ? 'rgba(234,179,8,0.15)' : isCompensational ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.1)',
                              color: isRotational ? '#eab308' : isCompensational ? '#a855f7' : 'var(--primary-brand)'
                            }}>
                              {c.transaction_type || 'ACTUAL'}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                            {c.description || '—'}
                          </td>
                          <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                              <button
                                onClick={() => handleOpenEditCategory(c)}
                                className="btn btn-outline"
                                style={{ padding: '0.3rem 0.45rem', height: '26px' }}
                                title="Edit Category"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(\`Delete category "\${c.subcategory || c.name}"?\`)) {
                                    if (onDeleteCategory) onDeleteCategory(c.id);
                                  }
                                }}
                                className="btn btn-outline"
                                style={{ padding: '0.3rem 0.45rem', height: '26px', color: '#ef4444' }}
                                title="Delete Category"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            {filteredCategories.length > 0 && (
              <PaginationComponent itemLabel="categories" pageSizeOptions={[15, 25, 50, 100, 'ALL']} />
            )}
          </div>
        </>
      )}

      {/* TAB 2: BUDGET MASTER VIEW */}
      {activeMasterTab === 'budgets' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Budget Master (B001 - B008)
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                Answers: <strong>"Which spending plan / budget bucket?"</strong>. Category is independent from Budget bucket.
              </p>
            </div>
            <button onClick={() => handleOpenMasterModal('budgets', 'add')} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
              <Plus size={14} style={{ marginRight: '4px' }} />
              Add Budget Bucket
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-solid)' }}>
                  <th style={{ padding: '0.65rem 1rem', width: '100px' }}>CODE</th>
                  <th style={{ padding: '0.65rem 1rem', minWidth: '180px' }}>BUDGET NAME</th>
                  <th style={{ padding: '0.65rem 1rem', minWidth: '150px' }}>MACRO GROUP</th>
                  <th style={{ padding: '0.65rem 1rem', minWidth: '280px' }}>DESCRIPTION</th>
                  <th style={{ padding: '0.65rem 1rem', width: '90px', textAlign: 'center' }}>STATUS</th>
                  <th style={{ padding: '0.65rem 1rem', width: '100px', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(masters.budgets || []).map((b, idx) => (
                  <tr key={b.id || b.code || idx}>
                    <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontWeight: '800', color: 'var(--primary-brand)' }}>
                      {b.code}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: '700' }}>
                      {b.name}
                    </td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                        {b.category_group || 'LIVING'}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>
                      {b.description || '—'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: 'var(--accent-cr)', fontWeight: '700' }}>
                        ACTIVE
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <button onClick={() => handleOpenMasterModal('budgets', 'edit', b)} className="btn btn-outline" style={{ padding: '0.3rem 0.45rem', height: '26px' }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDeleteMaster('budgets', b.id, b.name)} className="btn btn-outline" style={{ padding: '0.3rem 0.45rem', height: '26px', color: '#ef4444' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COST CENTER MASTER VIEW */}
      {activeMasterTab === 'cost_centers' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Cost Center Master (CC001 - CC008)
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                Answers: <strong>"Who / What consumed the expense?"</strong> (Self, Parents, Vehicle, Home, Education, Health, Business, Travel).
              </p>
            </div>
            <button onClick={() => handleOpenMasterModal('cost_centers', 'add')} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
              <Plus size={14} style={{ marginRight: '4px' }} />
              Add Cost Center
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-solid)' }}>
                  <th style={{ padding: '0.65rem 1rem', width: '100px' }}>CODE</th>
                  <th style={{ padding: '0.65rem 1rem', minWidth: '180px' }}>COST CENTER</th>
                  <th style={{ padding: '0.65rem 1rem', minWidth: '320px' }}>CONSUMPTION PURPOSE</th>
                  <th style={{ padding: '0.65rem 1rem', width: '90px', textAlign: 'center' }}>STATUS</th>
                  <th style={{ padding: '0.65rem 1rem', width: '100px', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(masters.cost_centers || []).map((cc, idx) => (
                  <tr key={cc.id || cc.code || idx}>
                    <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontWeight: '800', color: '#10b981' }}>
                      {cc.code}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: '700' }}>
                      {cc.name}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>
                      {cc.description || '—'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: 'var(--accent-cr)', fontWeight: '700' }}>
                        ACTIVE
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <button onClick={() => handleOpenMasterModal('cost_centers', 'edit', cc)} className="btn btn-outline" style={{ padding: '0.3rem 0.45rem', height: '26px' }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDeleteMaster('cost_centers', cc.id, cc.name)} className="btn btn-outline" style={{ padding: '0.3rem 0.45rem', height: '26px', color: '#ef4444' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PROFIT CENTER MASTER VIEW */}
      {activeMasterTab === 'profit_centers' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Profit Center Master (PC001 - PC006)
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                Answers: <strong>"Who / What generated the income?"</strong> (Salary, Freelancing, Investments, Business, Rental Income, Cashback & Rewards).
              </p>
            </div>
            <button onClick={() => handleOpenMasterModal('profit_centers', 'add')} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
              <Plus size={14} style={{ marginRight: '4px' }} />
              Add Profit Center
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-solid)' }}>
                  <th style={{ padding: '0.65rem 1rem', width: '100px' }}>CODE</th>
                  <th style={{ padding: '0.65rem 1rem', minWidth: '180px' }}>PROFIT CENTER</th>
                  <th style={{ padding: '0.65rem 1rem', minWidth: '320px' }}>EARNING STREAM</th>
                  <th style={{ padding: '0.65rem 1rem', width: '90px', textAlign: 'center' }}>STATUS</th>
                  <th style={{ padding: '0.65rem 1rem', width: '100px', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(masters.profit_centers || []).map((pc, idx) => (
                  <tr key={pc.id || pc.code || idx}>
                    <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontWeight: '800', color: '#a855f7' }}>
                      {pc.code}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: '700' }}>
                      {pc.name}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>
                      {pc.description || '—'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: 'var(--accent-cr)', fontWeight: '700' }}>
                        ACTIVE
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <button onClick={() => handleOpenMasterModal('profit_centers', 'edit', pc)} className="btn btn-outline" style={{ padding: '0.3rem 0.45rem', height: '26px' }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDeleteMaster('profit_centers', pc.id, pc.name)} className="btn btn-outline" style={{ padding: '0.3rem 0.45rem', height: '26px', color: '#ef4444' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PROJECT MASTER VIEW */}
      {activeMasterTab === 'projects' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Project Master (PR001 - PR005)
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                Answers: <strong>"Why did it happen?"</strong> (Goa Trip, Money Matrix, Bike Purchase, Home Renovation, AIOS).
              </p>
            </div>
            <button onClick={() => handleOpenMasterModal('projects', 'add')} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
              <Plus size={14} style={{ marginRight: '4px' }} />
              Add Project
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-solid)' }}>
                  <th style={{ padding: '0.65rem 1rem', width: '100px' }}>CODE</th>
                  <th style={{ padding: '0.65rem 1rem', minWidth: '180px' }}>PROJECT NAME</th>
                  <th style={{ padding: '0.65rem 1rem', minWidth: '320px' }}>PROJECT PURPOSE</th>
                  <th style={{ padding: '0.65rem 1rem', width: '90px', textAlign: 'center' }}>STATUS</th>
                  <th style={{ padding: '0.65rem 1rem', width: '100px', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(masters.projects || []).map((pr, idx) => (
                  <tr key={pr.id || pr.code || idx}>
                    <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontWeight: '800', color: '#eab308' }}>
                      {pr.code}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: '700' }}>
                      {pr.name}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>
                      {pr.description || '—'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: 'var(--accent-cr)', fontWeight: '700' }}>
                        ACTIVE
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <button onClick={() => handleOpenMasterModal('projects', 'edit', pr)} className="btn btn-outline" style={{ padding: '0.3rem 0.45rem', height: '26px' }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDeleteMaster('projects', pr.id, pr.name)} className="btn btn-outline" style={{ padding: '0.3rem 0.45rem', height: '26px', color: '#ef4444' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORY ADD/EDIT MODAL */}
      {modalState.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: '580px', width: '100%', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '800', margin: 0 }}>
                {modalState.mode === 'add' ? 'Add Taxonomy Category' : 'Edit Category'}
              </h3>
              <button onClick={() => setModalState({ isOpen: false, mode: 'add', category: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontWeight: '700' }}>SubCategory Name (Atomic Item) *</label>
                  <input
                    type="text"
                    required
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value.toUpperCase() })}
                    className="form-control"
                    placeholder="e.g. PETROL, GROCERIES, SALARY"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700' }}>Category (Functional Group) *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })}
                    className="form-control"
                    placeholder="e.g. FUEL, PROVISIONS, PAYROLL"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700' }}>Division (Macro) *</label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value, group_type: e.target.value })}
                    className="form-control"
                  >
                    {DIVISIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700' }}>SubType *</label>
                  <select
                    value={formData.sub_type}
                    onChange={(e) => setFormData({ ...formData, sub_type: e.target.value, net_type: e.target.value })}
                    className="form-control"
                  >
                    {SUB_TYPES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700' }}>Transaction Type *</label>
                  <select
                    value={formData.transaction_type}
                    onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                    className="form-control"
                  >
                    {TRANSACTION_TYPES.map(tt => (
                      <option key={tt} value={tt}>{tt}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontWeight: '700' }}>SubCategory Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-control"
                    placeholder="Detailed explanation of what expenses or inflows belong to this subcategory..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setModalState({ isOpen: false, mode: 'add', category: null })} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalState.mode === 'add' ? 'Create Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGEMENT MASTER ADD/EDIT MODAL */}
      {masterModalState.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '800', margin: 0 }}>
                {masterModalState.mode === 'add' ? 'Add Master Item' : 'Edit Master Item'} ({masterModalState.type.replace('_', ' ').toUpperCase()})
              </h3>
              <button onClick={() => setMasterModalState({ isOpen: false, mode: 'add', type: 'budgets', item: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMaster}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: '700' }}>Code *</label>
                  <input
                    type="text"
                    required
                    value={masterFormData.code}
                    onChange={(e) => setMasterFormData({ ...masterFormData, code: e.target.value.toUpperCase() })}
                    className="form-control"
                    placeholder="e.g. B009, CC009, PC007, PR006"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700' }}>Name *</label>
                  <input
                    type="text"
                    required
                    value={masterFormData.name}
                    onChange={(e) => setMasterFormData({ ...masterFormData, name: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Personal Travel, Vehicle, Freelance Consulting..."
                  />
                </div>

                {masterModalState.type === 'budgets' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: '700' }}>Macro Group</label>
                    <select
                      value={masterFormData.category_group}
                      onChange={(e) => setMasterFormData({ ...masterFormData, category_group: e.target.value })}
                      className="form-control"
                    >
                      {DIVISIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label" style={{ fontWeight: '700' }}>Description</label>
                  <textarea
                    rows={3}
                    value={masterFormData.description}
                    onChange={(e) => setMasterFormData({ ...masterFormData, description: e.target.value })}
                    className="form-control"
                    placeholder="Purpose, consumer, or notes for this management master..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setMasterModalState({ isOpen: false, mode: 'add', type: 'budgets', item: null })} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {masterModalState.mode === 'add' ? 'Create Master' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/CategoryManager.jsx', fileContent, 'utf8');
console.log('Successfully wrote src/components/CategoryManager.jsx');

