// Zeger Brand Colors
export const COLORS = {
  primary: '#DC2626',      // zeger-red
  primaryDark: '#B91C1C',  // zeger-red-dark
  cream: '#FEF3C7',        // zeger-cream
  brown: '#92400E',        // zeger-brown
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// App Configuration
export const APP_CONFIG = {
  name: 'Zeger Rider',
  version: '1.0.0',
  locationUpdateInterval: 30000, // 30 seconds
  locationDistanceFilter: 10, // meters
};

// Rider Roles
export const RIDER_ROLES = [
  'rider',
  'bh_rider',
  'sb_rider',
  '2_Hub_Rider',
  '3_SB_Rider',
];

// Payment Methods
export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tunai', icon: 'cash' },
  { id: 'qris', label: 'QRIS', icon: 'qr-code' },
  { id: 'transfer', label: 'Transfer', icon: 'bank' },
];

// Order Status
export const ORDER_STATUS = {
  pending: { label: 'Menunggu', color: COLORS.warning },
  accepted: { label: 'Diterima', color: COLORS.info },
  on_delivery: { label: 'Dalam Pengiriman', color: COLORS.primary },
  completed: { label: 'Selesai', color: COLORS.success },
  rejected: { label: 'Ditolak', color: COLORS.error },
  cancelled: { label: 'Dibatalkan', color: COLORS.gray[500] },
};

// Stock Movement Status
export const STOCK_STATUS = {
  pending: { label: 'Menunggu', color: COLORS.warning },
  received: { label: 'Diterima', color: COLORS.success },
  returned: { label: 'Dikembalikan', color: COLORS.info },
};

// Shift Status
export const SHIFT_STATUS = {
  active: { label: 'Aktif', color: COLORS.success },
  completed: { label: 'Selesai', color: COLORS.gray[500] },
};
