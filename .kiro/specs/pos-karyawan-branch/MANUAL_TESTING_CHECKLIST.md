# Manual Testing Checklist - Aplikasi POS Karyawan Branch

## Overview
Checklist ini digunakan untuk memastikan semua fitur aplikasi POS berfungsi dengan baik sebelum deployment ke production.

---

## 1. Visual Design Compliance (Red Color Scheme)

### Primary Color (#DC2626)
- [ ] Header menggunakan warna merah dominan
- [ ] Tombol primary menggunakan warna merah
- [ ] Logo Zeger ditampilkan dengan benar
- [ ] Hover states menggunakan variasi warna merah yang lebih gelap
- [ ] Active states terlihat jelas dengan warna merah
- [ ] Focus indicators menggunakan warna merah

### Typography & Spacing
- [ ] Font mudah dibaca di semua ukuran
- [ ] Spacing konsisten antar elemen
- [ ] Hierarchy visual jelas (heading, body text, captions)

### UI Components
- [ ] Cards memiliki shadow dan border yang konsisten
- [ ] Buttons memiliki ukuran yang sesuai untuk touch
- [ ] Input fields memiliki border dan focus state yang jelas
- [ ] Icons konsisten dengan design system

---

## 2. Responsive Behavior

### Desktop (≥1024px)
- [ ] Dashboard menampilkan semua stats cards dalam satu baris
- [ ] Product list menampilkan 4-5 kolom grid
- [ ] Cart sidebar terlihat di sebelah kanan
- [ ] Navigation menu terlihat lengkap
- [ ] Modal dialogs terpusat dengan baik

### Tablet (768px - 1023px)
- [ ] Dashboard stats cards menyesuaikan ke 2 kolom
- [ ] Product list menampilkan 3 kolom grid
- [ ] Cart dapat di-toggle atau di-collapse
- [ ] Navigation menu tetap accessible
- [ ] Touch targets cukup besar (min 44x44px)

### Mobile (< 768px)
- [ ] Dashboard stats cards stack vertikal
- [ ] Product list menampilkan 2 kolom grid
- [ ] Cart full-screen atau bottom sheet
- [ ] Navigation menggunakan hamburger menu atau bottom nav
- [ ] Keyboard tidak menghalangi input fields
- [ ] Scroll behavior smooth dan natural

### Orientation Changes
- [ ] Layout menyesuaikan saat rotate device
- [ ] Tidak ada content yang terpotong
- [ ] Modal tetap terpusat

---

## 3. Print Output (Thermal Printer)

### 58mm Printer
- [ ] Receipt width sesuai dengan 58mm
- [ ] Logo Zeger tercetak dengan jelas
- [ ] Text tidak terpotong di kanan/kiri
- [ ] Line breaks berada di posisi yang tepat
- [ ] Barcode/QR code (jika ada) tercetak dengan jelas
- [ ] Footer tercetak lengkap

### 80mm Printer
- [ ] Receipt width sesuai dengan 80mm
- [ ] Layout lebih lebar memanfaatkan space
- [ ] Semua informasi tercetak lengkap
- [ ] Alignment (left, center, right) benar

### Content Verification
- [ ] Transaction number tercetak
- [ ] Date dan time tercetak dengan format yang benar
- [ ] Branch name dan address tercetak
- [ ] Item list lengkap dengan quantity dan harga
- [ ] Subtotal, discount, dan total tercetak
- [ ] Payment method tercetak
- [ ] Change amount tercetak (untuk cash)
- [ ] Footer "Terima Kasih" tercetak

### Print Fallback
- [ ] Jika printer tidak tersedia, muncul opsi download PDF
- [ ] PDF format sesuai dengan thermal receipt
- [ ] PDF dapat dibuka dan dicetak ulang

---

## 4. Geolocation Accuracy (Attendance)

### Permission Handling
- [ ] Browser meminta permission untuk geolocation
- [ ] Jika permission granted, location terdeteksi
- [ ] Jika permission denied, muncul pesan error yang jelas
- [ ] Aplikasi tetap bisa digunakan tanpa geolocation

