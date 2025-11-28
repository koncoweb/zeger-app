# Implementation Plan - Aplikasi POS Karyawan Branch

- [x] 1. Setup project structure dan konfigurasi





  - Buat folder structure untuk POS app di src/pages/pos dan src/components/pos
  - Setup routing untuk POS pages di App.tsx
  - Konfigurasi Tailwind dengan color scheme merah Zeger (#DC2626)
  - Install dependencies: fast-check untuk property testing
  - _Requirements: 10.1, 10.2_

- [x] 2. Implementasi autentikasi dan otorisasi





- [x] 2.1 Buat halaman login POS


  - Buat component POSAuth.tsx dengan form login (email, password)
  - Implementasi validasi form dengan Zod schema
  - Styling dengan desain modern dominan merah
  - _Requirements: 1.1_

- [x] 2.2 Implementasi useAuth hook


  - Buat custom hook useAuth untuk handle authentication flow
  - Implementasi signIn function dengan Supabase Auth
  - Implementasi role checking dari tabel profiles
  - Implementasi signOut function
  - _Requirements: 1.2, 1.3, 1.7_

- [x] 2.3 Write property test for authentication


  - **Property 1: Authentication verifies credentials correctly**
  - **Validates: Requirements 1.2**

- [x] 2.4 Write property test for role checking


  - **Property 2: Role check after authentication**
  - **Property 3: Kasir role grants POS access**
  - **Property 4: Non-kasir roles are rejected**
  - **Validates: Requirements 1.3, 1.4, 1.5**

- [x] 2.5 Implementasi ProtectedRoute component


  - Buat HOC ProtectedRoute untuk protect POS routes
  - Check session dan role (bh_kasir, sb_kasir, 2_Hub_Kasir, 3_SB_Kasir)
  - Redirect ke login jika unauthorized
  - _Requirements: 1.4, 1.5_

- [x] 2.6 Write property test for session management


  - **Property 5: Successful login creates session**
  - **Property 6: Logout clears session**
  - **Validates: Requirements 1.6, 1.7**

- [x] 3. Implementasi Dashboard POS




- [x] 3.1 Buat POSDashboard component


  - Layout dengan header (logo, branch info, kasir info)
  - Stats cards untuk ringkasan penjualan hari ini
  - Navigation menu (Transaksi Baru, Riwayat, Inventory, Absensi)
  - Styling dengan desain modern dominan merah
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 3.2 Implementasi fetch branch info dan sales summary


  - Query branch data dari tabel branches berdasarkan kasir's branch_id
  - Query dan calculate sales summary hari ini dari tabel transactions
  - Display total transaksi, total penjualan, jumlah item terjual
  - _Requirements: 2.2, 2.3_

- [x] 3.3 Write property test for dashboard data


  - **Property 7: Dashboard displays branch information**
  - **Property 8: Dashboard shows sales summary**
  - **Validates: Requirements 2.2, 2.3**

- [x] 3.4 Implementasi navigation routing


  - Setup React Router routes untuk POS pages
  - Implementasi navigation handler untuk menu items
  - _Requirements: 2.5_

- [x] 3.5 Write property test for navigation


  - **Property 9: Navigation routing works correctly**
  - **Validates: Requirements 2.5**

- [x] 4. Implementasi Product List dan Cart



- [x] 4.1 Buat ProductList component


  - Grid layout untuk display products
  - ProductCard component untuk setiap produk
  - Search bar dengan debounce untuk filter produk
  - Filter hanya produk dengan is_active = true
  - _Requirements: 3.1, 3.2_

- [x] 4.2 Write property test for product filtering


  - **Property 10: Only active products are displayed**
  - **Property 11: Product search filters correctly**
  - **Validates: Requirements 3.1, 3.2**

- [x] 4.3 Implementasi useCart hook


  - State management untuk cart items
  - addItem function: tambah produk ke cart dengan quantity 1
  - updateQuantity function: update quantity dan recalculate total
  - removeItem function: hapus item dan recalculate total
  - Calculate subtotal, discount, dan total
  - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4.4 Write property tests for cart operations



  - **Property 12: Adding product to cart sets quantity to 1**
  - **Property 13: Adding existing product increments quantity**
  - **Property 14: Quantity change updates item total**
  - **Property 15: Removing item updates cart**
  - **Property 16: Cart displays correct totals**
  - **Validates: Requirements 3.3, 3.4, 3.5, 3.6, 3.7**

- [x] 4.4 Buat Cart component


  - Display list of cart items dengan quantity controls
  - Display subtotal, discount, dan total akhir
  - Checkout button yang membuka payment dialog
  - Empty cart state
  - _Requirements: 3.7, 3.8_

- [x] 4.5 Write property test for checkout dialog


  - **Property 17: Checkout opens payment dialog**
  - **Validates: Requirements 3.8**

- [x] 5. Implementasi Payment dan Checkout





- [x] 5.1 Buat PaymentDialog component


  - Modal dialog dengan tabs untuk metode pembayaran
  - Cash tab: input jumlah uang diterima, display kembalian
  - QRIS tab: display QR code dan instruksi
  - Transfer tab: display nomor rekening dan instruksi
  - Confirm button untuk finalisasi pembayaran
  - _Requirements: 4.1, 4.2_

- [x] 5.2 Write property test for cash payment


  - **Property 18: Cash payment calculates change correctly**
  - **Validates: Requirements 4.3**

- [x] 5.3 Implementasi usePOS hook untuk transaction processing


  - createTransaction function: buat transaction record
  - Generate transaction_number dengan format ZEG-{branch_code}-{YYYYMMDD}-{sequence}
  - Buat transaction_items records untuk setiap cart item
  - Update inventory: kurangi stock_quantity untuk setiap produk
  - Buat stock_movements records dengan movement_type = 'out'
  - Handle database transactions untuk atomicity
  - _Requirements: 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 5.4 Write property tests for transaction creation


  - **Property 19: Transaction creation on payment confirmation**
  - **Property 20: Transaction items match cart items**
  - **Property 21: Inventory deduction on transaction**
  - **Property 22: Stock movements logged for transactions**
  - **Property 23: Transaction number format compliance**
  - **Validates: Requirements 4.4, 4.5, 4.6, 4.7, 4.8**

- [x] 5.5 Buat TransactionSuccess component


  - Display success message dengan transaction number
  - Tombol Cetak Struk
  - Tombol Transaksi Baru (clear cart dan kembali ke product list)
  - _Requirements: 4.9_

- [x] 6. Implementasi Split Bill





- [x] 6.1 Buat SplitBillDialog component


  - Interface untuk membagi items ke multiple groups
  - Checkbox atau drag-and-drop untuk select items
  - Display total untuk setiap group
  - Process payment button untuk setiap group
  - _Requirements: 5.1, 5.2_

- [x] 6.2 Implementasi split bill logic


  - Function untuk membagi cart items ke groups
  - Validate sum of group totals = original total
  - Create separate transaction untuk setiap group
  - Mark all transactions as completed setelah semua dibayar
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 6.3 Write property tests for split bill


  - **Property 24: Split bill creates correct groups**
  - **Property 25: Split bill creates multiple transactions**
  - **Property 26: All split transactions marked completed**
  - **Validates: Requirements 5.3, 5.4, 5.5**

- [x] 7. Implementasi Receipt Printing





- [x] 7.1 Buat ReceiptTemplate component


  - Format thermal printer 58mm atau 80mm
  - Header: logo Zeger, nama branch, alamat
  - Body: transaction number, date-time, list items dengan quantity dan harga
  - Footer: subtotal, discount, total, payment method, ucapan terima kasih
  - _Requirements: 6.2, 6.3_

- [x] 7.2 Write property test for receipt content


  - **Property 27: Receipt contains all required information**
  - **Validates: Requirements 6.3**

- [x] 7.3 Implementasi print functionality


  - Integrate dengan browser print API
  - Handle printer tidak tersedia: fallback ke download PDF
  - Print button di TransactionSuccess component
  - _Requirements: 6.1, 6.4, 6.5_

- [x] 8. Implementasi Inventory Management





- [x] 8.1 Buat InventoryList component


  - Table dengan kolom: Produk, Kode, Kategori, Stok, Status
  - Search bar untuk filter produk
  - Color-coded status: hijau (stok aman), kuning (low stock), merah (habis)
  - Filter inventory berdasarkan branch_id kasir
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 8.2 Write property tests for inventory


  - **Property 28: Inventory displays stock quantities**
  - **Property 29: Inventory filtered by branch**
  - **Property 30: Inventory search filters correctly**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 8.3 Implementasi useInventory hook


  - Fetch inventory data dari tabel inventory
  - Filter by branch_id
  - getProductStock function untuk check stok saat add to cart
  - Real-time subscription untuk inventory updates
  - _Requirements: 7.1, 7.2_

- [x] 8.4 Implementasi low stock dan out of stock indicators


  - Display warning jika stock_quantity < min_stock_level
  - Display "Habis" status jika stock_quantity = 0
  - Prevent add to cart untuk produk dengan stok 0
  - _Requirements: 7.4, 7.5_

- [x] 8.5 Write property tests for stock indicators


  - **Property 31: Low stock warning displayed**
  - **Property 32: Out of stock products not addable**
  - **Property 45: Stock quantity never negative**
  - **Validates: Requirements 7.4, 7.5, 11.5**

- [x] 9. Implementasi Attendance System




- [x] 9.1 Buat AttendanceCard component


  - Display status absensi hari ini
  - Check In button (jika belum check-in)
  - Check Out button (jika sudah check-in tapi belum check-out)
  - Display waktu check-in dan check-out
  - History absensi minggu ini
  - _Requirements: 8.1, 8.2, 8.5_


- [x] 9.2 Implementasi useAttendance hook

  - Fetch today's attendance record
  - checkIn function: create attendance record dengan check_in_time = now()
  - checkOut function: update attendance record dengan check_out_time = now()
  - Capture geolocation untuk check_in_location dan check_out_location
  - Handle geolocation permission denied
  - _Requirements: 8.3, 8.4, 8.6, 8.7_

- [x] 9.3 Write property tests for attendance


  - **Property 33: Attendance status displayed**
  - **Property 34: Check-in creates attendance record**
  - **Property 35: Check-in captures location**
  - **Property 36: Check-out updates attendance record**
  - **Property 37: Check-out updates location and status**
  - **Validates: Requirements 8.1, 8.3, 8.4, 8.6, 8.7**

- [x] 10. Implementasi Transaction History





- [x] 10.1 Buat TransactionHistory component


  - Table dengan list transaksi
  - Filter by branch_id kasir
  - Date range picker untuk filter tanggal
  - Search by transaction number
  - Click row untuk view detail
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 10.2 Write property tests for transaction history


  - **Property 38: Transaction history filtered by branch**
  - **Property 39: Date filter works correctly**
  - **Validates: Requirements 9.2, 9.3**

- [x] 10.3 Buat TransactionDetail component


  - Modal atau page dengan detail lengkap transaksi
  - Display transaction info dan payment method
  - List all transaction_items dengan quantity dan harga
  - Void button (jika transaksi belum di-void)
  - Reprint receipt button
  - _Requirements: 9.4_

- [x] 10.4 Write property test for transaction detail


  - **Property 40: Transaction detail includes all items**
  - **Validates: Requirements 9.4**

- [x] 10.5 Implementasi void transaction functionality

  - Void button membuat record di transaction_void_requests
  - Set status = 'pending' untuk approval
  - Display notifikasi bahwa request menunggu approval
  - _Requirements: 9.5, 9.6_

- [x] 10.6 Write property test for void request


  - **Property 41: Void request creation**
  - **Validates: Requirements 9.5**

- [x] 11. Implementasi UI/UX enhancements





- [x] 11.1 Implementasi loading states


  - Loading spinner untuk semua async operations
  - Skeleton loaders untuk data fetching
  - Disable buttons saat processing
  - _Requirements: 10.5_

- [x] 11.2 Write property test for loading indicators


  - **Property 42: Loading indicator displayed**
  - **Validates: Requirements 10.5**

- [x] 11.3 Implementasi error handling dan notifications


  - Toast notifications untuk success dan error messages
  - Error messages dalam bahasa Indonesia
  - Error boundaries untuk catch React errors
  - Specific error messages untuk setiap error type
  - _Requirements: 10.6, 10.7_

- [x] 11.4 Write property tests for notifications


  - **Property 43: Error messages displayed in Indonesian**
  - **Property 44: Success notifications displayed**
  - **Validates: Requirements 10.6, 10.7**

- [x] 11.5 Implementasi responsive design


  - Test dan adjust layout untuk desktop, tablet, mobile
  - Mobile-first approach dengan Tailwind breakpoints
  - Touch-friendly buttons dan controls untuk mobile
  - _Requirements: 10.3_

- [x] 12. Implementasi Offline Capability (Optional)




- [x] 12.1 Setup offline detection


  - Detect network status dengan navigator.onLine
  - Display offline status notification
  - _Requirements: 12.1_

- [x] 12.2 Write property test for offline detection


  - **Property 46: Offline status notification**
  - **Validates: Requirements 12.1**

- [x] 12.3 Implementasi local storage untuk offline transactions


  - Save transactions to local storage saat offline
  - Queue system untuk pending transactions
  - _Requirements: 12.2_

- [x] 12.4 Write property test for offline storage


  - **Property 47: Offline transactions stored locally**
  - **Validates: Requirements 12.2**

- [x] 12.5 Implementasi sync mechanism


  - Detect network reconnection
  - Sync all pending transactions dari local storage ke database
  - Clear local storage setelah successful sync
  - Retry dengan exponential backoff jika sync gagal
  - _Requirements: 12.3, 12.4, 12.5_

- [x] 12.6 Write property tests for sync


  - **Property 48: Sync on reconnection**
  - **Property 49: Local storage cleared after sync**
  - **Property 50: Failed sync retries with backoff**
  - **Validates: Requirements 12.3, 12.4, 12.5**

- [x] 13. Testing dan Quality Assurance





- [x] 13.1 Write unit tests untuk utility functions


  - Test calculation functions (totals, change, discounts)
  - Test date formatting functions
  - Test transaction number generation
  - Test validation functions

- [x] 13.2 Write integration tests


  - Test complete transaction flow dari cart ke database
  - Test authentication flow end-to-end
  - Test inventory updates dengan concurrent operations
  - Test attendance flow dengan geolocation

- [x] 13.3 Manual testing checklist


  - Test visual design compliance (red color scheme)
  - Test responsive behavior di berbagai screen sizes
  - Test print output di thermal printer (jika tersedia)
  - Test geolocation accuracy untuk attendance
  - Test real-time updates dengan multiple users
  - Test offline mode dan sync behavior

- [x] 14. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Documentation dan Deployment
- [ ] 15.1 Buat user documentation
  - Panduan penggunaan aplikasi POS dalam bahasa Indonesia
  - Screenshot untuk setiap fitur utama
  - FAQ untuk troubleshooting umum

- [x] 15.2 Setup deployment configuration


  - Configure environment variables untuk production
  - Setup build script dengan optimizations
  - Configure Vercel/Netlify deployment
  - Setup custom domain (pos.zeger.id)
 
- [ ] 15.3 Setup monitoring dan error tracking
  - Integrate Sentry untuk error tracking
  - Setup Google Analytics atau Plausible
  - Configure uptime monitoring
  - Setup performance monitoring dengan Web Vitals

- [ ] 16. Final Checkpoint - Production readiness
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all features working in production environment
  - Verify performance targets met
  - Verify security measures in place
