# Requirements Document

## Introduction

Dokumen ini mendefinisikan requirements untuk aplikasi Rider Expo - aplikasi mobile native untuk rider/sales Zeger Coffee yang dibangun menggunakan Expo/React Native. Aplikasi ini merupakan reimplementasi dari aplikasi rider web-based yang sudah ada (`src/components/mobile`) dengan peningkatan performa, UX native, dan fitur GPS/notifikasi yang lebih baik.

## Glossary

- **Rider**: Sales/delivery person yang membawa stok produk dan menjual langsung ke customer
- **Shift**: Periode kerja rider dalam satu hari, dimulai saat menerima stok dan berakhir saat submit laporan
- **Stock_Movement**: Perpindahan stok dari branch ke rider atau sebaliknya
- **Checkpoint**: Lokasi yang dicatat rider selama beroperasi untuk tracking route
- **Customer_Order**: Pesanan online dari customer melalui Zeger App
- **Attendance**: Catatan kehadiran rider (check-in/check-out)
- **Transaction**: Catatan penjualan yang dilakukan rider
- **Branch_Hub**: Cabang utama yang menyuplai stok ke rider
- **Supabase**: Backend-as-a-Service yang digunakan untuk database dan authentication

## Requirements

### Requirement 1: Authentication & Session Management

**User Story:** As a rider, I want to securely login to the app, so that I can access my work features and data.

#### Acceptance Criteria

1. WHEN a rider opens the app for the first time, THE App SHALL display a login screen with phone/email and password fields
2. WHEN a rider enters valid credentials and submits, THE Auth_System SHALL authenticate against Supabase and create a session
3. WHEN authentication succeeds, THE App SHALL store the session securely and navigate to the dashboard
4. WHEN a rider has an existing valid session, THE App SHALL automatically restore the session on app launch
5. WHEN a rider taps logout, THE Auth_System SHALL clear the session and navigate to login screen
6. IF authentication fails, THEN THE App SHALL display an appropriate error message in Indonesian

---

### Requirement 2: Dashboard & Statistics

**User Story:** As a rider, I want to see my daily performance summary, so that I can track my sales and stock status.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Dashboard SHALL display today's total sales amount
2. WHEN the dashboard loads, THE Dashboard SHALL display today's transaction count
3. WHEN the dashboard loads, THE Dashboard SHALL display current stock quantity
4. WHEN the dashboard loads, THE Dashboard SHALL display pending online orders count
5. WHEN a rider taps refresh, THE Dashboard SHALL fetch latest data from Supabase
6. WHEN new data is available, THE Dashboard SHALL update statistics in real-time via Supabase subscriptions
7. WHEN the rider has an active shift, THE Dashboard SHALL display GPS status indicator (active/inactive/error)

---

### Requirement 3: GPS Location Tracking

**User Story:** As a rider, I want my location to be tracked while working, so that the system can monitor my route and customers can see my position.

#### Acceptance Criteria

1. WHEN the app starts and rider has active shift, THE GPS_Tracker SHALL request location permissions
2. WHEN location permission is granted, THE GPS_Tracker SHALL start continuous location tracking
3. WHILE tracking is active, THE GPS_Tracker SHALL update rider location to Supabase every 30 seconds
4. WHEN location update succeeds, THE GPS_Tracker SHALL display green status indicator
5. IF location update fails, THEN THE GPS_Tracker SHALL display red status indicator and retry
6. WHEN rider ends shift, THE GPS_Tracker SHALL stop location tracking
7. THE GPS_Tracker SHALL use high accuracy mode for precise location data

---

### Requirement 4: Stock Management - Receiving Stock

**User Story:** As a rider, I want to receive and confirm stock transfers from branch, so that I can start selling.

#### Acceptance Criteria

1. WHEN rider opens stock management, THE Stock_Manager SHALL display list of pending stock transfers
2. WHEN pending transfers exist, THE Stock_Manager SHALL show product name, quantity, and transfer date
3. WHEN rider taps confirm on a transfer, THE Stock_Manager SHALL update stock_movement status to 'received'
4. WHEN stock is confirmed, THE Stock_Manager SHALL add quantity to rider's inventory
5. WHEN first stock is confirmed today, THE Stock_Manager SHALL automatically start a new shift
6. WHEN stock confirmation succeeds, THE Stock_Manager SHALL display success message and refresh list
7. IF no pending transfers exist, THEN THE Stock_Manager SHALL display empty state message