### Check-In
- [ ] Koordinat latitude dan longitude tersimpan
- [ ] Format koordinat: "lat,lng" (contoh: "-6.2088,106.8456")
- [ ] Timestamp check-in tersimpan dengan benar
- [ ] Status berubah menjadi "checked_in"

### Check-Out
- [ ] Koordinat check-out tersimpan (bisa berbeda dari check-in)
- [ ] Timestamp check-out tersimpan
- [ ] Status berubah menjadi "checked_out"
- [ ] Durasi kerja dapat dihitung dari check-in dan check-out time

### Accuracy Verification
- [ ] Koordinat sesuai dengan lokasi fisik (cek di Google Maps)
- [ ] Accuracy level acceptable (< 50 meters ideal)
- [ ] Tidak ada koordinat (0,0) atau invalid

---

## 5. Real-Time Updates (Multiple Users)

### Setup
- [ ] Buka aplikasi di 2+ browser/device berbeda
- [ ] Login dengan user berbeda di branch yang sama

### Inventory Updates
- [ ] User A melakukan transaksi
- [ ] User B melihat stock berkurang secara real-time
- [ ] Tidak ada delay lebih dari 2-3 detik
- [ ] Stock quantity akurat di semua device

### Transaction History
- [ ] User A membuat transaksi baru
- [ ] User B melihat transaksi baru muncul di history
- [ ] Transaction list ter-update otomatis

### Concurrent Transactions
- [ ] User A dan B melakukan transaksi bersamaan
- [ ] Kedua transaksi berhasil disimpan
- [ ] Stock berkurang sesuai total quantity dari kedua transaksi
- [ ] Tidak ada race condition atau data corruption

### Subscription Cleanup
- [ ] Logout dari satu device
- [ ] Real-time updates berhenti di device tersebut
- [ ] Device lain tetap menerima updates
- [ ] Tidak ada memory leaks

---

## 6. Offline Mode & Sync Behavior

### Offline Detection
- [ ] Disconnect internet (airplane mode atau disable WiFi)
- [ ] Muncul notifikasi "Offline" atau indicator
- [ ] UI tetap responsive
- [ ] Data yang sudah di-load tetap accessible

### Offline Transactions
- [ ] Buat transaksi saat offline
- [ ] Transaksi tersimpan di local storage
- [ ] Muncul indicator "Pending Sync"
- [ ] Cart dapat di-clear setelah transaksi offline

### Reconnection & Sync
- [ ] Reconnect internet
- [ ] Muncul notifikasi "Syncing..."
- [ ] Transaksi offline ter-sync ke database
- [ ] Local storage di-clear setelah sync berhasil
- [ ] Transaction number di-generate dengan benar

### Sync Failures
- [ ] Disconnect internet saat sync
- [ ] Retry mechanism berjalan (exponential backoff)
- [ ] Muncul notifikasi jika sync gagal
- [ ] User dapat trigger manual sync

### Edge Cases
- [ ] Multiple offline transactions sync dengan urutan yang benar
- [ ] Conflict resolution jika ada perubahan data di server
- [ ] Stock validation tetap berjalan saat sync (cegah negative stock)

---

## 7. Authentication & Authorization

### Login
- [ ] Email dan password validation berfungsi
- [ ] Error message jelas untuk kredensial salah
- [ ] Loading state terlihat saat proses login
- [ ] Redirect ke dashboard setelah login sukses

### Role Verification
- [ ] Kasir (bh_kasir, sb_kasir, 2_Hub_Kasir, 3_SB_Kasir) dapat akses
- [ ] Non-kasir ditolak dengan pesan error yang jelas
- [ ] Branch ID ter-load dengan benar untuk kasir

### Session Management
- [ ] Session tersimpan setelah login
- [ ] Refresh page tidak logout user
- [ ] Auto-logout setelah 8 jam inactivity (jika diimplementasikan)
- [ ] Logout button berfungsi dan clear session

