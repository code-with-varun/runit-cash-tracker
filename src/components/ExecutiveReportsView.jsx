import React, { useState } from 'react';
import {
  Presentation,
  FileDown,
  BarChart3,
  ExternalLink,
  Copy,
  Check,
  FileSpreadsheet,
  Download,
  Share2,
  PieChart,
  TrendingUp,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExecutiveReportsView({ transactions = [], categories = [] }) {
  const [copied, setCopied] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('powerbi');

  const apiUrl = `${window.location.origin}/money-matrix/api/transactions`;

  const handleCopyApi = () => {
    navigator.clipboard.writeText(apiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportNwfExcel = () => {
    // Generate clean NWF Excel file
    const wb = XLSX.utils.book_new();

    // Sheet 1: Transactions dump
    const txData = transactions.map((t, idx) => ({
      'temp_upload_id': `${idx + 1}-CASH_1`,
      'tran_date': t.date,
      'tran_no': idx + 1,
      'account_no': 'Cash_1',
      'particulars': t.notes || 'Cash transaction',
      'debit': t.type === 'Dr' ? t.amount : 0,
      'credit': t.type === 'Cr' ? t.amount : 0,
      'sub_category': t.categoryName,
      'tagging': 'SELF'
    }));
    const ws1 = XLSX.utils.json_to_sheet(txData);
    XLSX.utils.book_append_sheet(wb, ws1, 'ISPARK MASTER');

    // Sheet 2: Categories
    const catData = categories.map(c => ({
      'Category Name': c.name,
      'Type': c.type,
      'Color Code': c.color || '#3b82f6'
    }));
    const ws2 = XLSX.utils.json_to_sheet(catData);
    XLSX.utils.book_append_sheet(wb, ws2, 'CATEGORIES');

    XLSX.writeFile(wb, `MoneyMatrix_NWF_Export_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Banner */}
      <div className="card glass-card" style={{ padding: '1.75rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '750px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '20px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            fontSize: '0.71875rem',
            fontWeight: '700',
            marginBottom: '0.75rem'
          }}>
            <Presentation size={13} />
            <span>EXECUTIVE BI & BOARDROOM DELIVERABLES</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
            Power BI Dynamic Reporting & Boardroom Decks
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.5rem 0 1.25rem' }}>
            Connect Power BI Desktop or Service directly to your MoneyMatrix live REST endpoint for automatic scheduled refreshes, or generate standalone PowerPoint and PDF board briefings.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleExportNwfExcel}
              className="btn btn-primary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
            >
              <FileSpreadsheet size={15} />
              <span>Export Consolidated NWF Excel</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="btn btn-ghost btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
            >
              <FileDown size={15} />
              <span>Print / Save PDF Brief</span>
            </button>
          </div>
        </div>
      </div>

      {/* Power BI Web Connection URL Box */}
      <div className="card glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '800', marginBottom: '0.35rem' }}>
          Power BI Direct Web Query URL
        </h3>
        <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          In Power BI Desktop: Click <strong>Get Data</strong> &gt; <strong>Web</strong>, paste the endpoint below, and choose <strong>Basic/Anonymous</strong> or add your session header:
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)'
        }}>
          <code style={{ fontSize: '0.8125rem', color: 'var(--primary-brand)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {apiUrl}
          </code>

          <button
            onClick={handleCopyApi}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Feed URL'}</span>
          </button>
        </div>
      </div>

      {/* Boardroom Output Specs */}
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <BarChart3 size={18} color="#3b82f6" />
            <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', margin: 0 }}>
              Dynamic Power BI Deck
            </h4>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Consolidates VSTACK formulas, pivot tables, and day-wise closing balance charts into live interactive visuals with drilldowns.
          </p>
          <div style={{ marginTop: '0.75rem', fontSize: '0.6875rem', color: 'var(--accent-cr)', fontWeight: '600' }}>
            ✓ REST API Data Connector Ready
          </div>
        </div>

        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Presentation size={18} color="#f59e0b" />
            <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', margin: 0 }}>
              PPT Data Connection
            </h4>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Automated slide deck linked to monthly actual vs. budget performance, asset allocation curves, and deviation anomalies.
          </p>
          <div style={{ marginTop: '0.75rem', fontSize: '0.6875rem', color: '#f59e0b', fontWeight: '600' }}>
            ✓ Slide Table Layout Mapped
          </div>
        </div>

        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <FileDown size={18} color="#8b5cf6" />
            <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', margin: 0 }}>
              Static PDF Executive Brief
            </h4>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            High-resolution, printable PDF snapshot designed for personal finance reviews, family office balance sheets, and tax audits.
          </p>
          <div style={{ marginTop: '0.75rem', fontSize: '0.6875rem', color: '#8b5cf6', fontWeight: '600' }}>
            ✓ Clean Print Stylesheet Enabled
          </div>
        </div>

      </div>

    </div>
  );
}
