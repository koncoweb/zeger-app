# Deployment Guide - Zeger POS Karyawan Branch

## Prerequisites

- [x] Vercel account (free tier works)
- [x] GitHub repository (recommended) or Vercel CLI
- [x] Supabase project with all migrations applied
- [x] Environment variables ready

## Option 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for production deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/zeger-pos.git

# Push to GitHub
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite framework

### Step 3: Configure Environment Variables

In Vercel project settings, add these environment variables:

```
VITE_SUPABASE_PROJECT_ID=uqgxxgbhvqjxrpotyilj
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZ3h4Z2JodnFqeHJwb3R5aWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDkwNTUsImV4cCI6MjA3MTE4NTA1NX0.GeOdMGjJy8ykhgTcUtd1spkxV6ljxNlNjy1EPovm9Xw
VITE_SUPABASE_URL=https://uqgxxgbhvqjxrpotyilj.supabase.co
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (usually 2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Option 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
# For production deployment
vercel --prod

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No (first time)
# - Project name? zeger-pos (or your choice)
# - Directory? ./ (current directory)
```

### Step 4: Set Environment Variables

```bash
# Add environment variables
vercel env add VITE_SUPABASE_PROJECT_ID
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
vercel env add VITE_SUPABASE_URL

# Redeploy with new env vars
vercel --prod
```

## Post-Deployment Configuration

### 1. Update Supabase Auth Settings

Go to Supabase Dashboard > Authentication > URL Configuration:

Add your Vercel URL to:
- **Site URL**: `https://your-project.vercel.app`
- **Redirect URLs**: 
  - `https://your-project.vercel.app/pos-app/auth`
  - `https://your-project.vercel.app/pos-app/dashboard`

### 2. Configure Custom Domain (Optional)

In Vercel Dashboard:
1. Go to Project Settings > Domains
2. Add custom domain (e.g., `pos.zeger.id`)
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs with custom domain

### 3. Enable HTTPS (Automatic)

Vercel automatically provides SSL certificates. No action needed.

## Verification Checklist

After deployment, verify:

- [ ] App loads at production URL
- [ ] Login works correctly
- [ ] Registration works
- [ ] Products load in transaction page
- [ ] Inventory page shows data
- [ ] Transactions can be created
- [ ] Attendance check-in/out works
- [ ] Transaction history loads
- [ ] Print receipt works (or downloads PDF)
- [ ] Offline mode works
- [ ] All navigation works correctly

## Troubleshooting

### Build Fails

**Issue**: Build fails with TypeScript errors

**Solution**:
```bash
# Test build locally first
npm run build

# Fix any TypeScript errors
npm run type-check
```

### Environment Variables Not Working

**Issue**: App shows "undefined" for Supabase URL

**Solution**:
1. Verify env vars in Vercel dashboard
2. Ensure they start with `VITE_` prefix
3. Redeploy after adding env vars

### 404 on Page Refresh

**Issue**: Refreshing page shows 404

**Solution**: 
- Verify `vercel.json` has correct rewrites configuration
- Already configured in this project ✅

### Supabase Connection Fails

**Issue**: "Failed to connect to Supabase"

**Solution**:
1. Check Supabase project is not paused
2. Verify API keys are correct
3. Check Supabase dashboard for any issues
4. Verify RLS policies allow access

## Performance Optimization

### 1. Enable Vercel Analytics (Optional)

```bash
npm install @vercel/analytics
```

Add to `src/main.tsx`:
```typescript
import { inject } from '@vercel/analytics';
inject();
```

### 2. Enable Vercel Speed Insights (Optional)

```bash
npm install @vercel/speed-insights
```

Add to `src/main.tsx`:
```typescript
import { injectSpeedInsights } from '@vercel/speed-insights';
injectSpeedInsights();
```

## Monitoring

### Vercel Dashboard

Monitor:
- Deployment status
- Build logs
- Runtime logs
- Analytics (if enabled)
- Performance metrics

### Supabase Dashboard

Monitor:
- Database usage
- API requests
- Auth users
- Storage usage
- Real-time connections

## Rollback

If deployment has issues:

```bash
# Via CLI
vercel rollback

# Or via Dashboard
# Go to Deployments > Select previous deployment > Promote to Production
```

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

- **Push to `main`** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull requests** → Preview deployment with unique URL

## Cost Estimation

### Vercel Free Tier Includes:
- Unlimited deployments
- 100 GB bandwidth/month
- Automatic HTTPS
- Preview deployments
- Analytics (basic)

### Supabase Free Tier Includes:
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- 50,000 monthly active users
- Unlimited API requests

**Expected Cost**: $0/month for small to medium usage

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase logs
3. Check browser console for errors
4. Review `PRODUCTION_NOTES.md` for common issues
5. Contact support:
   - Vercel: https://vercel.com/support
   - Supabase: https://supabase.com/support

## Next Steps

After successful deployment:

1. ✅ Test all features in production
2. ✅ Share URL with team for testing
3. ✅ Monitor error logs for first 24 hours
4. ✅ Set up monitoring/alerting (optional)
5. ✅ Document any production-specific configurations
6. ✅ Train users on the system
7. ✅ Set up backup strategy for database

## Production URL

Once deployed, your app will be available at:
- Vercel URL: `https://your-project.vercel.app`
- Custom domain: `https://pos.zeger.id` (if configured)

## Security Notes

- ✅ All API keys are environment variables (not in code)
- ✅ HTTPS enabled automatically
- ✅ RLS policies protect database
- ✅ Authentication required for all POS routes
- ✅ Role-based access control implemented
- ✅ Session management secure

## Maintenance

### Regular Tasks:
- Monitor Supabase usage
- Review error logs weekly
- Update dependencies monthly
- Backup database regularly
- Review and update RLS policies as needed

### Updates:
```bash
# Pull latest changes
git pull origin main

# Vercel will auto-deploy
# Or manually trigger:
vercel --prod
```

---

**Deployment prepared by**: Kiro AI
**Last updated**: 2024
**Status**: Ready for Production ✅
