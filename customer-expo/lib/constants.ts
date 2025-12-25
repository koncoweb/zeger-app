// Zeger Brand Colors
export const COLORS = {
  primary: '#EA2831',
  primaryDark: '#D12028',
  secondary: '#F8F6F6',
  white: '#FFFFFF',
  black: '#1F2937',
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
  purple: {
    700: '#7C3AED',
    800: '#6D28D9',
    900: '#5B21B6',
  },
  yellow: {
    400: '#FACC15',
    500: '#EAB308',
  },
  green: {
    500: '#22C55E',
    600: '#16A34A',
  },
  orange: {
    500: '#F97316',
  },
};

// Google Maps API Key
export const GOOGLE_MAPS_API_KEY = 'AIzaSyBX-Ud57WsonDCCPfx-X6KsStupHdcRlNc';

// Map default region (Indonesia - Surabaya area)
export const DEFAULT_REGION = {
  latitude: -7.2575,
  longitude: 112.7521,
  latitudeDelta: 0.01, // Zoom lebih dekat
  longitudeDelta: 0.01, // Zoom lebih dekat
};

// Rider search radius in km
export const RIDER_SEARCH_RADIUS_KM = 50;

// Order types
export const ORDER_TYPES = {
  OUTLET_PICKUP: 'outlet_pickup',
  OUTLET_DELIVERY: 'outlet_delivery',
  ON_THE_WHEELS: 'on_the_wheels',
} as const;

// Order status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PENDING_PAYMENT: 'pending_payment',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
} as const;

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  QRIS: 'qris',
  TRANSFER: 'transfer',
} as const;

// Product categories
export const PRODUCT_CATEGORIES = [
  'Espresso Based',
  'Non Coffee',
  'Snack',
  'Minuman',
  'Makanan',
];

// Customization options
export const SIZE_OPTIONS = ['Regular', 'Large'];
export const ICE_OPTIONS = ['Normal', 'Less Ice', 'No Ice'];
export const SUGAR_OPTIONS = ['Normal', 'Less Sugar', 'No Sugar'];
