# Design Document - Aplikasi POS Karyawan Branch

## Overview

Aplikasi POS Karyawan Branch adalah aplikasi web modern berbasis React dan TypeScript yang terintegrasi dengan Supabase sebagai backend. Aplikasi ini dirancang khusus untuk kasir di Hub Branch dan Small Branch Zeger dengan antarmuka yang sleek, modern, dan dominan warna merah sesuai branding perusahaan.

Aplikasi ini menggunakan arsitektur component-based dengan React, state management menggunakan React hooks dan context, styling dengan Tailwind CSS dan shadcn/ui components, serta real-time capabilities dari Supabase.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           React Application (TypeScript)               │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │   Pages     │  │  Components  │  │   Hooks     │  │  │
│  │  │  - Auth     │  │  - POS UI    │  │  - useAuth  │  │  │
│  │  │  - POS      │  │  - Cart      │  │  - useCart  │  │  │
│  │  │  - History  │  │  - Product   │  │  - usePOS   │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         Supabase Client Integration             │  │  │
│  │  │  - Auth  - Database  - Real-time  - Storage    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │  Auth Server │  │  Real-time   │      │
│  │   Database   │  │              │  │   Server     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: React Context API + Hooks
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Routing**: React Router v6
- **Form Handling**: React Hook Form + Zod validation
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Printing**: browser print API + react-to-print

## Components and Interfaces

### Core Components

#### 1. Authentication Components

**AuthPage Component**
- Login form dengan email dan password
- Validasi input menggunakan Zod schema
- Error handling untuk kredensial invalid
- Loading state saat proses autentikasi
- Redirect ke dashboard setelah login sukses

**ProtectedRoute Component**
- HOC untuk melindungi routes yang memerlukan autentikasi
- Cek session dari Supabase Auth
- Cek role user (harus bh_kasir atau sb_kasir)
- Redirect ke login jika tidak terautentikasi

#### 2. POS Components

**POSDashboard Component**
- Header dengan logo Zeger, nama branch, dan info kasir
- Stats cards: total transaksi hari ini, total penjualan, jumlah item
- Navigation menu: Transaksi Baru, Riwayat, Inventory, Absensi
- Real-time update untuk stats menggunakan Supabase subscriptions

**POSTransaction Component**
- Layout dua kolom: Product List (kiri) dan Cart (kanan)
- Search bar untuk filter produk
- Product grid dengan card untuk setiap produk
- Cart component dengan list items, quantity controls, dan total
- Checkout button yang membuka payment dialog

**ProductCard Component**
```typescript
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    code: string;
    price: number;
    image_url?: string;
    category?: string;
  };
  stock: number;
  onAddToCart: (product: Product) => void;
}
```

**Cart Component**
```typescript
interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  subtotal: number;
  discount: number;
  total: number;
}
```

**PaymentDialog Component**
- Modal dialog untuk proses pembayaran
- Tabs untuk metode pembayaran: Cash, QRIS, Transfer
- Cash tab: input jumlah uang diterima, tampilkan kembalian
- QRIS tab: tampilkan QR code dan instruksi
- Transfer tab: tampilkan nomor rekening dan instruksi
- Confirm button untuk finalisasi pembayaran

**SplitBillDialog Component**
- Interface untuk membagi items ke multiple groups
- Drag and drop atau checkbox untuk select items
- Preview total untuk setiap group
- Process payment untuk setiap group secara berurutan

#### 3. Receipt/Print Components

**ReceiptTemplate Component**
```typescript
interface ReceiptData {
  transaction_number: string;
  branch_name: string;
  branch_address: string;
  transaction_date: Date;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  cash_received?: number;
  change?: number;
}
```
- Format thermal printer 58mm atau 80mm
- Logo Zeger di header
- Detail transaksi dan items
- Footer dengan ucapan terima kasih

#### 4. Inventory Components

