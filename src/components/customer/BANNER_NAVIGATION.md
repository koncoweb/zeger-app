# Banner Navigation Implementation

## Overview
Implementasi fitur klik banner yang mengarahkan customer ke halaman tertentu dalam aplikasi customer.

## Features Implemented

### 1. Banner Click Navigation
- Banner dengan `link_url` dapat diklik untuk navigasi
- Menampilkan indikator visual (dot berkedip) untuk banner yang dapat diklik
- Hover effect untuk memberikan feedback visual

### 2. Supported Navigation Targets
Banner dapat mengarahkan ke halaman berikut:
- `menu` - Halaman menu produk
- `vouchers` - Halaman voucher customer
- `loyalty` - Halaman program loyalty
- `outlets` - Halaman pilih outlet
- `promo-reward` - Halaman promo & reward
- `orders` - Halaman pesanan
- `profile` - Halaman profil customer
- `map` - Halaman peta untuk delivery

### 3. Database Structure
Tabel `promo_banners` dengan field:
- `link_url` (string|null) - Target navigasi
- `is_active` (boolean) - Status aktif banner
- `display_order` (integer) - Urutan tampil
- `valid_from` & `valid_until` - Periode aktif

## Implementation Details

### Components Modified
1. **PromoBannerCarousel.tsx**
   - Added `onNavigate` prop
   - Added `handleBannerClick` function
   - Added click indicator for interactive banners
   - Added hover effects

2. **CustomerHome.tsx**
   - Pass `onNavigate` prop to PromoBannerCarousel

### Code Example
```typescript
// Banner click handler
const handleBannerClick = (banner) => {
  if (!banner.link_url || !onNavigate) return;
  
  const validViews = ['menu', 'vouchers', 'loyalty', 'outlets', 'promo-reward'];
  
  if (validViews.includes(banner.link_url)) {
    onNavigate(banner.link_url);
  }
};
```

### Visual Indicators
- **Click Indicator**: White pulsing dot di pojok kanan atas banner
- **Hover Effect**: Opacity 90% saat hover
- **Cursor**: Pointer cursor untuk banner yang dapat diklik

## Testing Data
Sample banners telah ditambahkan ke database:
1. "Promo Menu Spesial" → navigasi ke `menu`
2. "Voucher Gratis" → navigasi ke `vouchers`  
3. "Program Loyalty" → navigasi ke `loyalty`
4. "Cari Outlet Terdekat" → navigasi ke `outlets`

## Usage
1. Admin dapat menambah banner di tabel `promo_banners`
2. Set `link_url` dengan nilai yang valid untuk navigasi
3. Banner akan otomatis menampilkan indikator klik
4. Customer dapat klik banner untuk navigasi langsung

## Security
- Validasi `link_url` terhadap daftar view yang diizinkan
- Console warning untuk target navigasi yang tidak valid
- Graceful handling untuk banner tanpa `link_url`