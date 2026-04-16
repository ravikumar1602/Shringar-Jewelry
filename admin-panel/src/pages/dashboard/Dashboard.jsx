import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const StatCard = ({ label, value, sub, icon, color }) => (
  <div style={{
    background: '#fff', borderRadius: 12, padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,.08)', borderLeft: `4px solid ${color}`,
    display: 'flex', alignItems: 'center', gap: 16,
  }}>
    <div style={{ fontSize: 36 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardAPI.getStats(), dashboardAPI.getSalesAnalytics(12)])
      .then(([s, a]) => {
        setStats(s.data.data);
        setSalesData(a.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, fontSize: 20 }}>
      ⏳ Loading dashboard...
    </div>
  );

  const { revenue, orders, users, products, recentOrders, topProducts, ordersByStatus } = stats || {};
  const growthColor = revenue?.growth >= 0 ? '#10B981' : '#EF4444';

  // Build chart data
  const monthLabels = salesData?.salesData?.map(d => `${MONTH_NAMES[d._id.month - 1]} ${d._id.year}`) || [];
  const revenueValues = salesData?.salesData?.map(d => d.revenue) || [];

  const lineChart = {
    labels: monthLabels,
    datasets: [{
      label: 'Revenue (₹)', data: revenueValues,
      borderColor: '#C8A96E', backgroundColor: 'rgba(200,169,110,.1)',
      fill: true, tension: 0.4, pointRadius: 4,
    }],
  };

  const statusLabels = Object.keys(ordersByStatus || {});
  const statusValues = Object.values(ordersByStatus || {});
  const doughnutChart = {
    labels: statusLabels,
    datasets: [{
      data: statusValues,
      backgroundColor: ['#C8A96E','#10B981','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#6B7280'],
    }],
  };

  const catChart = {
    labels: salesData?.categoryRevenue?.map(c => c._id) || [],
    datasets: [{
      label: 'Revenue by Category',
      data: salesData?.categoryRevenue?.map(c => c.revenue) || [],
      backgroundColor: '#C8A96E', borderRadius: 6,
    }],
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#1A1A2E' }}>📊 Dashboard</h1>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Revenue" value={formatCurrency(revenue?.total)} sub={`This month: ${formatCurrency(revenue?.thisMonth)}`} icon="💰" color="#C8A96E" />
        <StatCard label="Total Orders" value={orders?.total?.toLocaleString('en-IN')} sub={`Pending: ${orders?.pending}`} icon="📦" color="#3B82F6" />
        <StatCard label="Total Users" value={users?.total?.toLocaleString('en-IN')} sub={`This month: +${users?.thisMonth}`} icon="👥" color="#10B981" />
        <StatCard label="Active Products" value={products?.total?.toLocaleString('en-IN')} sub={`Low stock: ${products?.lowStock} | OOS: ${products?.outOfStock}`} icon="💍" color="#8B5CF6" />
        <StatCard label="Monthly Growth"
          value={<span style={{ color: growthColor }}>{revenue?.growth >= 0 ? '+' : ''}{revenue?.growth}%</span>}
          sub={`vs last month: ${formatCurrency(revenue?.lastMonth)}`} icon="📈" color={growthColor} />
        <StatCard label="Today's Orders" value={orders?.today || 0} sub={`This month: ${orders?.thisMonth}`} icon="🎯" color="#F59E0B" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600 }}>📈 Revenue Trend (12 Months)</h3>
          <Line data={lineChart} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600 }}>📦 Orders by Status</h3>
          <Doughnut data={doughnutChart} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { fontSize: 11 } } } }} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600 }}>🏷️ Revenue by Category</h3>
          <Bar data={catChart} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>

        {/* Top Products */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>🔥 Top Selling Products</h3>
          {topProducts?.map((p, i) => (
            <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < topProducts.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <span style={{ fontWeight: 700, color: '#C8A96E', minWidth: 20 }}>#{i + 1}</span>
              {p.images?.[0]?.url && (
                <img src={p.images[0].url} alt={p.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{p.soldCount} sold · {formatCurrency(p.price)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>🕐 Recent Orders</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
              {['Order #','Customer','Amount','Status','Date'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6B7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentOrders?.map(o => (
              <tr key={o._id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#C8A96E' }}>{o.orderNumber}</td>
                <td style={{ padding: '10px 12px' }}>{o.user?.name || 'N/A'}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{formatCurrency(o.totalAmount)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: '#F3F4F6', color: '#374151', textTransform: 'capitalize',
                  }}>{o.status}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#6B7280' }}>{formatDateTime(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
