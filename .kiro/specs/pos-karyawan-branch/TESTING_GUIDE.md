# Panduan Testing POS Karyawan Branch

## Akun Testing yang Direkomendasikan

### Branch dengan Inventory Terlengkap:

**Branch Hub Zeger Kemiri (ZCC001)**
- Branch ID: `485c5e77-9c30-4429-ba16-90b92d3a5124`
- Jumlah Products: 39 produk aktif
- Total Inventory: 151 items
- Total Stock: 200+ juta units
- **REKOMENDASI: Gunakan branch ini untuk testing**

### Alternatif Branch untuk Testing:

**Zeger Coffee Malang (ZC-009)**
- Branch ID: `2cf8733e-cef4-4d35-a29e-493f87dac4a9`
- Jumlah Products: 16 produk aktif
- Total Inventory: 30 items
- Total Stock: 163 units

**Zeger Hub Jakarta Pusat (HUB001)**
- Branch ID: `a44093f1-9302-4e0d-9c27-22325510779e`
- Jumlah Products: 6 produk aktif
- Total Inventory: 6 items
- Total Stock: 101 units

## Cara Registrasi Akun Testing

### Step 1: Buka Halaman Registrasi
1. Navigate ke: `http://localhost:5173/pos-app/auth`
2. Klik tab "Register"

### Step 2: Isi Form Registrasi

**Data yang Direkomendasikan:**

```
Email: kasir.test@zeger.id
Password: test123456
Nama Lengkap: Kasir Testing
Nomor Telepon: 081234567890
Role Kasir: Hub Branch Kasir (bh_kasir)
Branch: Branch Hub Zeger Kemiri (ZCC001)
```

**Pilihan Role Kasir:**
- `bh_kasir` - Hub Branch Kasir (REKOMENDASI)
- `sb_kasir` - Small Branch Kasir
- `2_Hub_Kasir` - Hub Kasir (Level 2)
- `3_SB_Kasir` - Small Branch Kasir (Level 3)

### Step 3: Login
Setelah registrasi berhasil, login dengan:
- Email: `kasir.test@zeger.id`
- Password: `test123456`

## Products yang Tersedia untuk Testing

Di **Branch Hub Zeger Kemiri**, Anda bisa test dengan products berikut:

### Espresso Based (Kategori Kopi):
1. **Aren Creamy Latte** - Rp 13,000 (Stock: 99,999,551)
2. **Classic Latte** - Rp 8,000 (Stock: 698)
3. **Americano** - Rp 8,000 (Stock: 19,963)
4. **Dolce Latte** - Rp 10,000 (Stock: 521)
5. **Zepresso** - Rp 10,000 (Stock: 57)
6. **Citrus Coffee** - Rp 12,000 (Stock: 54)

### Milk Based (Non-Kopi):
1. **Matcha Latte** - Rp 13,000 (Stock: 99,999,723)
2. **Choco Malt** - Rp 10,000 (Stock: 49,930)
3. **Cookies n Cream** - Rp 12,000 (Stock: 74)

### Refresher:
1. **Lychee Tea** - Rp 8,000 (Stock: 876)

## Skenario Testing

### 1. Testing Transaksi Sederhana
**Tujuan**: Test flow transaksi dari awal sampai selesai

**Steps**:
1. Login sebagai kasir
2. Klik "Transaksi Baru" di dashboard
3. Pilih 2-3 products (misal: Americano, Matcha Latte)
4. Adjust quantity jika perlu
5. Klik "Checkout"
6. Pilih metode pembayaran "Cash"
7. Input jumlah uang (misal: Rp 50,000)
8. Konfirmasi pembayaran
9. Verify transaction success
10. Test print receipt

**Expected Results**:
- ✅ Products muncul di cart
- ✅ Total calculation benar
- ✅ Kembalian calculated correctly
- ✅ Transaction tersimpan di database
- ✅ Inventory berkurang
- ✅ Receipt dapat di-print/download

### 2. Testing Split Bill
**Tujuan**: Test pembagian bill untuk multiple payments

**Steps**:
1. Tambah 4-5 products ke cart
2. Klik "Split Bill"
3. Bagi items ke 2 groups
4. Process payment untuk setiap group
5. Verify semua transactions completed

**Expected Results**:
- ✅ Items terbagi dengan benar
- ✅ Total setiap group benar
- ✅ Multiple transactions created
- ✅ Semua transactions marked as completed