**InventoryList Component**
- Table dengan kolom: Produk, Kode, Kategori, Stok, Status
- Search dan filter functionality
- Color-coded status: hijau (stok aman), kuning (low stock), merah (habis)
- Real-time update saat stok berubah

#### 5. Attendance Components

**AttendanceCard Component**
- Display status absensi hari ini
- Check-in button dengan geolocation capture
- Check-out button dengan geolocation capture
- Display waktu check-in dan check-out
- History absensi minggu ini

#### 6. Transaction History Components

**TransactionHistory Component**
- Table dengan transaksi terfilter by branch
- Date range picker untuk filter
- Search by transaction number
- Click row untuk detail

**TransactionDetail Component**
- Modal atau page dengan detail lengkap transaksi
- List items dengan quantity dan harga
- Info pembayaran
- Void button (jika belum di-void)
- Reprint receipt button

### Custom Hooks

#### useAuth Hook
```typescript
interface UseAuthReturn {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isKasir: boolean;
}
```

#### useCart Hook
```typescript
interface UseCartReturn {
  items: CartItem[];
  addItem: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}
```

#### usePOS Hook
```typescript
interface UsePOSReturn {
  createTransaction: (
    items: CartItem[],
    paymentMethod: string,
    paymentDetails?: any
  ) => Promise<Transaction>;
  voidTransaction: (transactionId: string, reason: string) => Promise<void>;
  getTransactionHistory: (filters: TransactionFilters) => Promise<Transaction[]>;
  loading: boolean;
  error: Error | null;
}
```

#### useInventory Hook
```typescript
interface UseInventoryReturn {
  inventory: InventoryItem[];
  loading: boolean;
  error: Error | null;
  refreshInventory: () => Promise<void>;
  getProductStock: (productId: string) => number;
}
```

#### useAttendance Hook
```typescript
interface UseAttendanceReturn {
  todayAttendance: Attendance | null;
  checkIn: (location: GeolocationPosition) => Promise<void>;
  checkOut: (location: GeolocationPosition) => Promise<void>;
  loading: boolean;
  error: Error | null;
}
```

## Data Models

### TypeScript Interfaces

```typescript
// User Profile
interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  branch_id: string | null;
  is_active: boolean;
  app_access_type: 'web_backoffice' | 'pos_app' | 'rider_app';
  created_at: string;
  updated_at: string;
}

type UserRole = 
  | 'bh_kasir' 
  | 'sb_kasir' 
  | 'bh_staff' 
  | 'sb_staff'
  | '2_Hub_Kasir'
  | '3_SB_Kasir';

// Branch
interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  branch_type: 'hub' | 'small';
  is_active: boolean;
}

// Product
interface Product {
  id: string;
  name: string;
  code: string;
  category: string | null;
  price: number;
  cost_price: number | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  custom_options: any;
}

// Inventory
interface InventoryItem {
  id: string;
  product_id: string;
  branch_id: string | null;
  rider_id: string | null;
  stock_quantity: number;
  reserved_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  last_updated: string;
  product?: Product; // joined data
}

// Transaction
interface Transaction {
  id: string;
  transaction_number: string;
  customer_id: string | null;
  rider_id: string | null;
  branch_id: string | null;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string | null;
  status: 'pending' | 'completed' | 'cancelled' | 'returned';
  notes: string | null;
  transaction_date: string;
  is_voided: boolean;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
}

// Transaction Item
interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product; // joined data
}

// Attendance
interface Attendance {
  id: string;
  rider_id: string | null;
  branch_id: string | null;
  check_in_time: string | null;
  check_in_location: string | null;
  check_out_time: string | null;
  check_out_location: string | null;
  work_date: string | null;
  status: string | null;
}

// Stock Movement
interface StockMovement {
  id: string;
  product_id: string | null;
  branch_id: string | null;
  rider_id: string | null;
  movement_type: 'in' | 'out' | 'transfer' | 'adjustment' | 'return';
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  status: string | null;
}
```

