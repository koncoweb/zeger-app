# Requirements Document - Aplikasi POS Karyawan Branch

## Introduction

Aplikasi POS (Point of Sale) untuk karyawan branch Zeger adalah sistem kasir modern berbasis web yang dirancang khusus untuk operasional branch Hub dan Small Branch. Aplikasi ini memungkinkan kasir untuk melakukan transaksi penjualan, mengelola inventory, mencetak bill, dan melakukan absensi dengan antarmuka yang modern, sleek, dan dominan warna merah sesuai branding Zeger. Aplikasi ini terintegrasi penuh dengan sistem dashboard manajemen yang sudah ada dan menggunakan database Supabase yang sama.

## Glossary

- **POS System**: Sistem Point of Sale untuk mencatat transaksi penjualan
- **Branch**: Cabang Zeger yang terdiri dari Hub Branch dan Small Branch
- **Hub Branch**: Cabang besar dengan stok lengkap dan kasir tetap
- **Small Branch**: Cabang kecil yang dikelola oleh rider
- **Kasir**: Karyawan yang bertugas melayani transaksi di branch (role: bh_kasir atau sb_kasir)
- **Transaction**: Transaksi penjualan yang tercatat dalam sistem
- **Transaction Item**: Item produk dalam satu transaksi
- **Inventory**: Stok produk yang tersedia di branch atau rider
- **Split Bill**: Fitur untuk membagi tagihan menjadi beberapa pembayaran
- **Absensi**: Sistem pencatatan kehadiran karyawan dengan check-in dan check-out
- **Menu**: Daftar produk yang tersedia untuk dijual
- **HPP**: Harga Pokok Penjualan (cost price)
- **Printer**: Perangkat untuk mencetak struk/bill transaksi

## Requirements

### Requirement 1: Autentikasi dan Otorisasi

**User Story:** Sebagai kasir branch, saya ingin login ke sistem POS dengan kredensial saya, sehingga saya dapat mengakses fitur POS sesuai dengan role dan branch saya.

#### Acceptance Criteria

1. WHEN kasir membuka aplikasi POS THEN sistem SHALL menampilkan halaman login dengan field email dan password
2. WHEN kasir memasukkan kredensial valid dan menekan tombol login THEN sistem SHALL memverifikasi kredensial melalui Supabase Auth
3. WHEN autentikasi berhasil THEN sistem SHALL memeriksa role user dari tabel profiles
4. IF role user adalah bh_kasir atau sb_kasir THEN sistem SHALL memberikan akses ke aplikasi POS
5. IF role user bukan kasir THEN sistem SHALL menolak akses dan menampilkan pesan error
6. WHEN kasir berhasil login THEN sistem SHALL menyimpan session dan menampilkan dashboard POS
7. WHEN kasir menekan tombol logout THEN sistem SHALL menghapus session dan kembali ke halaman login

### Requirement 2: Dashboard POS

**User Story:** Sebagai kasir, saya ingin melihat dashboard POS yang informatif, sehingga saya dapat memantau aktivitas penjualan dan mengakses fitur-fitur utama dengan mudah.

#### Acceptance Criteria

1. WHEN kasir login THEN sistem SHALL menampilkan dashboard dengan desain modern dominan warna merah
2. WHEN dashboard ditampilkan THEN sistem SHALL menampilkan informasi branch kasir dari tabel branches
3. WHEN dashboard ditampilkan THEN sistem SHALL menampilkan ringkasan penjualan hari ini (total transaksi, total penjualan, jumlah item terjual)
4. WHEN dashboard ditampilkan THEN sistem SHALL menampilkan menu navigasi dengan akses ke: Transaksi Baru, Riwayat Transaksi, Inventory, dan Absensi
5. WHEN kasir mengklik menu navigasi THEN sistem SHALL menampilkan halaman yang sesuai

### Requirement 3: Transaksi Penjualan

**User Story:** Sebagai kasir, saya ingin membuat transaksi penjualan dengan mudah dan cepat, sehingga pelanggan dapat dilayani dengan efisien.

#### Acceptance Criteria

1. WHEN kasir membuka halaman transaksi baru THEN sistem SHALL menampilkan daftar produk dari tabel products yang is_active = true
2. WHEN kasir mencari produk menggunakan search bar THEN sistem SHALL memfilter produk berdasarkan nama atau kode produk
3. WHEN kasir mengklik produk THEN sistem SHALL menambahkan produk ke keranjang dengan quantity 1
4. WHEN produk sudah ada di keranjang dan kasir mengklik produk yang sama THEN sistem SHALL menambah quantity produk tersebut
5. WHEN kasir mengubah quantity produk di keranjang THEN sistem SHALL memperbarui total harga item
6. WHEN kasir menghapus item dari keranjang THEN sistem SHALL menghapus item dan memperbarui total transaksi
7. WHEN keranjang berisi item THEN sistem SHALL menampilkan subtotal, diskon (jika ada), dan total akhir
8. WHEN kasir menekan tombol checkout THEN sistem SHALL menampilkan dialog konfirmasi dengan pilihan metode pembayaran