---

## 8. Transaction Flow

### Add to Cart
- [ ] Klik produk menambahkan ke cart dengan quantity 1
- [ ] Klik produk yang sama increment quantity
- [ ] Quantity controls (+/-) berfungsi
- [ ] Remove item berfungsi
- [ ] Subtotal dan total ter-update otomatis

### Checkout
- [ ] Checkout button membuka payment dialog
- [ ] Payment methods (Cash, QRIS, Transfer) terlihat
- [ ] Cash: input amount received dan calculate change
- [ ] QRIS: tampilkan QR code
- [ ] Transfer: tampilkan nomor rekening

### Transaction Creation
- [ ] Transaction tersimpan ke database
- [ ] Transaction number format: ZEG-{branch_code}-{YYYYMMDD}-{sequence}
- [ ] Transaction items tersimpan lengkap
- [ ] Stock berkurang sesuai quantity
- [ ] Stock movements ter-record

### Success Screen
- [ ] Muncul success message dengan transaction number
- [ ] Tombol "Cetak Struk" berfungsi
- [ ] Tombol "Transaksi Baru" clear cart dan kembali ke product list

---

## 9. Split Bill

- [ ] Split Bill button muncul di checkout
- [ ] Interface untuk membagi items terlihat jelas
- [ ] Total untuk setiap group ter-calculate dengan benar
- [ ] Sum of group totals = original total
- [ ] Setiap group dapat di-process payment terpisah
- [ ] Multiple transactions ter-create dengan benar
- [ ] Semua transactions marked as completed

---

## 10. Inventory Management

- [ ] Inventory list menampilkan produk dengan stock
- [ ] Filter by branch berfungsi
- [ ] Search by nama atau kode produk berfungsi
- [ ] Low stock indicator (kuning) muncul jika stock < min_stock_level
- [ ] Out of stock indicator (merah) muncul jika stock = 0
- [ ] Produk dengan stock 0 tidak dapat ditambahkan ke cart

---

## 11. Transaction History

- [ ] History list menampilkan transaksi branch
- [ ] Date range filter berfungsi
- [ ] Search by transaction number berfungsi
- [ ] Klik transaksi membuka detail
- [ ] Detail menampilkan semua items dan info pembayaran
- [ ] Void button berfungsi (create void request)
- [ ] Reprint receipt berfungsi

---

## 12. Error Handling

### Network Errors
- [ ] Timeout error menampilkan pesan yang jelas
- [ ] Connection lost error menampilkan pesan yang jelas
- [ ] Retry mechanism berfungsi

### Validation Errors
- [ ] Empty cart tidak bisa checkout
- [ ] Insufficient stock menampilkan error
- [ ] Invalid payment amount menampilkan error

### Database Errors
- [ ] Transaction failure rollback dengan benar
- [ ] Error message dalam bahasa Indonesia
- [ ] User dapat retry operation

---

## 13. Performance

- [ ] Initial page load < 2 seconds
- [ ] Transaction completion < 1 second
- [ ] Search response < 200ms
- [ ] Print generation < 500ms
- [ ] No UI freezing atau lag
- [ ] Smooth scrolling di product list
- [ ] Smooth animations

---

## 14. Accessibility

- [ ] Keyboard navigation berfungsi (Tab, Enter, Esc)
- [ ] Focus indicators terlihat jelas
- [ ] Touch targets min 44x44px
- [ ] Color contrast memenuhi WCAG AA
- [ ] Error messages dapat dibaca screen reader

---

## Sign-Off

**Tester Name:** ___________________________

**Date:** ___________________________

**Environment:** 
- [ ] Development
- [ ] Staging
- [ ] Production

**Browser/Device Tested:**
- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari Desktop
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Tablet

**Overall Status:**
- [ ] All tests passed
- [ ] Some tests failed (see notes below)
- [ ] Blocked (cannot proceed)

**Notes/Issues:**
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
