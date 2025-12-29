# 🔄 Zeger Rider - Offline Sync Guide

## 📋 Overview

Aplikasi Zeger Rider dilengkapi dengan sistem **Offline Synchronization** yang canggih, memungkinkan rider tetap bekerja produktif meskipun dalam kondisi jaringan yang tidak stabil atau offline sepenuhnya.

## ✨ Fitur Utama

### 🔌 Deteksi Status Koneksi
- **Real-time monitoring** status jaringan (WiFi, Cellular, Offline)
- **Visual indicator** di status bar aplikasi
- **Automatic switching** antara mode online dan offline

### 💾 Penyimpanan Data Offline
Semua aktivitas penting tersimpan secara lokal saat offline:

#### 🛒 Transaksi Penjualan
- Data transaksi lengkap (items, customer, payment method)
- Nomor transaksi otomatis
- Lokasi GPS saat transaksi
- Catatan tambahan

#### 📍 Location Tracking
- Koordinat GPS rider
- Timestamp akurat
- Akurasi lokasi
- Batch optimization (hanya lokasi terbaru per rider)

#### 📋 Attendance & Checkpoints
- Check-in/check-out shift
- Checkpoint recording
- Photo attachments
- Timestamp dan lokasi

#### 📦 Stock Management
- Penerimaan stok
- Return stok
- Stock movements
- Inventory adjustments

### 🔄 Sinkronisasi Otomatis

#### Auto-Sync Triggers
1. **Network Recovery** - Saat koneksi kembali tersedia
2. **Manual Sync** - Tombol sync manual di status bar
3. **Background Sync** - Service worker background sync
4. **Periodic Sync** - Sinkronisasi berkala

#### Retry Logic
- **Exponential Backoff** - Delay bertambah untuk retry
- **Max Retry Count** - Maksimal 3x retry per item
- **Error Tracking** - Log error untuk debugging
- **Manual Retry** - Retry manual untuk item yang gagal

## 🎯 Cara Kerja

### 1. Mode Online (Normal)
```
User Action → Direct API Call → Supabase → Success Response
```

### 2. Mode Offline
```
User Action → Local Storage → Queue for Sync → Success Response (Local)
```

### 3. Sync Process
```
Network Available → Process Queue → Batch Upload → Clear Synced Data
```

## 📱 User Interface

### Status Bar Offline Sync
Menampilkan informasi real-time:
- **🟢 Online**: "Tersinkron" 
- **🟡 Pending**: "5 menunggu sinkron"
- **🔴 Offline**: "Offline • 3 pending"
- **🔄 Syncing**: "Sinkronisasi..."
- **⚠️ Failed**: "2 gagal sinkron"

### Sync Actions
- **Sync Button** - Manual sync saat ada pending data
- **Retry Button** - Retry untuk data yang gagal
- **Last Sync Time** - Waktu sinkronisasi terakhir
- **Error Details** - Detail error untuk troubleshooting

## 🛠 Technical Implementation

### Data Storage
- **AsyncStorage** - React Native local storage
- **IndexedDB** - Web browser storage (PWA)
- **Zustand Store** - In-memory state management

### Network Detection
- **@react-native-community/netinfo** - Network status monitoring
- **Real-time listeners** - Automatic status updates
- **Connection quality** - WiFi vs Cellular detection

### Sync Architecture
```typescript
interface OfflineData {
  id: string;
  type: 'transaction' | 'location' | 'checkpoint' | 'attendance' | 'stock_movement';
  data: any;
  createdAt: string;
  synced: boolean;
  retryCount: number;
  lastError?: string;
}
```

### Batch Processing
- **Batch Size**: 10 items per batch
- **Parallel Processing**: Multiple data types sync simultaneously
- **Priority Queue**: Transactions > Locations > Others

## 🔧 Configuration

### Retry Settings
```typescript
const MAX_RETRY_COUNT = 3;
const BATCH_SIZE = 10;
const SYNC_DELAY = 2000; // 2 seconds after network recovery
```

### Storage Limits
- **Transactions**: Unlimited (until synced)
- **Locations**: 100 latest per rider
- **Checkpoints**: Unlimited (until synced)
- **Stock Movements**: Unlimited (until synced)

## 🚨 Error Handling

### Common Scenarios
1. **Network Timeout** - Retry dengan delay
2. **Server Error (5xx)** - Retry dengan exponential backoff
3. **Authentication Error** - Redirect to login
4. **Data Conflict** - Last-write-wins strategy
5. **Storage Full** - Clear old synced data

### Error Recovery
- **Automatic Retry** - 3x dengan increasing delay
- **Manual Retry** - User dapat retry manual
- **Error Logging** - Log untuk debugging
- **Graceful Degradation** - App tetap berfungsi

## 📊 Monitoring & Analytics

### Sync Metrics
- **Pending Count** - Jumlah data menunggu sync
- **Failed Count** - Jumlah data gagal sync
- **Last Sync Time** - Waktu sync terakhir
- **Sync Duration** - Durasi proses sync
- **Error Rate** - Persentase error sync

### Performance Optimization
- **Debounced Sync** - Hindari sync berlebihan
- **Batch Optimization** - Grup data untuk efisiensi
- **Memory Management** - Clear data yang sudah sync
- **Background Processing** - Sync tidak mengganggu UI

## 🎯 Best Practices

### Untuk Rider
1. **Tetap Bekerja** - Aplikasi berfungsi normal saat offline
2. **Monitor Status** - Perhatikan status bar sync
3. **Manual Sync** - Gunakan tombol sync saat perlu
4. **Retry Failed** - Retry data yang gagal sync

### Untuk Developer
1. **Error Handling** - Selalu handle network errors
2. **User Feedback** - Berikan feedback yang jelas
3. **Data Validation** - Validasi data sebelum sync
4. **Testing** - Test scenario offline/online

## 🔍 Troubleshooting

### Masalah Umum

#### Data Tidak Tersync
1. Cek koneksi internet
2. Cek status sync di status bar
3. Coba manual sync
4. Restart aplikasi jika perlu

#### Sync Lambat
1. Cek kualitas koneksi
2. Tunggu hingga batch selesai
3. Hindari aktivitas berat saat sync

#### Data Hilang
1. Data tersimpan lokal sampai tersync
2. Jangan clear app data saat ada pending sync
3. Backup data penting

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('ZEGER_DEBUG_SYNC', 'true');
```

## 📈 Future Enhancements

### Planned Features
- **Conflict Resolution UI** - Interface untuk resolve conflicts
- **Selective Sync** - Pilih data mana yang di-sync
- **Compression** - Kompres data untuk efisiensi
- **Delta Sync** - Sync hanya perubahan data
- **Offline Analytics** - Analytics saat offline

### Performance Improvements
- **Smart Batching** - Batch size dinamis
- **Priority Sync** - Prioritas berdasarkan importance
- **Background Sync** - Sync di background thread
- **Incremental Sync** - Sync incremental untuk data besar

---

## 📞 Support

Untuk pertanyaan atau masalah terkait offline sync:
1. Cek dokumentasi ini
2. Lihat error logs di developer console
3. Contact support team dengan detail error

**Happy Syncing! 🚀**