### Requirement 4: Proses Checkout dan Pembayaran

**User Story:** Sebagai kasir, saya ingin memproses pembayaran transaksi dengan berbagai metode, sehingga pelanggan memiliki fleksibilitas dalam pembayaran.

#### Acceptance Criteria

1. WHEN kasir menekan checkout THEN sistem SHALL menampilkan dialog dengan metode pembayaran: Cash, QRIS, Transfer Bank
2. WHEN kasir memilih metode pembayaran Cash THEN sistem SHALL menampilkan field input jumlah uang yang diterima
3. WHEN kasir memasukkan jumlah uang yang diterima THEN sistem SHALL menghitung dan menampilkan kembalian
4. WHEN kasir mengkonfirmasi pembayaran THEN sistem SHALL membuat record di tabel transactions dengan status completed
5. WHEN transaksi berhasil disimpan THEN sistem SHALL membuat record di tabel transaction_items untuk setiap item
6. WHEN transaksi berhasil disimpan THEN sistem SHALL mengurangi stock_quantity di tabel inventory untuk setiap produk
7. WHEN transaksi berhasil disimpan THEN sistem SHALL membuat record di tabel stock_movements dengan movement_type = out
8. WHEN transaksi berhasil disimpan THEN sistem SHALL generate transaction_number dengan format: ZEG-{branch_code}-{YYYYMMDD}-{sequence}
9. WHEN transaksi selesai THEN sistem SHALL menampilkan halaman sukses dengan opsi cetak struk atau transaksi baru

### Requirement 5: Split Bill

**User Story:** Sebagai kasir, saya ingin membagi tagihan menjadi beberapa pembayaran, sehingga pelanggan dapat membayar secara terpisah.

#### Acceptance Criteria

1. WHEN kasir menekan tombol Split Bill di halaman checkout THEN sistem SHALL menampilkan interface untuk membagi item
2. WHEN kasir memilih item untuk split THEN sistem SHALL membuat dua atau lebih grup pembayaran
3. WHEN kasir mengkonfirmasi split THEN sistem SHALL menampilkan total untuk setiap grup pembayaran
4. WHEN kasir memproses pembayaran untuk setiap grup THEN sistem SHALL membuat transaksi terpisah untuk setiap grup
5. WHEN semua grup telah dibayar THEN sistem SHALL menandai semua transaksi sebagai completed

### Requirement 6: Pencetakan Bill/Struk

**User Story:** Sebagai kasir, saya ingin mencetak struk transaksi, sehingga pelanggan memiliki bukti pembelian.

#### Acceptance Criteria

1. WHEN transaksi selesai THEN sistem SHALL menyediakan tombol Cetak Struk
2. WHEN kasir menekan tombol Cetak Struk THEN sistem SHALL membuka dialog print dengan format struk thermal 58mm atau 80mm
3. WHEN struk ditampilkan THEN sistem SHALL menampilkan: logo Zeger, nama branch, alamat, nomor transaksi, tanggal-waktu, daftar item, subtotal, diskon, total, metode pembayaran, dan footer terima kasih
4. WHEN kasir mengkonfirmasi print THEN sistem SHALL mengirim perintah print ke printer yang terhubung
5. IF printer tidak tersedia THEN sistem SHALL menampilkan pesan error dan menyediakan opsi download PDF

### Requirement 7: Manajemen Inventory

**User Story:** Sebagai kasir, saya ingin melihat stok produk yang tersedia, sehingga saya dapat menginformasikan ketersediaan kepada pelanggan.

#### Acceptance Criteria

1. WHEN kasir membuka halaman Inventory THEN sistem SHALL menampilkan daftar produk dengan stock_quantity dari tabel inventory
2. WHEN inventory ditampilkan THEN sistem SHALL memfilter inventory berdasarkan branch_id kasir
3. WHEN kasir mencari produk THEN sistem SHALL memfilter inventory berdasarkan nama atau kode produk
4. WHEN stock_quantity produk kurang dari min_stock_level THEN sistem SHALL menampilkan indikator warning warna merah
5. WHEN stock_quantity produk = 0 THEN sistem SHALL menampilkan status "Habis" dan produk tidak dapat ditambahkan ke transaksi

### Requirement 8: Absensi Karyawan

**User Story:** Sebagai kasir, saya ingin melakukan check-in dan check-out, sehingga kehadiran saya tercatat dalam sistem.

#### Acceptance Criteria

