// Database Types for Rider App

export interface Profile {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  role: string;
  branch_id: string | null;
  is_active: boolean;
  app_access_type: string | null;
  last_known_lat: number | null;
  last_known_lng: number | null;
  location_updated_at: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  branch?: Branch;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  branch_type: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string | null;
  price: number;
  cost_price: number | null;
  ck_price: number | null;
  description: string | null;
  image_url: string | null;
  custom_options: Record<string, unknown> | null;
  is_active: boolean;
}

export interface Inventory {
  id: string;
  product_id: string;
  branch_id: string | null;
  rider_id: string | null;
  stock_quantity: number;
  reserved_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  last_updated: string;
  product?: Product;
}

export interface StockMovement {
  id: string;
  product_id: string;
  branch_id: string | null;
  rider_id: string | null;
  movement_type: string;
  quantity: number;
  status: string;
  verification_photo_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  requires_approval: boolean;
  product?: Product;
}

export interface Transaction {
  id: string;
  transaction_number: string;
  customer_id: string | null;
  rider_id: string | null;
  branch_id: string | null;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string | null;
  status: string;
  transaction_date: string;
  transaction_latitude: number | null;
  transaction_longitude: number | null;
  location_name: string | null;
  is_voided: boolean;
  void_reason: string | null;
  created_at: string;
  items?: TransactionItem[];
  customer?: Customer;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  branch_id: string | null;
  rider_id: string | null;
  is_active: boolean;
}

export interface Attendance {
  id: string;
  rider_id: string;
  branch_id: string | null;
  work_date: string;
  check_in_time: string | null;
  check_in_location: string | null;
  check_in_photo_url: string | null;
  check_out_time: string | null;
  check_out_location: string | null;
  check_out_photo_url: string | null;
  status: string;
}

export interface Checkpoint {
  id: string;
  rider_id: string;
  branch_id: string;
  checkpoint_name: string | null;
  latitude: number;
  longitude: number;
  address_info: string | null;
  notes: string | null;
  created_at: string;
}

export interface Shift {
  id: string;
  rider_id: string;
  branch_id: string;
  shift_date: string;
  shift_number: number;
  shift_start_time: string | null;
  shift_end_time: string | null;
  status: string;
  cash_collected: number;
  total_sales: number;
  total_transactions: number;
  report_submitted: boolean;
  report_verified: boolean;
  notes: string | null;
}

export interface CustomerOrder {
  id: string;
  user_id: string;
  rider_profile_id: string | null;
  outlet_id: string | null;
  status: string;
  order_type: string;
  total_price: number;
  delivery_fee: number;
  discount_amount: number;
  payment_method: string | null;
  delivery_address: string | null;
  latitude: number | null;
  longitude: number | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  items?: CustomerOrderItem[];
  customer_user?: CustomerUser;
}

export interface CustomerOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  custom_options: Record<string, unknown> | null;
  product?: Product;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
}

export interface DailyReport {
  id: string;
  rider_id: string;
  branch_id: string | null;
  shift_id: string | null;
  report_date: string;
  total_sales: number;
  cash_collected: number;
  total_transactions: number;
  start_location: string | null;
  end_location: string | null;
  photos: Record<string, string> | null;
  verified_by: string | null;
  verified_at: string | null;
}

export interface RiderLocation {
  id: string;
  rider_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  updated_at: string;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalSales: number;
  transactionCount: number;
  stockCount: number;
  pendingOrders: number;
}
