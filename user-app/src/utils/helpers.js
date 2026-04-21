export const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const COLORS = {
  primary:     '#C8A96E',
  primaryDark: '#A8893E',
  bg:          '#FAFAFA',
  card:        '#FFFFFF',
  text:        '#1A1A2E',
  textLight:   '#6B7280',
  border:      '#E5E7EB',
  success:     '#10B981',
  error:       '#EF4444',
  warning:     '#F59E0B',
  info:        '#3B82F6',
};

export const FONTS = {
  regular: { fontFamily: 'System', fontWeight: '400' },
  medium:  { fontFamily: 'System', fontWeight: '500' },
  semibold:{ fontFamily: 'System', fontWeight: '600' },
  bold:    { fontFamily: 'System', fontWeight: '700' },
};

export const STATUS_CONFIG = {
  pending:          { label: 'Pending',          color: '#F59E0B', bg: '#FEF3C7' },
  confirmed:        { label: 'Confirmed',         color: '#10B981', bg: '#D1FAE5' },
  processing:       { label: 'Processing',        color: '#3B82F6', bg: '#DBEAFE' },
  shipped:          { label: 'Shipped',           color: '#8B5CF6', bg: '#EDE9FE' },
  out_for_delivery: { label: 'Out for Delivery',  color: '#F59E0B', bg: '#FEF3C7' },
  delivered:        { label: 'Delivered',         color: '#10B981', bg: '#D1FAE5' },
  cancelled:        { label: 'Cancelled',         color: '#EF4444', bg: '#FEE2E2' },
  return_requested: { label: 'Return Requested',  color: '#F59E0B', bg: '#FEF3C7' },
  returned:         { label: 'Returned',          color: '#6B7280', bg: '#F3F4F6' },
};

export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);
export const validatePassword = (password) => password?.length >= 8;