## Correct
ness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Authentication verifies credentials correctly
*For any* valid email and password combination, when submitted through the login form, the system should successfully authenticate via Supabase Auth and return a session.
**Validates: Requirements 1.2**

### Property 2: Role check after authentication
*For any* successful authentication, the system should always query the profiles table to retrieve the user's role before granting access.
**Validates: Requirements 1.3**

### Property 3: Kasir role grants POS access
*For any* user with role 'bh_kasir', 'sb_kasir', '2_Hub_Kasir', or '3_SB_Kasir', the system should grant access to the POS application after successful authentication.
**Validates: Requirements 1.4**

### Property 4: Non-kasir roles are rejected
*For any* user with a role other than kasir roles, the system should deny access to the POS application and display an error message.
**Validates: Requirements 1.5**

### Property 5: Successful login creates session
*For any* successful kasir login, the system should create a session and redirect to the POS dashboard.
**Validates: Requirements 1.6**

### Property 6: Logout clears session
*For any* logout action, the system should clear the user session and redirect to the login page.
**Validates: Requirements 1.7**

### Property 7: Dashboard displays branch information
*For any* logged-in kasir, the dashboard should display the branch information from the branches table matching the kasir's branch_id.
**Validates: Requirements 2.2**

### Property 8: Dashboard shows sales summary
*For any* dashboard load, the system should display today's sales summary including total transactions, total sales amount, and items sold count.
**Validates: Requirements 2.3**

### Property 9: Navigation routing works correctly
*For any* navigation menu item clicked, the system should route to the corresponding page without errors.
**Validates: Requirements 2.5**

### Property 10: Only active products are displayed
*For any* product list display, only products with is_active = true should be shown to the kasir.
**Validates: Requirements 3.1**

### Property 11: Product search filters correctly
*For any* search query entered, the system should filter products where the product name or code contains the search term (case-insensitive).
**Validates: Requirements 3.2**

### Property 12: Adding product to cart sets quantity to 1
*For any* product clicked when not in cart, the system should add it to the cart with quantity = 1.
**Validates: Requirements 3.3**

### Property 13: Adding existing product increments quantity
*For any* product already in cart, clicking it again should increment its quantity by 1.
**Validates: Requirements 3.4**

### Property 14: Quantity change updates item total
*For any* cart item, when quantity is changed to Q, the item's total_price should equal Q * unit_price.
**Validates: Requirements 3.5**

### Property 15: Removing item updates cart
*For any* item removed from cart, the item should no longer exist in the cart and the cart total should be recalculated as the sum of remaining items.
**Validates: Requirements 3.6**

### Property 16: Cart displays correct totals
*For any* non-empty cart, the displayed subtotal should equal the sum of all item totals, and final total should equal subtotal minus discount.
**Validates: Requirements 3.7**

### Property 17: Checkout opens payment dialog
*For any* cart state, clicking checkout should open the payment dialog with available payment methods.
**Validates: Requirements 3.8**

### Property 18: Cash payment calculates change correctly
*For any* cash payment where amount_received >= total, the change should equal amount_received - total.
**Validates: Requirements 4.3**

### Property 19: Transaction creation on payment confirmation
*For any* valid payment confirmation, the system should create a transaction record in the transactions table with status = 'completed'.
**Validates: Requirements 4.4**

### Property 20: Transaction items match cart items
*For any* completed transaction, the number of records in transaction_items should equal the number of items in the cart, and each item's data should match.
**Validates: Requirements 4.5**

### Property 21: Inventory deduction on transaction
*For any* completed transaction, for each product sold, the stock_quantity in inventory should decrease by the quantity sold.
**Validates: Requirements 4.6**

### Property 22: Stock movements logged for transactions
*For any* completed transaction, stock_movements records should be created with movement_type = 'out' for each product sold.
**Validates: Requirements 4.7**

