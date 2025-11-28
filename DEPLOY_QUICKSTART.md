# Quick Start - Deploy ke Vercel

## Metode Tercepat (5 Menit)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login ke Vercel

```bash
vercel login
```

### 3. Deploy!

```bash
vercel --prod
```

Ikuti prompt:
- **Set up and deploy?** → Yes
- **Which scope?** → Pilih account Anda
- **Link to existing project?** → No (pertama kali)
- **Project name?** → `zeger-pos` (atau nama lain)
- **Directory?** → `./` (tekan Enter)

### 4. Set Environment Variables

Setelah deploy pertama, tambahkan environment variables:

```bash
vercel env add VITE_SUPABASE_PROJECT_ID production
# Paste: uqgxxgbhvqjxrpotyilj

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZ3h4Z2JodnFqeHJwb3R5aWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDkwNTUsImV4cCI6MjA3MTE4NTA1NX0.GeOdMGjJy8ykhgTcUtd1spkxV6ljxNlNjy1EPovm9Xw

vercel env add VITE_SUPABASE_URL production
# Paste: https://uqgxxgbhvqjxrpotyilj.supabase.co
```

### 5. Redeploy dengan Environment Variables

```bash
vercel --prod
```

### 6. Update Supabase Auth URLs

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Go to **Authentication** → **URL Configuration**
4. Tambahkan Vercel URL Anda ke **Redirect URLs**:
   - `https://your-project.vercel.app/pos-app/auth`
   - `https://your-project.vercel.app/pos-app/dashboard`

## ✅ Selesai!

App Anda sekarang live di: `https://your-project.vercel.app`

## Test Deployment

1. Buka URL production
2. Navigate ke `/pos-app/auth`
3. Login dengan akun kasir
4. Test semua fitur

## Troubleshooting Cepat

### Build Error?
```bash
# Test build locally
npm run build

# Fix errors, then deploy again
vercel --prod
```

### Environment Variables Tidak Bekerja?
```bash
# List env vars
vercel env ls

# Pull env vars to local
vercel env pull
```

### Need Help?
Baca `DEPLOYMENT.md` untuk panduan lengkap.

## Update Deployment

Setiap kali ada perubahan code:

```bash
# Commit changes
git add .
git commit -m "Update feature"

# Deploy
vercel --prod
```

Atau jika sudah connect ke GitHub, tinggal push:

```bash
git push origin main
# Vercel akan auto-deploy!
```

---

**Status**: ✅ Ready to Deploy
**Estimated Time**: 5-10 minutes
**Cost**: Free (Vercel + Supabase free tier)
