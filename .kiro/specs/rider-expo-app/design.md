# Design Document - Rider Expo App

## Introduction

Dokumen ini menjelaskan arsitektur dan desain teknis untuk aplikasi Rider Expo - aplikasi mobile native untuk rider/sales Zeger Coffee. Aplikasi dibangun menggunakan Expo SDK 52 dengan React Native, mengikuti pola yang sudah ada di `customer-expo/`.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Rider Expo App                         │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (React Native + Expo)                             │
│  ├── Screens (Expo Router)                                  │
│  ├── Components (Reusable UI)                               │
│  └── Hooks (Custom Logic)                                   │
├─────────────────────────────────────────────────────────────┤
│  State Management                                           │
│  ├── Zustand (Global State)                                 │
│  │   ├── authStore (Authentication)                         │
│  │   ├── shiftStore (Shift Management)                      │
│  │   ├── cartStore (POS Cart)                               │
│  │   └── locationStore (GPS Tracking)                       │
│  └── TanStack Query (Server State - optional)               │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                             │
│  ├── Supabase Client (Database & Auth)                      │
│  ├── Location Service (expo-location)                       │
│  ├── Notification Service (expo-notifications)              │
│  └── Storage Service (expo-secure-store)                    │
├─────────────────────────────────────────────────────────────┤
│  External Services                                          │
│  ├── Supabase (PostgreSQL + Auth + Storage + Realtime)      │
│  └── Google Maps (Navigation via Linking)                   │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

#### profiles
Tabel utama untuk data user/rider.
```
id: uuid (PK)
user_id: uuid (FK -> auth.users)
full_name: text
phone: text
role: user_role (enum)
branch_id: uuid (FK -> branches)
is_active: boolean
app_access_type: app_access_type (enum)
last_known_lat: double precision
last_known_lng: double precision
location_updated_at: timestamptz
photo_url: text
created_at: timestamptz
updated_at: timestamptz
```

#### shift_management
Manajemen shift rider.
```
id: uuid (PK)
rider_id: uuid (FK -> profiles)
branch_id: uuid (FK -> branches)
shift_date: date
shift_number: integer
shift_start_time: timestamptz
shift_end_time: timestamptz
status: text ('active' | 'completed')
cash_collected: numeric
total_sales: numeric
total_transactions: integer
report_submitted: boolean
report_verified: boolean
verified_by: uuid (FK -> profiles)
verified_at: timestamptz
notes: text
created_at: timestamptz
updated_at: timestamptz
```

#### inventory
Stok produk per rider/branch.
```
id: uuid (PK)
product_id: uuid (FK -> products)
branch_id: uuid (FK -> branches)
rider_id: uuid (FK -> profiles)
stock_quantity: integer
reserved_quantity: integer
min_stock_level: integer
max_stock_level: integer
last_updated: timestamptz
```

#### stock_movements
Perpindahan stok.
```
id: uuid (PK)
product_id: uuid (FK -> products)
branch_id: uuid (FK -> branches)
rider_id: uuid (FK -> profiles)
movement_type: movement_type (enum)
quantity: integer
status: text ('pending' | 'received' | 'returned')
verification_photo_url: text
notes: text
created_by: uuid (FK -> profiles)
created_at: timestamptz
requires_approval: boolean
approved_by: uuid (FK -> profiles)
approved_at: timestamptz
```

#### transactions
Transaksi penjualan.
```
id: uuid (PK)
transaction_number: text
customer_id: uuid (FK -> profiles)
rider_id: uuid (FK -> profiles)
branch_id: uuid (FK -> branches)
total_amount: numeric
discount_amount: numeric
final_amount: numeric
payment_method: text ('cash' | 'qris' | 'transfer')
status: transaction_status (enum)
transaction_date: timestamptz
transaction_latitude: numeric
transaction_longitude: numeric
location_name: text
is_voided: boolean
voided_at: timestamptz
voided_by: uuid (FK -> profiles)
void_reason: text
created_at: timestamptz
```

#### transaction_items
Item dalam transaksi.
```
id: uuid (PK)
transaction_id: uuid (FK -> transactions)
product_id: uuid (FK -> products)
quantity: integer
unit_price: numeric
total_price: numeric
created_at: timestamptz
```

#### attendance
Kehadiran rider.
```
id: uuid (PK)
rider_id: uuid (FK -> profiles)
branch_id: uuid (FK -> branches)
work_date: date
check_in_time: timestamptz
check_in_location: text
check_in_photo_url: text
check_out_time: timestamptz
check_out_location: text
check_out_photo_url: text
status: text ('checked_in' | 'checked_out')
created_at: timestamptz
```

#### checkpoints
Checkpoint lokasi rider.
```
id: uuid (PK)
rider_id: uuid (FK -> profiles)
branch_id: uuid (FK -> branches)
checkpoint_name: text
latitude: numeric
longitude: numeric
address_info: text
notes: text
created_at: timestamptz
```