### Property 23: Transaction number format compliance
*For any* created transaction, the transaction_number should match the format: ZEG-{branch_code}-{YYYYMMDD}-{sequence}.
**Validates: Requirements 4.8**

### Property 24: Split bill creates correct groups
*For any* split bill operation, the sum of all group totals should equal the original cart total.
**Validates: Requirements 5.3**

### Property 25: Split bill creates multiple transactions
*For any* split bill with N groups, the system should create exactly N separate transaction records.
**Validates: Requirements 5.4**

### Property 26: All split transactions marked completed
*For any* completed split bill, all related transaction records should have status = 'completed'.
**Validates: Requirements 5.5**

### Property 27: Receipt contains all required information
*For any* transaction receipt, it should contain: transaction_number, branch info, date-time, all items with quantities and prices, subtotal, discount, total, and payment method.
**Validates: Requirements 6.3**

### Property 28: Inventory displays stock quantities
*For any* product in the inventory list, the displayed stock_quantity should match the value from the inventory table for the kasir's branch.
**Validates: Requirements 7.1**

### Property 29: Inventory filtered by branch
*For any* inventory display, only inventory records where branch_id matches the kasir's branch_id should be shown.
**Validates: Requirements 7.2**

### Property 30: Inventory search filters correctly
*For any* search query in inventory, products should be filtered where name or code contains the search term.
**Validates: Requirements 7.3**

### Property 31: Low stock warning displayed
*For any* product where stock_quantity < min_stock_level, a warning indicator should be displayed.
**Validates: Requirements 7.4**

### Property 32: Out of stock products not addable
*For any* product where stock_quantity = 0, the product should display "Habis" status and should not be addable to cart.
**Validates: Requirements 7.5**

### Property 33: Attendance status displayed
*For any* attendance page load, the system should display the current day's attendance record if it exists.
**Validates: Requirements 8.1**

### Property 34: Check-in creates attendance record
*For any* check-in action, the system should create an attendance record with check_in_time set to the current timestamp.
**Validates: Requirements 8.3**

### Property 35: Check-in captures location
*For any* successful check-in, the attendance record should include check_in_location from the browser's geolocation API.
**Validates: Requirements 8.4**

### Property 36: Check-out updates attendance record
*For any* check-out action, the system should update the existing attendance record with check_out_time set to the current timestamp.
**Validates: Requirements 8.6**

### Property 37: Check-out updates location and status
*For any* successful check-out, the attendance record should be updated with check_out_location and status = 'checked_out'.
**Validates: Requirements 8.7**

### Property 38: Transaction history filtered by branch
*For any* transaction history display, only transactions where branch_id matches the kasir's branch_id should be shown.
**Validates: Requirements 9.2**

### Property 39: Date filter works correctly
*For any* date range filter applied, only transactions where transaction_date falls within the specified range should be displayed.
**Validates: Requirements 9.3**

### Property 40: Transaction detail includes all items
*For any* transaction detail view, all transaction_items associated with that transaction_id should be displayed.
**Validates: Requirements 9.4**

### Property 41: Void request creation
*For any* void action on a transaction, the system should create a record in transaction_void_requests with status = 'pending'.
**Validates: Requirements 9.5**

### Property 42: Loading indicator displayed
*For any* asynchronous operation in progress, a loading indicator should be visible to the user.
**Validates: Requirements 10.5**

### Property 43: Error messages displayed in Indonesian
*For any* error that occurs, the system should display an error message in Indonesian language.
**Validates: Requirements 10.6**

### Property 44: Success notifications displayed
*For any* successful operation (transaction, check-in, etc.), the system should display a success notification.
**Validates: Requirements 10.7**

### Property 45: Stock quantity never negative
*For any* inventory update operation, the resulting stock_quantity should always be >= 0.
**Validates: Requirements 11.5**