1. WHEN kasir membuka halaman Absensi THEN sistem SHALL menampilkan status absensi hari ini dari tabel attendance
2. IF kasir belum check-in hari ini THEN sistem SHALL menampilkan tombol Check In
3. WHEN kasir menekan tombol Check In THEN sistem SHALL membuat record di tabel attendance dengan check_in_time = now()
4. WHEN check-in berhasil THEN sistem SHALL menyimpan check_in_location dari browser geolocation API
5. IF kasir sudah check-in dan belum check-out THEN sistem SHALL menampilkan tombol Check Out
6. WHEN kasir menekan tombol Check Out THEN sistem SHALL update record attendance dengan check_out_time = now()
7. WHEN check-out berhasil THEN sistem SHALL menyimpan check_out_location dan mengubah status menjadi checked_out

### Requirement 9: Riwayat Transaksi

**User Story:** Sebagai kasir, saya ingin melihat riwayat transaksi yang telah saya buat, sehingga saya dapat melacak penjualan dan melakukan void jika diperlukan.

#### Acceptance Criteria

1. WHEN kasir membuka halaman Riwayat Transaksi THEN sistem SHALL menampilkan daftar transaksi dari tabel transactions
2. WHEN riwayat ditampilkan THEN sistem SHALL memfilter transaksi berdasarkan branch_id kasir
3. WHEN kasir memilih filter tanggal THEN sistem SHALL menampilkan transaksi sesuai rentang tanggal yang dipilih
4. WHEN kasir mengklik transaksi THEN sistem SHALL menampilkan detail transaksi termasuk items dari tabel transaction_items
5. WHEN kasir menekan tombol Void pada transaksi THEN sistem SHALL membuat record di tabel transaction_void_requests dengan status pending
6. WHEN void request dibuat THEN sistem SHALL menampilkan notifikasi bahwa request menunggu approval dari manager

### Requirement 10: Desain dan User Experience

**User Story:** Sebagai kasir, saya ingin menggunakan aplikasi dengan antarmuka yang modern dan mudah digunakan, sehingga saya dapat bekerja dengan efisien dan nyaman.

#### Acceptance Criteria

1. WHEN aplikasi ditampilkan THEN sistem SHALL menggunakan skema warna dominan merah (#DC2626 atau sejenisnya) sesuai branding Zeger
2. WHEN aplikasi ditampilkan THEN sistem SHALL menggunakan font modern dan mudah dibaca
3. WHEN aplikasi ditampilkan THEN sistem SHALL responsive dan dapat digunakan di desktop, tablet, dan mobile
4. WHEN kasir berinteraksi dengan tombol atau elemen UI THEN sistem SHALL memberikan feedback visual (hover, active state)
5. WHEN proses loading terjadi THEN sistem SHALL menampilkan loading indicator
6. WHEN error terjadi THEN sistem SHALL menampilkan pesan error yang jelas dan informatif dalam bahasa Indonesia
7. WHEN operasi berhasil THEN sistem SHALL menampilkan notifikasi sukses dengan toast atau alert

### Requirement 11: Integrasi dengan Database Existing

**User Story:** Sebagai sistem, saya harus terintegrasi dengan database Supabase yang sudah ada, sehingga data konsisten dengan aplikasi dashboard manajemen.

#### Acceptance Criteria

1. WHEN sistem melakukan operasi database THEN sistem SHALL menggunakan Supabase client yang sudah dikonfigurasi
2. WHEN sistem membaca data user THEN sistem SHALL menggunakan tabel profiles dengan kolom role, branch_id, dan is_active
3. WHEN sistem membuat transaksi THEN sistem SHALL menggunakan tabel transactions dengan semua kolom yang diperlukan
4. WHEN sistem menyimpan item transaksi THEN sistem SHALL menggunakan tabel transaction_items
5. WHEN sistem update inventory THEN sistem SHALL menggunakan tabel inventory dengan constraint stock_quantity >= 0
6. WHEN sistem mencatat stock movement THEN sistem SHALL menggunakan tabel stock_movements
7. WHEN sistem mencatat absensi THEN sistem SHALL menggunakan tabel attendance
8. WHEN sistem membaca produk THEN sistem SHALL menggunakan tabel products dengan filter is_active = true

### Requirement 12: Offline Capability (Optional)

**User Story:** Sebagai kasir, saya ingin aplikasi tetap dapat digunakan saat koneksi internet terputus, sehingga operasional tidak terganggu.

#### Acceptance Criteria

1. WHEN koneksi internet terputus THEN sistem SHALL menampilkan notifikasi status offline
2. WHEN sistem offline THEN sistem SHALL menyimpan transaksi baru ke local storage
3. WHEN koneksi internet kembali THEN sistem SHALL melakukan sync transaksi dari local storage ke database
4. WHEN sync berhasil THEN sistem SHALL menghapus data dari local storage
5. IF sync gagal THEN sistem SHALL retry dengan exponential backoff