#### customer_orders
Pesanan online dari customer.
```
id: uuid (PK)
user_id: uuid (FK -> customer_users)
rider_profile_id: uuid (FK -> profiles)
outlet_id: uuid (FK -> branches)
status: text ('pending' | 'accepted' | 'rejected' | 'completed')
order_type: text ('outlet_pickup' | 'outlet_delivery' | 'on_the_wheels')
total_price: integer
delivery_fee: integer
discount_amount: integer
payment_method: text
delivery_address: text
latitude: double precision
longitude: double precision
rejection_reason: text
created_at: timestamptz
updated_at: timestamptz
```

#### daily_reports
Laporan harian rider.
```
id: uuid (PK)
rider_id: uuid (FK -> profiles)
branch_id: uuid (FK -> branches)
shift_id: uuid (FK -> shift_management)
report_date: date
total_sales: numeric
cash_collected: numeric
total_transactions: integer
start_location: text
end_location: text
photos: jsonb
verified_by: uuid (FK -> profiles)
verified_at: timestamptz
created_at: timestamptz
```

#### rider_locations
Tracking lokasi realtime rider.
```
id: uuid (PK)
rider_id: uuid (FK -> profiles)
latitude: double precision
longitude: double precision
accuracy: numeric
heading: numeric
speed: numeric
updated_at: timestamptz
```

### Enum Types

```typescript
type user_role = 
  | 'rider' | 'bh_rider' | 'sb_rider'
  | '2_Hub_Rider' | '3_SB_Rider'
  | 'bh_kasir' | 'sb_kasir' | ...;

type app_access_type = 'web_backoffice' | 'pos_app' | 'rider_app';

type transaction_status = 'pending' | 'completed' | 'cancelled' | 'returned';
```

## Project Structure

```
rider-expo/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout
│   ├── (auth)/                   # Auth screens
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Dashboard
│   │   ├── sell.tsx              # POS/Selling
│   │   ├── orders.tsx            # Online orders
│   │   └── profile.tsx           # Profile
│   ├── stock/                    # Stock management
│   │   ├── receive.tsx
│   │   └── return.tsx
│   ├── attendance/
│   │   └── index.tsx
│   ├── checkpoints/
│   │   └── index.tsx
│   ├── analytics/
│   │   └── index.tsx
│   ├── shift-report/
│   │   └── index.tsx
│   └── order/
│       └── [orderId].tsx
├── components/
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingScreen.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   └── QuickActions.tsx
│   ├── pos/
│   │   ├── ProductGrid.tsx
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── PaymentModal.tsx
│   ├── stock/
│   │   ├── StockItem.tsx
│   │   └── StockConfirmModal.tsx
│   ├── orders/
│   │   ├── OrderCard.tsx
│   │   └── OrderDetailModal.tsx
│   └── common/
│       ├── GPSIndicator.tsx
│       └── OfflineIndicator.tsx
├── hooks/
│   ├── useLocation.ts            # GPS tracking
│   ├── useNotifications.ts       # Push notifications
│   ├── useOffline.ts             # Offline detection
│   └── useRealtime.ts            # Supabase realtime
├── store/
│   ├── authStore.ts              # Authentication state
│   ├── shiftStore.ts             # Shift management
│   ├── cartStore.ts              # POS cart
│   ├── locationStore.ts          # GPS state
│   └── offlineStore.ts           # Offline queue
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── constants.ts              # App constants
│   ├── utils.ts                  # Utility functions
│   └── types.ts                  # TypeScript types
├── services/
│   ├── locationService.ts        # Background location
│   └── notificationService.ts    # Push notifications
├── assets/
│   └── images/
├── app.json
├── package.json
└── tsconfig.json
```

## Component Design

### Navigation Structure

```
Root (_layout.tsx)
├── (auth) - Unauthenticated
│   └── login
└── (tabs) - Authenticated
    ├── index (Dashboard)
    ├── sell (POS)
    ├── orders (Online Orders)
    └── profile
    
Modal Screens:
├── stock/receive
├── stock/return
├── attendance
├── checkpoints
├── analytics
├── shift-report
└── order/[orderId]
```

### Key Components

#### Dashboard Screen
- StatCard: Menampilkan statistik (sales, transactions, stock)
- QuickActions: Grid tombol aksi cepat
- GPSIndicator: Status GPS tracking
- ShiftStatus: Status shift aktif

#### POS Screen
- ProductGrid: Grid produk dari inventory
- CartSummary: Ringkasan keranjang
- CustomerSelector: Dropdown pilih customer
- PaymentModal: Modal pembayaran

#### Stock Management
- StockItem: Item stok dengan aksi
- StockConfirmModal: Modal konfirmasi dengan foto

## State Management

### authStore
```typescript
interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}
```