---

### Requirement 5: Stock Management - Returning Stock

**User Story:** As a rider, I want to return unsold stock at end of shift, so that inventory is properly tracked.

#### Acceptance Criteria

1. WHEN rider opens stock return tab, THE Stock_Manager SHALL display list of remaining inventory items
2. WHEN inventory items exist, THE Stock_Manager SHALL show product name, remaining quantity, and category
3. WHEN rider taps return on an item, THE Stock_Manager SHALL prompt for photo verification
4. WHEN photo is captured, THE Stock_Manager SHALL upload photo to Supabase storage
5. WHEN return is submitted, THE Stock_Manager SHALL create stock_movement with type 'return'
6. WHEN return succeeds, THE Stock_Manager SHALL set inventory quantity to zero
7. WHEN all stock is returned, THE Stock_Manager SHALL display completion message and enable shift report

---

### Requirement 6: Selling Interface (POS)

**User Story:** As a rider, I want to process sales transactions, so that I can sell products to customers.

#### Acceptance Criteria

1. WHEN rider opens selling screen, THE POS SHALL display available products from rider's inventory
2. WHEN rider taps a product, THE POS SHALL add product to cart with quantity 1
3. WHEN rider taps + on cart item, THE POS SHALL increment quantity if stock available
4. WHEN rider taps - on cart item, THE POS SHALL decrement quantity or remove if quantity is 1
5. IF cart quantity exceeds available stock, THEN THE POS SHALL display stock insufficient error
6. WHEN rider selects payment method (cash/qris/transfer), THE POS SHALL enable checkout button
7. WHEN rider submits transaction, THE POS SHALL create transaction record and deduct inventory
8. WHEN transaction succeeds, THE POS SHALL display success modal and clear cart
9. THE POS SHALL support discount by amount or percentage
10. THE POS SHALL capture transaction location coordinates

---

### Requirement 7: Customer Selection

**User Story:** As a rider, I want to associate sales with customers, so that customer purchase history is tracked.

#### Acceptance Criteria

1. WHEN rider opens selling screen, THE Customer_Selector SHALL display customer dropdown
2. WHEN rider selects a customer, THE POS SHALL associate transaction with selected customer
3. WHEN rider selects "Pelanggan Umum", THE POS SHALL create transaction without customer association
4. WHEN rider taps add customer button, THE Customer_Selector SHALL display quick add form
5. WHEN rider submits new customer, THE Customer_Selector SHALL create customer record and select it

---

### Requirement 8: Attendance Management

**User Story:** As a rider, I want to record my attendance, so that my work hours are tracked.

#### Acceptance Criteria

1. WHEN rider opens attendance screen, THE Attendance_Manager SHALL display current date and time
2. WHEN rider has not checked in today, THE Attendance_Manager SHALL display check-in button
3. WHEN rider taps check-in, THE Attendance_Manager SHALL capture current GPS location
4. WHEN check-in succeeds, THE Attendance_Manager SHALL create attendance record with check_in_time and location
5. WHEN rider has checked in but not out, THE Attendance_Manager SHALL display check-out button
6. WHEN rider taps check-out, THE Attendance_Manager SHALL update attendance with check_out_time and location
7. WHEN attendance action succeeds, THE Attendance_Manager SHALL display success message

---

### Requirement 9: Checkpoint Recording

**User Story:** As a rider, I want to record checkpoints during my route, so that my sales locations are tracked.

#### Acceptance Criteria

1. WHEN rider opens checkpoints screen, THE Checkpoint_Manager SHALL display today's recorded checkpoints
2. WHEN rider taps add checkpoint, THE Checkpoint_Manager SHALL display form with name and notes fields
3. WHEN rider submits checkpoint, THE Checkpoint_Manager SHALL capture current GPS coordinates
4. WHEN checkpoint is saved, THE Checkpoint_Manager SHALL create checkpoint record with location data
5. WHEN rider taps a checkpoint, THE Checkpoint_Manager SHALL offer to open location in Google Maps
6. THE Checkpoint_Manager SHALL display checkpoint count for today

---

### Requirement 10: Transaction History & Analytics

**User Story:** As a rider, I want to view my sales history and analytics, so that I can track my performance.

#### Acceptance Criteria

