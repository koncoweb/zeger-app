# Zeger Rider App - Deployment Guide

## 🚀 Deployment Status

### ✅ EAS Update (Mobile Apps)
- **Branch**: production
- **Runtime Version**: 1.0.0
- **Platforms**: Android, iOS
- **Update Group ID**: 0cade722-1a07-42b5-973d-a3475731caf9
- **Dashboard**: https://expo.dev/accounts/koncomyid/projects/zeger-rider/updates/0cade722-1a07-42b5-973d-a3475731caf9

### 🌐 Web Deployment (EAS Hosting)
- **Production URL**: https://zeger-rider.expo.app
- **Dashboard**: https://expo.dev/projects/3f638d68-0912-4149-928a-02fe56a166b9/hosting/deployments
- **Build Output**: `dist/` folder
- **Status**: ✅ Deployed

## 📱 Mobile App Updates

### Deploy New Update
```bash
cd rider-expo
npx eas update --branch production --message "Your update message"
```

### Check Update Status
```bash
npx eas update:list --branch production
```

## 🌐 Web Hosting

### EAS Hosting (Current)
1. Build the web app:
   ```bash
   cd rider-expo
   npx expo export --platform web
   ```
2. Add PWA features:
   ```bash
   node add-pwa-tags.js
   ```
3. Deploy to EAS hosting:
   ```bash
   npx eas deploy --prod
   ```
4. Access at: https://zeger-rider.expo.app

**PWA Features:**
- ✅ **Installable** - Klik "Install App" di browser
- ✅ **Offline Support** - Service worker caching
- ✅ **Offline Sync** - Data tersimpan offline, sync otomatis saat online
- ✅ **Web Push Notifications** - Push notif di browser
- ✅ **App Shortcuts** - Dashboard, POS, Orders
- ✅ **Background Sync** - Sinkronisasi background via service worker

**Offline Sync Features:**
- 📱 **Transaksi Offline** - Penjualan tetap bisa dilakukan saat offline
- 📍 **Location Tracking** - GPS tracking tersimpan offline
- 📋 **Attendance & Checkpoints** - Absensi dan checkpoint offline
- 📦 **Stock Movements** - Pergerakan stok tersimpan offline
- 🔄 **Auto-Retry** - Retry otomatis untuk data yang gagal sync
- 📊 **Sync Status** - Status bar menampilkan progress sinkronisasi

### Alternative Options

#### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npx expo export --platform web`
3. Set publish directory: `dist`
4. Deploy automatically on push

#### Vercel
1. Connect your GitHub repository to Vercel
2. Set build command: `npx expo export --platform web`
3. Set output directory: `dist`
4. Deploy automatically on push

## 🔐 Test Accounts

### Rider Account 1
- **Email**: fajar@zeger.test
- **Password**: password123
- **Name**: Z-010 Fajar
- **Role**: rider
- **Branch**: Branch Hub Zeger Kemiri

### Rider Account 2
- **Email**: reza@zeger.test
- **Password**: password123
- **Name**: Z-009 Mas Reza
- **Role**: sb_rider
- **Branch**: Zeger Coffee Malang

## 📋 Features Deployed

### ✅ Core Features
- Authentication system
- Dashboard with real-time stats
- POS/Selling interface
- Order management
- Stock management (receive/return)
- Analytics and reporting
- Attendance tracking
- Checkpoint recording
- Shift management
- Profile management

### ✅ Technical Features
- **Offline Support & Sync**
  - **Automatic Offline Detection** - Detects network status
  - **Offline Data Storage** - Stores transactions, locations, attendance offline
  - **Auto-Sync** - Syncs data when connection restored
  - **Retry Logic** - Retries failed syncs with exponential backoff
  - **Conflict Resolution** - Handles data conflicts intelligently
  - **Background Sync** - Service worker background synchronization
- **PWA Support (Web)**
  - **Installable** - Dapat diinstall di desktop/mobile
  - **Offline Caching** - Service worker untuk cache
  - **Web Push Notifications** - Push notif di browser
  - **App Shortcuts** - Quick actions dari home screen
- Push notifications (mobile)
- Real-time updates
- GPS location tracking
- Photo capture and upload
- Responsive web design

## 🔧 Environment Variables

Make sure these are set in your hosting platform:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 📊 Performance

### Web Bundle
- **Size**: 1.83 MB (optimized)
- **Assets**: 26 files (fonts, icons)
- **Routes**: 19 static pages

### Mobile Bundle
- **Android**: 2.08 MB
- **iOS**: 2.08 MB
- **Assets**: 30 per platform

## 🛠 Troubleshooting

### Build Issues
1. Clear cache: `npx expo export --clear`
2. Reinstall dependencies: `npm install`
3. Check TypeScript errors: `npx tsc --noEmit`

### Update Issues
1. Check EAS CLI version: `npx eas --version`
2. Login to EAS: `npx eas login`
3. Check project configuration: `npx eas config`

## 📞 Support

For deployment issues, check:
1. EAS Dashboard: https://expo.dev/accounts/koncomyid/projects/zeger-rider
2. Build logs in EAS Dashboard
3. Network connectivity for updates