### shiftStore
```typescript
interface ShiftState {
  activeShift: Shift | null;
  isShiftActive: boolean;
  
  fetchActiveShift: () => Promise<void>;
  startShift: () => Promise<Result>;
  endShift: () => Promise<Result>;
  submitReport: (data: ReportData) => Promise<Result>;
}
```

### cartStore
```typescript
interface CartState {
  items: CartItem[];
  customer: Customer | null;
  discount: number;
  discountType: 'amount' | 'percentage';
  paymentMethod: 'cash' | 'qris' | 'transfer';
  
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (amount: number, type: string) => void;
  setPaymentMethod: (method: string) => void;
  getTotal: () => number;
  clear: () => void;
  checkout: (location: Location) => Promise<Result>;
}
```

### locationStore
```typescript
interface LocationState {
  currentLocation: Location | null;
  isTracking: boolean;
  lastUpdate: Date | null;
  error: string | null;
  
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  updateLocation: (location: Location) => Promise<void>;
}
```

## Services Design

### Location Service
```typescript
// Background location tracking dengan expo-location
- requestPermissions(): Promise<boolean>
- startBackgroundTracking(): Promise<void>
- stopBackgroundTracking(): void
- getCurrentLocation(): Promise<Location>
- updateRiderLocation(riderId: string, location: Location): Promise<void>
```

### Notification Service
```typescript
// Push notifications dengan expo-notifications
- requestPermissions(): Promise<boolean>
- registerForPushNotifications(): Promise<string>
- saveDeviceToken(riderId: string, token: string): Promise<void>
- handleNotification(notification: Notification): void
- scheduleLocalNotification(title: string, body: string): Promise<void>
```

## API Integration

### Supabase Queries

```typescript
// Dashboard stats
const getDashboardStats = async (riderId: string, date: string) => {
  const { data } = await supabase.rpc('get_rider_daily_stats', {
    p_rider_id: riderId,
    p_date: date
  });
  return data;
};

// Inventory
const getRiderInventory = async (riderId: string) => {
  const { data } = await supabase
    .from('inventory')
    .select('*, products(*)')
    .eq('rider_id', riderId)
    .gt('stock_quantity', 0);
  return data;
};

// Pending stock transfers
const getPendingTransfers = async (riderId: string) => {
  const { data } = await supabase
    .from('stock_movements')
    .select('*, products(*)')
    .eq('rider_id', riderId)
    .eq('status', 'pending')
    .eq('movement_type', 'transfer_to_rider');
  return data;
};

// Create transaction
const createTransaction = async (transaction: TransactionInput) => {
  const { data } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();
  return data;
};
```

### Realtime Subscriptions

```typescript
// Subscribe to new orders
supabase
  .channel('rider-orders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'customer_orders',
    filter: `rider_profile_id=eq.${riderId}`
  }, handleNewOrder)
  .subscribe();
```

## Offline Support

### Queue System
```typescript
interface OfflineQueue {
  transactions: PendingTransaction[];
  locationUpdates: PendingLocation[];
  checkpoints: PendingCheckpoint[];
  
  addToQueue: (type: string, data: any) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
}
```

### Sync Strategy
1. Detect network status dengan NetInfo
2. Queue operations saat offline
3. Auto-sync saat online
4. Conflict resolution: server wins

## Security Considerations

1. **Authentication**: Supabase Auth dengan JWT
2. **Session Storage**: expo-secure-store untuk token
3. **RLS Policies**: Row Level Security di Supabase
4. **Role Validation**: Check rider role di app dan server
5. **Location Privacy**: Hanya track saat shift aktif

## Dependencies

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-location": "~18.0.0",
    "expo-notifications": "~0.29.0",
    "expo-secure-store": "~14.0.0",
    "expo-camera": "~16.0.0",
    "expo-image-picker": "~16.0.0",
    "react-native-maps": "1.18.0",
    "@supabase/supabase-js": "^2.45.0",
    "zustand": "^5.0.0",
    "@react-native-async-storage/async-storage": "^2.0.0",
    "@react-native-community/netinfo": "^11.0.0"
  }
}
```

## Improvements dari Versi Sebelumnya

### GPS Tracking
- Background location tracking dengan expo-location TaskManager
- Optimized battery usage dengan significant location changes
- Visual indicator status GPS (green/yellow/red)
- Auto-retry saat update gagal

### Push Notifications
- Native push notifications dengan expo-notifications
- Sound dan vibration untuk incoming orders
- Deep linking ke order detail
- Notification channels untuk Android

### Offline Support
- Queue system untuk transactions
- Local caching dengan AsyncStorage
- Auto-sync saat reconnect
- Conflict resolution

### UX Improvements
- Native navigation dengan Expo Router
- Smooth animations dengan Reanimated
- Pull-to-refresh di semua list
- Loading states dan error handling
