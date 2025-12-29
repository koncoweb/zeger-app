# 🚀 Zeger Backoffice Deployment Guide

## 📋 Overview
Deploy hanya aplikasi backoffice (React + Vite) ke Vercel tanpa customer-expo dan rider-expo.

## ✅ Pre-Deployment Checklist

### 1. **Environment Variables**
Pastikan environment variables sudah diset di Vercel:
```bash
VITE_SUPABASE_URL=https://uqgxxgbhvqjxrpotyilj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZ3h4Z2JodnFqeHJwb3R5aWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDkwNTUsImV4cCI6MjA3MTE4NTA1NX0.GeOdMGjJy8ykhgTcUtd1spkxV6ljxNlNjy1EPovm9Xw
```

### 2. **Build Test Lokal**
```bash
npm install
npm run build
npm run preview
```

### 3. **File Configuration**
- ✅ `.vercelignore` - Exclude expo apps
- ✅ `vercel.json` - Deployment config
- ✅ `package.json` - Build scripts

## 🔧 Deployment Steps

### **Option 1: Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### **Option 2: Git Integration**
1. Push ke GitHub repository
2. Connect repository di Vercel dashboard
3. Set environment variables
4. Deploy automatically

## 📁 File Structure yang Di-Deploy
```
zeger-app/
├── src/                    # ✅ Backoffice source
├── public/                 # ✅ Static assets
├── dist/                   # ✅ Build output
├── package.json           # ✅ Dependencies
├── vite.config.ts         # ✅ Build config
├── vercel.json            # ✅ Deployment config
├── .vercelignore          # ✅ Exclude files
├── customer-expo/         # ❌ EXCLUDED
├── rider-expo/            # ❌ EXCLUDED
└── supabase/functions/    # ❌ EXCLUDED
```

## 🌐 Domain Configuration

### **Production Setup**
```
Domain: admin.zeger.id
Branch: main → Production
```

### **Staging Setup**
```
Domain: staging-admin.zeger.id  
Branch: staging → Staging
```

### **Preview Deployments**
```
Feature branches → preview-xyz.vercel.app
```

## 🔒 Security Configuration

### **Environment Variables**
```bash
# Production
VITE_SUPABASE_URL=https://uqgxxgbhvqjxrpotyilj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZ3h4Z2JodnFqeHJwb3R5aWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDkwNTUsImV4cCI6MjA3MTE4NTA1NX0.GeOdMGjJy8ykhgTcUtd1spkxV6ljxNlNjy1EPovm9Xw

# Staging (gunakan yang sama atau buat project terpisah)
VITE_SUPABASE_URL_STAGING=https://uqgxxgbhvqjxrpotyilj.supabase.co
VITE_SUPABASE_ANON_KEY_STAGING=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZ3h4Z2JodnFqeHJwb3R5aWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDkwNTUsImV4cCI6MjA3MTE4NTA1NX0.GeOdMGjJy8ykhgTcUtd1spkxV6ljxNlNjy1EPovm9Xw
```

### **Access Control**
- Password protection untuk staging
- Team access control
- Custom domains dengan HTTPS

## 🚨 Troubleshooting

### **Build Errors**
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### **Environment Issues**
- Check environment variables di Vercel dashboard
- Ensure VITE_ prefix untuk client-side variables
- Verify Supabase connection

### **Routing Issues**
- SPA routing handled by `vercel.json` rewrites
- All routes redirect to `/index.html`

## 📊 Performance Optimization

### **Build Optimization**
- Tree shaking enabled
- Code splitting by routes
- Asset optimization
- Gzip compression

### **Caching Strategy**
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 🔄 CI/CD Pipeline

### **Automatic Deployments**
1. Push to `main` → Production deployment
2. Push to `staging` → Staging deployment  
3. Pull Request → Preview deployment

### **Manual Deployment**
```bash
# Deploy specific branch
vercel --prod --branch main

# Deploy with custom domain
vercel --prod --alias admin.zeger.id
```

## 📈 Monitoring & Analytics

### **Vercel Analytics**
- Page views tracking
- Performance metrics
- Error monitoring

### **Build Logs**
- Check deployment logs di Vercel dashboard
- Monitor build performance
- Track deployment history

## 🎯 Success Criteria

✅ **Deployment berhasil jika:**
- Build completed without errors
- All routes accessible
- Supabase connection working
- Authentication functional
- All features working properly

## 📞 Support

Jika ada masalah deployment:
1. Check build logs di Vercel
2. Verify environment variables
3. Test build locally first
4. Check Supabase connection

---

**🚀 Ready to deploy!** Aplikasi backoffice Zeger siap di-deploy ke production dengan konfigurasi yang optimal.