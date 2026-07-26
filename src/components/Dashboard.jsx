import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, PlusCircle, TableProperties } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard({ transactions, categories, onNavigate }) {
  // Calculate Totals
  const totalIncome = transactions
    .filter((t) => t.type === 'Cr')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'Dr')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const netBalance = totalIncome - totalExpense;

  // Format Currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Group Expenses by Category for Doughnut Chart
  const expenseByCategory = {};
  transactions
    .filter((t) => t.type === 'Dr')
    .forEach((t) => {
      expenseByCategory[t.categoryName] = (expenseByCategory[t.categoryName] || 0) + (parseFloat(t.amount) || 0);
    });

  const doughnutData = {
    labels: Object.keys(expenseByCategory),
    datasets: [
      {
        data: Object.values(expenseByCategory),
        backgroundColor: [
          '#ef4444',
          '#f59e0b',
          '#3b82f6',
          '#8b5cf6',
          '#ec4899',
          '#14b8a6',
          '#64748b',
        ],
        borderWidth: 2,
        borderColor: 'var(--bg-card-solid)',
      },
    ],
  };

  // Group Transactions by Date/Month for Bar Chart
  const monthlyDataMap = {};
  transactions.forEach((t) => {
    const month = t.date ? t.date.substring(0, 7) : 'Unknown';
    if (!monthlyDataMap[month]) {
      monthlyDataMap[month] = { Cr: 0, Dr: 0 };
    }
    monthlyDataMap[month][t.type] += parseFloat(t.amount) || 0;
  });

  const sortedMonths = Object.keys(monthlyDataMap).sort();
  const barData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Income (Cr)',
        data: sortedMonths.map((m) => monthlyDataMap[m].Cr),
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
      {
        label: 'Expenses (Dr)',
        data: sortedMonths.map((m) => monthlyDataMap[m].Dr),
        backgroundColor: '#ef4444',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'var(--text-secondary)',
          font: { family: 'Inter', size: 12 },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: 'var(--text-secondary)' },
        grid: { color: 'var(--border-color)' },
      },
      y: {
        ticks: { color: 'var(--text-secondary)' },
        grid: { color: 'var(--border-color)' },
      },
    },
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 3 Metric Summary Cards */}
      <div className="grid-3">
        {/* Income Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-cr)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Income (Cr)</span>
            <div style={{
              padding: '0.375rem',
              borderRadius: '8px',
              background: 'var(--accent-cr-bg)',
              color: 'var(--accent-cr)'
            }}>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--accent-cr)' }}>
            {formatCurrency(totalIncome)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span className="badge badge-cr">Cr</span>
            <span>All credit entries</span>
          </div>
        </div>

        {/* Expense Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-dr)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Expenses (Dr)</span>
            <div style={{
              padding: '0.375rem',
              borderRadius: '8px',
              background: 'var(--accent-dr-bg)',
              color: 'var(--accent-dr)'
            }}>
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--accent-dr)' }}>
            {formatCurrency(totalExpense)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span className="badge badge-dr">Dr</span>
            <span>All debit entries</span>
          </div>
        </div>

        {/* Net Balance Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--primary-brand)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Net Balance</span>
            <div style={{
              padding: '0.375rem',
              borderRadius: '8px',
              background: 'var(--primary-brand-bg)',
              color: 'var(--primary-brand)'
            }}>
              <Wallet size={20} />
            </div>
          </div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: '800',
            fontFamily: 'var(--font-heading)',
            color: netBalance >= 0 ? 'var(--text-primary)' : 'var(--accent-dr)'
          }}>
            {formatCurrency(netBalance)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>Cr total minus Dr total</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid-2">
        {/* Monthly Cashflow Bar Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--primary-brand)" />
            <span>Monthly Income vs Expenses</span>
          </h3>
          <div style={{ height: '260px' }}>
            {sortedMonths.length > 0 ? (
              <Bar data={barData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No transaction records available
              </div>
            )}
          </div>
        </div>

        {/* Category Expense Breakdown Doughnut Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingDown size={18} color="var(--accent-dr)" />
            <span>Category Expense Breakdown</span>
          </h3>
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {Object.keys(expenseByCategory).length > 0 ? (
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: { color: 'var(--text-secondary)', font: { family: 'Inter', size: 11 } },
                    },
                  },
                }}
              />
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No debit expenses recorded</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Banner & Recent Activity */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem' }}>Recent Activity</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Latest entries in your cash ledger</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => onNavigate('single-entry')} className="btn btn-primary btn-sm">
              <PlusCircle size={15} />
              <span>Add Transaction</span>
            </button>
            <button onClick={() => onNavigate('bulk-entry')} className="btn btn-secondary btn-sm">
              <TableProperties size={15} />
              <span>Bulk Entry</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontWeight: '500' }}>{tx.date}</td>
                    <td>{tx.categoryName}</td>
                    <td>
                      <span className={tx.type === 'Cr' ? 'badge badge-cr' : 'badge badge-dr'}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{
                      fontWeight: '700',
                      color: tx.type === 'Cr' ? 'var(--accent-cr)' : 'var(--text-primary)'
                    }}>
                      {tx.type === 'Cr' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{tx.notes || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No transactions added yet. Click "Add Transaction" to create your first record.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
