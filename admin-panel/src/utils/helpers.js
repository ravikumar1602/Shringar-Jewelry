export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const STATUS_COLORS = {
  pending:           { bg: '#FEF3C7', text: '#92400E' },
  confirmed:         { bg: '#D1FAE5', text: '#065F46' },
  processing:        { bg: '#DBEAFE', text: '#1E40AF' },
  shipped:           { bg: '#EDE9FE', text: '#5B21B6' },
  out_for_delivery:  { bg: '#FEE2E2', text: '#991B1B' },
  delivered:         { bg: '#D1FAE5', text: '#065F46' },
  cancelled:         { bg: '#F3F4F6', text: '#374151' },
  return_requested:  { bg: '#FEF3C7', text: '#92400E' },
  returned:          { bg: '#F3F4F6', text: '#374151' },
};

export const truncate = (str, n = 40) => str?.length > n ? str.slice(0, n) + '...' : str;
