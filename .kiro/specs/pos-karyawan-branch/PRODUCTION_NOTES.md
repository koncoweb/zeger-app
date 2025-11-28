# Production Deployment Notes - POS Karyawan Branch

## Authentication & Session Management

### Issue: Port Changes in Development
Saat development, ganti port bisa menyebabkan session tidak terbaca karena localStorage key berbeda.

### Solution for Production:
1. **Consistent URL**: Production akan menggunakan domain tetap (e.g., `pos.zeger.id`) tanpa port
2. **Session Cleanup**: Sudah diimplementasi di `signOut` function untuk clear semua Supabase session keys
3. **Auto Session Recovery**: `usePOSAuth` sudah handle session recovery dengan retry logic

### Recommendations:

#### 1. Environment Variables
Pastikan `.env.production` sudah di-set dengan benar:
```env
VITE_SUPABASE_URL=https://uqgxxgbhvqjxrpotyilj.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### 2. Domain Configuration
- Development: `http://localhost:5173` atau port lain
- Production: `https://pos.zeger.id` (consistent, no port)

#### 3. Session Timeout
Supabase default session timeout adalah 1 jam. Untuk POS app, pertimbangkan:
- Extend session timeout di Supabase dashboard (Settings > Auth > JWT expiry)
- Atau implement auto-refresh token mechanism

#### 4. Offline Mode
Sudah diimplementasi offline capability yang akan:
- Detect network status
- Store transactions locally saat offline
- Sync otomatis saat online kembali

## Database Policies

### RLS Policies yang Sudah Diterapkan:

1. **Branches Table**:
   - Anonymous users dapat read active branches (untuk registration form)
   - Authenticated users dapat read semua branches

2. **Profiles Table**:
   - Users dapat read/update own profile
   - HO admin dapat manage all profiles

3. **Transactions & Related Tables**:
   - Users hanya bisa access data dari branch mereka sendiri
   - Filtered by `branch_id`

## Performance Optimization

### 1. Lazy Loading
Pertimbangkan lazy load untuk routes:
```typescript
const POSDashboard = lazy(() => import('./pages/pos/POSDashboard'));
const POSTransaction = lazy(() => import('./pages/pos/POSTransaction'));
// etc.
```

### 2. Image Optimization
- Logo dan assets sudah di-optimize
- Gunakan WebP format untuk images
- Implement lazy loading untuk product images

### 3. Bundle Size
Current bundle sudah optimal dengan:
- Tree shaking enabled
- Code splitting per route
- Minimal dependencies

## Security Checklist

- [x] RLS policies enabled untuk semua tables
- [x] Anonymous access hanya untuk branches (read-only)
- [x] Role-based access control (kasir roles only)
- [x] Session management dengan auto-cleanup
- [x] Input validation dengan Zod schemas
- [ ] Rate limiting (implement di Supabase Edge Functions jika perlu)
- [ ] CORS configuration (check Supabase settings)

## Monitoring & Error Tracking

### Recommended Tools:
1. **Sentry** - untuk error tracking
2. **Google Analytics / Plausible** - untuk usage analytics
3. **Supabase Dashboard** - untuk database monitoring

### Key Metrics to Monitor:
- Login success/failure rate
- Transaction completion rate
- Average transaction time
- Offline mode usage
- API response times

## Deployment Checklist

### Pre-Deployment:
- [ ] Run all tests: `npm test`
- [ ] Build production: `npm run build`
- [ ] Check bundle size: `npm run build -- --analyze`
- [ ] Test production build locally: `npm run preview`
- [ ] Verify environment variables
- [ ] Test on different devices (desktop, tablet, mobile)

### Post-Deployment:
- [ ] Verify login works
- [ ] Test transaction flow end-to-end
- [ ] Check offline mode
- [ ] Verify print functionality
- [ ] Test on actual thermal printer
- [ ] Monitor error logs for first 24 hours

## Known Limitations

1. **Thermal Printer**: Browser print API mungkin tidak support semua thermal printer. Fallback ke PDF download sudah diimplementasi.

2. **Geolocation**: Attendance check-in/out memerlukan location permission. User harus allow permission.

3. **Offline Mode**: Hanya transactions yang di-queue saat offline. Real-time updates tidak available saat offline.

4. **Browser Compatibility**: Tested di Chrome, Firefox, Edge. Safari mungkin perlu additional testing.

## Troubleshooting

### Issue: User tidak bisa login setelah deployment
**Solution**: 
- Clear browser cache dan localStorage
- Verify Supabase URL dan anon key di environment variables
- Check RLS policies di Supabase dashboard

### Issue: Infinite loading saat navigasi
**Solution**: 
- Sudah fixed dengan useRef untuk prevent duplicate fetch
- Jika masih terjadi, check console untuk auth state changes

### Issue: Branches tidak muncul di registration form
**Solution**:
- Verify RLS policy "Anonymous users can view active branches" exists
- Check ada data branches dengan `is_active = true`

### Issue: Profile tidak ditemukan setelah registration
**Solution**:
- Verify trigger `handle_new_user()` berjalan dengan benar
- Check ada data di table profiles untuk user tersebut
- Retry logic sudah diimplementasi (3x retry dengan 1s delay)