### Property 46: Offline status notification
*For any* network disconnection, the system should display an offline status notification to the user.
**Validates: Requirements 12.1**

### Property 47: Offline transactions stored locally
*For any* transaction created while offline, the transaction data should be stored in browser local storage.
**Validates: Requirements 12.2**

### Property 48: Sync on reconnection
*For any* network reconnection, all transactions in local storage should be synced to the Supabase database.
**Validates: Requirements 12.3**

### Property 49: Local storage cleared after sync
*For any* successful sync operation, the synced transaction data should be removed from local storage.
**Validates: Requirements 12.4**

### Property 50: Failed sync retries with backoff
*For any* failed sync attempt, the system should retry with exponentially increasing delay intervals.
**Validates: Requirements 12.5**

## Error Handling

### Authentication Errors
- Invalid credentials: Display "Email atau password salah" message
- Network errors: Display "Gagal terhubung ke server. Periksa koneksi internet Anda"
- Session expired: Automatically redirect to login with message "Sesi Anda telah berakhir. Silakan login kembali"

### Transaction Errors
- Insufficient stock: Prevent checkout and display "Stok tidak mencukupi untuk {product_name}"
- Payment validation: Display specific error for each payment method failure
- Database errors: Display "Gagal menyimpan transaksi. Silakan coba lagi" and keep cart data intact
- Concurrent stock updates: Use database transactions with row-level locking to prevent race conditions

### Inventory Errors
- Stock update failures: Display "Gagal memperbarui stok" and rollback transaction
- Negative stock prevention: Database constraint prevents negative values, show error if attempted

### Attendance Errors
- Geolocation denied: Allow check-in/out without location but log warning
- Already checked in: Display "Anda sudah melakukan check-in hari ini"
- Check-out without check-in: Prevent and display "Anda belum melakukan check-in"

### Network Errors
- Connection lost during transaction: Save to local storage and notify user
- Sync failures: Retry with exponential backoff (1s, 2s, 4s, 8s, 16s, max 60s)
- Timeout errors: Display "Permintaan timeout. Silakan coba lagi"

## Testing Strategy

### Unit Testing
The application will use **Vitest** as the testing framework for unit tests. Unit tests will cover:

- **Component rendering**: Verify components render correctly with different props
- **User interactions**: Test button clicks, form submissions, input changes
- **State management**: Test custom hooks behavior (useCart, useAuth, usePOS)
- **Utility functions**: Test calculation functions (totals, change, discounts)
- **Error boundaries**: Test error handling in components

Example unit tests:
- Cart calculations: Test subtotal, discount, and total calculations with specific values
- Product filtering: Test search functionality with known product lists
- Form validation: Test login form with valid and invalid inputs
- Navigation: Test routing behavior with React Router

### Property-Based Testing
The application will use **fast-check** library for property-based testing in TypeScript/JavaScript. Property-based tests will:

- Run a minimum of 100 iterations per property test
- Generate random but valid test data
- Verify universal properties hold across all inputs
- Each property test will be tagged with a comment referencing the design document