1. WHEN rider opens analytics screen, THE Analytics_View SHALL display sales summary for selected period
2. THE Analytics_View SHALL support period filters: today, yesterday, weekly, monthly, custom
3. WHEN period changes, THE Analytics_View SHALL fetch and display updated statistics
4. THE Analytics_View SHALL display total sales, transaction count, and average transaction value
5. THE Analytics_View SHALL display sales breakdown by payment method
6. THE Analytics_View SHALL display top selling products with quantities
7. WHEN rider taps a transaction, THE Analytics_View SHALL display transaction details with items
8. THE Analytics_View SHALL support void transaction request with reason

---

### Requirement 11: Shift Report Submission

**User Story:** As a rider, I want to submit end-of-shift report, so that my daily work is properly recorded.

#### Acceptance Criteria

1. WHEN rider opens shift report, THE Shift_Reporter SHALL display sales summary for current shift
2. THE Shift_Reporter SHALL display cash sales, QRIS sales, and transfer sales separately
3. THE Shift_Reporter SHALL allow adding operational expenses with type, amount, and description
4. THE Shift_Reporter SHALL calculate cash deposit as: cash_sales - operational_expenses
5. WHEN rider has remaining stock, THE Shift_Reporter SHALL block submission and prompt stock return
6. WHEN rider submits report, THE Shift_Reporter SHALL require cash deposit photo upload
7. WHEN report is submitted, THE Shift_Reporter SHALL update shift status to 'completed'
8. WHEN submission succeeds, THE Shift_Reporter SHALL display success modal and end shift

---

### Requirement 12: Online Order Management

**User Story:** As a rider, I want to receive and manage online orders, so that I can fulfill customer deliveries.

#### Acceptance Criteria

1. WHEN new order is assigned to rider, THE Order_Manager SHALL display notification with sound and vibration
2. WHEN notification appears, THE Order_Manager SHALL show order details popup
3. WHEN rider taps accept, THE Order_Manager SHALL update order status to 'accepted'
4. WHEN rider taps reject, THE Order_Manager SHALL prompt for rejection reason and update status
5. WHEN order is accepted, THE Order_Manager SHALL offer to open delivery location in Google Maps
6. THE Order_Manager SHALL display list of all assigned orders with status tabs
7. WHEN rider taps complete on order, THE Order_Manager SHALL update status to 'completed'

---

### Requirement 13: Push Notifications

**User Story:** As a rider, I want to receive push notifications for new orders, so that I don't miss incoming orders.

#### Acceptance Criteria

1. WHEN app starts, THE Notification_Service SHALL request push notification permissions
2. WHEN permission is granted, THE Notification_Service SHALL register device token with Supabase
3. WHEN new order is assigned, THE Notification_Service SHALL display push notification
4. WHEN rider taps notification, THE App SHALL navigate to order details
5. THE Notification_Service SHALL play alert sound for incoming orders
6. THE Notification_Service SHALL trigger device vibration for incoming orders

---

### Requirement 14: Profile Management

**User Story:** As a rider, I want to view and manage my profile, so that I can see my account information.

#### Acceptance Criteria

1. WHEN rider opens profile screen, THE Profile_View SHALL display rider's name and role
2. THE Profile_View SHALL display assigned branch information
3. THE Profile_View SHALL display contact information (phone, email)
4. WHEN rider taps logout, THE Profile_View SHALL confirm and execute logout

---

### Requirement 15: Offline Support

**User Story:** As a rider, I want the app to work with limited connectivity, so that I can continue working in areas with poor signal.

#### Acceptance Criteria

1. WHEN network is unavailable, THE App SHALL display offline indicator
2. WHEN offline, THE App SHALL cache and display last fetched data
3. WHEN offline, THE App SHALL queue transactions for later sync
4. WHEN network is restored, THE App SHALL automatically sync queued data
5. WHEN sync completes, THE App SHALL display sync success notification

---

### Requirement 16: Map Integration

**User Story:** As a rider, I want to view maps and navigate to customer locations, so that I can efficiently deliver orders.

#### Acceptance Criteria

1. WHEN rider views order with delivery address, THE Map_View SHALL display location on map
2. WHEN rider taps navigate, THE Map_View SHALL open Google Maps with directions
3. THE Map_View SHALL display rider's current location marker
4. THE Map_View SHALL display customer location marker with address info