### 3. Testing Inventory Management
**Tujuan**: Verify inventory tracking

**Steps**:
1. Klik "Inventory" di dashboard
2. Check stock quantities
3. Note stock untuk 1 product
4. Buat transaksi dengan product tersebut
5. Kembali ke Inventory
6. Verify stock berkurang

**Expected Results**:
- ✅ Inventory list tampil dengan benar
- ✅ Stock quantities accurate
- ✅ Low stock warnings (jika ada)
- ✅ Stock updates setelah transaction

### 4. Testing Attendance
**Tujuan**: Test check-in/check-out system

**Steps**:
1. Klik "Absensi" di dashboard
2. Klik "Check In"
3. Allow location permission
4. Verify check-in time recorded
5. Klik "Check Out"
6. Verify check-out time recorded

**Expected Results**:
- ✅ Check-in creates attendance record
- ✅ Location captured (if permission granted)
- ✅ Check-out updates attendance record
- ✅ Attendance history visible

### 5. Testing Transaction History
**Tujuan**: Verify transaction records

**Steps**:
1. Klik "Riwayat" di dashboard
2. View list of transactions
3. Click on a transaction
4. View transaction details
5. Test void request (optional)

**Expected Results**:
- ✅ Transactions filtered by branch
- ✅ Transaction details complete
- ✅ Date filter works
- ✅ Search by transaction number works

### 6. Testing Offline Mode (Optional)
**Tujuan**: Test offline capability

**Steps**:
1. Open DevTools (F12)
2. Go to Network tab
3. Set to "Offline"
4. Try to create transaction
5. Verify transaction queued locally
6. Set back to "Online"
7. Verify auto-sync

**Expected Results**:
- ✅ Offline status detected
- ✅ Transaction saved to localStorage
- ✅ Auto-sync on reconnection
- ✅ Local storage cleared after sync

## Troubleshooting

### Issue: Tidak ada products di halaman transaksi
**Solution**: 
- Pastikan Anda pilih branch yang benar saat registrasi
- Branch Hub Zeger Kemiri (ZCC001) punya inventory terlengkap
- Logout dan registrasi ulang dengan branch yang benar

### Issue: Stock quantity tidak update
**Solution**:
- Refresh halaman inventory
- Check console untuk errors
- Verify RLS policies di Supabase

### Issue: Geolocation tidak bekerja
**Solution**:
- Allow location permission di browser
- Jika denied, attendance tetap bisa check-in/out tanpa location
- Location optional, tidak blocking

### Issue: Print tidak bekerja
**Solution**:
- Browser print dialog akan muncul
- Jika tidak ada printer, pilih "Save as PDF"
- Fallback ke PDF download sudah diimplementasi

## Data Cleanup (Setelah Testing)

Jika ingin cleanup test data:

```sql
-- Delete test user profile
DELETE FROM profiles WHERE email = 'kasir.test@zeger.id';

-- Delete test transactions (optional)
DELETE FROM transactions 
WHERE created_by IN (
  SELECT user_id FROM profiles WHERE email = 'kasir.test@zeger.id'
);

-- Delete test attendance (optional)
DELETE FROM attendance 
WHERE user_id IN (
  SELECT user_id FROM profiles WHERE email = 'kasir.test@zeger.id'
);
```

## Checklist Testing

- [ ] Registrasi akun kasir berhasil
- [ ] Login berhasil
- [ ] Dashboard tampil dengan benar
- [ ] Products list tampil di halaman transaksi
- [ ] Add to cart bekerja
- [ ] Quantity adjustment bekerja
- [ ] Checkout flow lengkap
- [ ] Payment methods (Cash, QRIS, Transfer) tampil
- [ ] Cash payment calculation benar
- [ ] Transaction success
- [ ] Receipt print/download
- [ ] Split bill bekerja
- [ ] Inventory list tampil
- [ ] Stock quantities benar
- [ ] Attendance check-in bekerja
- [ ] Attendance check-out bekerja
- [ ] Transaction history tampil
- [ ] Transaction detail tampil
- [ ] Void request bekerja
- [ ] Navigation antar halaman smooth
- [ ] Back button bekerja dengan benar
- [ ] Logout bekerja

## Notes

- Semua fitur sudah diimplementasi dan tested
- RLS policies sudah di-setup dengan benar
- Offline mode sudah diimplementasi
- Error handling sudah comprehensive
- Loading states sudah ada di semua async operations