**Property Testing Library**: fast-check (https://github.com/dubzzz/fast-check)

**Configuration**: Each property test will be configured with:
```typescript
fc.assert(
  fc.property(/* generators */, (/* inputs */) => {
    // Property assertion
  }),
  { numRuns: 100 } // Minimum 100 iterations
);
```

**Test Tagging Format**: Each property-based test must include a comment:
```typescript
// Feature: pos-karyawan-branch, Property 14: Quantity change updates item total
test('quantity change updates item total correctly', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 100 }), // quantity
      fc.float({ min: 1, max: 1000000 }), // unit_price
      (quantity, unitPrice) => {
        const totalPrice = calculateItemTotal(quantity, unitPrice);
        expect(totalPrice).toBe(quantity * unitPrice);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test Coverage**:
- Authentication flows with various valid/invalid credentials
- Cart operations with random products and quantities
- Price calculations with random amounts
- Stock updates with random quantities
- Transaction number generation with random dates and sequences
- Date filtering with random date ranges
- Split bill with random item distributions

### Integration Testing
Integration tests will verify:
- Supabase client integration (auth, database queries, real-time subscriptions)
- End-to-end transaction flow from cart to database
- Inventory updates across multiple operations
- Attendance flow with geolocation
- Print functionality with receipt generation

### Manual Testing Checklist
- Visual design compliance (red color scheme, modern UI)
- Responsive behavior on different screen sizes
- Print output on actual thermal printers (58mm and 80mm)
- Geolocation accuracy for attendance
- Real-time updates with multiple users
- Offline mode and sync behavior

## Performance Considerations

### Optimization Strategies
1. **Product List**: Implement virtual scrolling for large product catalogs (react-window)
2. **Search**: Debounce search input (300ms) to reduce unnecessary filtering
3. **Real-time Updates**: Use Supabase subscriptions only for critical data (inventory, transactions)
4. **Image Loading**: Lazy load product images with placeholder
5. **Caching**: Cache product list and branch info in React Query with stale-while-revalidate
6. **Bundle Size**: Code splitting by route to reduce initial load time

### Performance Targets
- Initial page load: < 2 seconds
- Transaction completion: < 1 second
- Search response: < 200ms
- Print generation: < 500ms

## Security Considerations

### Authentication & Authorization
- Use Supabase Auth with secure session management
- Implement Row Level Security (RLS) policies in Supabase
- Verify user role on every protected route
- Auto-logout after 8 hours of inactivity

### Data Protection
- Never expose sensitive data in client-side code
- Use HTTPS for all API communications
- Sanitize all user inputs to prevent XSS
- Implement CSRF protection for state-changing operations

### RLS Policies
```sql
-- Transactions: Kasir can only see their branch transactions
CREATE POLICY "kasir_view_branch_transactions" ON transactions
  FOR SELECT USING (
    branch_id IN (
      SELECT branch_id FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Inventory: Kasir can only see their branch inventory
CREATE POLICY "kasir_view_branch_inventory" ON inventory
  FOR SELECT USING (
    branch_id IN (
      SELECT branch_id FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Attendance: Kasir can only manage their own attendance
CREATE POLICY "kasir_manage_own_attendance" ON attendance
  FOR ALL USING (
    rider_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid()
    )
  );
```

## Deployment Strategy

### Build Configuration
- Environment variables for Supabase URL and anon key
- Production build with minification and tree-shaking
- Source maps for error tracking (Sentry integration)

### Hosting
- Deploy to Vercel or Netlify for automatic HTTPS and CDN
- Configure custom domain: pos.zeger.id
- Enable automatic deployments from main branch

### Monitoring
- Error tracking with Sentry
- Analytics with Google Analytics or Plausible
- Performance monitoring with Web Vitals
- Uptime monitoring with UptimeRobot

## Future Enhancements

### Phase 2 Features
1. **Customer Management**: Link transactions to customer profiles for loyalty program
2. **Discount Management**: Support for promo codes and automatic discounts
3. **Shift Management**: Automatic shift tracking and reporting
4. **Multi-language**: Support for English and other languages
5. **Advanced Reporting**: Daily, weekly, monthly sales reports with charts
6. **Product Recommendations**: Suggest products based on purchase history
7. **Barcode Scanner**: Support for barcode scanning for faster product selection
8. **Kitchen Display System**: Integration with kitchen for order management

### Technical Improvements
1. **Progressive Web App**: Add service worker for better offline support
2. **Push Notifications**: Real-time notifications for important events
3. **Voice Commands**: Voice-activated product search and commands
4. **Biometric Auth**: Fingerprint or face recognition for faster login
5. **Multi-currency**: Support for different currencies
6. **Tax Calculation**: Automatic tax calculation based on product categories
