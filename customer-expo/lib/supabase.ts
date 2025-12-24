import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = 'https://uqgxxgbhvqjxrpotyilj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZ3h4Z2JodnFqeHJwb3R5aWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDkwNTUsImV4cCI6MjA3MTE4NTA1NX0.GeOdMGjJy8ykhgTcUtd1spkxV6ljxNlNjy1EPovm9Xw';

// Custom storage adapter for Expo SecureStore with web fallback
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        // Check if we're in browser environment (not SSR)
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn('Storage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        // Check if we're in browser environment (not SSR)
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn('Storage setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        // Check if we're in browser environment (not SSR)
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('Storage removeItem error:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Disable auto session recovery during SSR
    ...(Platform.OS === 'web' && typeof window === 'undefined' && {
      autoRefreshToken: false,
      persistSession: false,
    }),
  },
});

// Types for database
export interface CustomerUser {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  points: number;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  role: string;
  is_online: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: number;
  cost_price: number;
  ck_price: number;
  category: string | null;
  image_url: string | null;
  custom_options: any;
  is_active: boolean;
}

export interface Rider {
  id: string;
  full_name: string;
  phone: string;
  photo_url: string | null;
  distance_km: number;
  eta_minutes: number;
  total_stock: number;
  rating: number;
  lat: number | null;
  lng: number | null;
  last_updated: string | null;
  is_online: boolean;
  is_shift_active: boolean;
  has_gps: boolean;
  branch_name: string;
  branch_address: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
}

export interface CustomerOrder {
  id: string;
  user_id: string; // References customer_users.id
  outlet_id: string | null;
  rider_id: string | null; // References customer_users.id (for future use)
  rider_profile_id: string | null; // References profiles.id (for On The Wheels)
  status: string;
  order_type: 'outlet_pickup' | 'outlet_delivery' | 'on_the_wheels';
  total_price: number;
  delivery_fee: number;
  discount_amount: number;
  payment_method: string | null;
  delivery_address: string | null;
  latitude: number | null;
  longitude: number | null;
  voucher_id: string | null;
  estimated_arrival: string | null;
  rejection_reason: string | null;
  qris_payment_proof_url: string | null;
  created_at: string;
  updated_at: string;
}
