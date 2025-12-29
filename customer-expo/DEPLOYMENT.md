# Zeger Customer PWA - Deployment Guide

## Overview

This guide covers the deployment process for the Zeger Customer Progressive Web App (PWA), including build, deployment, and verification steps.

## Prerequisites

- Node.js 18+ installed
- Expo CLI installed (`npm install -g @expo/cli`)
- Access to EAS (Expo Application Services)
- Supabase project configured

## Build Process

### 1. Install Dependencies

```bash
cd customer-expo
npm install
```

### 2. Configure Environment

Ensure your `app.json` is properly configured with:
- PWA web configuration
- Theme colors (#EA2831)
- Proper app metadata
- EAS project ID

### 3. Build Web Version

```bash
# Export web build
npx expo export --platform web

# Add PWA enhancements
node add-pwa-tags.js
```

This will:
- Generate static web files in `dist/` directory
- Inject PWA meta tags into HTML files
- Include service worker and manifest files

### 4. Verify PWA Assets

Ensure these files exist in `dist/`:
- `manifest.json` - PWA manifest with app shortcuts
- `sw.js` - Service worker with offline capabilities
- `browserconfig.xml` - Windows tiles configuration

## Deployment to EAS Hosting

### 1. Deploy Web Build

```bash
# Deploy to EAS hosting
npx eas build --platform web --non-interactive
```

### 2. Verify Deployment

After deployment, verify:
- HTTPS access to the deployed app
- PWA manifest is accessible at `/manifest.json`
- Service worker is accessible at `/sw.js`
- All routes load correctly

## PWA Verification

### 1. Lighthouse Audit

Run Lighthouse audit to verify PWA compliance:
- Performance score > 90
- PWA score > 90
- All PWA criteria met

### 2. Installation Testing

Test PWA installation on:
- **Chrome (Android/Desktop)**: Look for install prompt
- **Safari (iOS)**: Use "Add to Home Screen" from share menu
- **Edge (Desktop)**: Look for install button in address bar

### 3. Offline Testing

Verify offline functionality:
- Disconnect network
- Navigate through cached pages
- Test service worker caching
- Verify offline indicators appear

## Service Worker Features

The deployed PWA includes:

### Caching Strategies
- **Static Assets**: Cache-first (JS, CSS, images)
- **Menu Data**: Stale-while-revalidate
- **User Data**: Network-first with offline fallback
- **Real-time Data**: Network-only

### Offline Capabilities
- Menu browsing when offline
- Cart persistence across sessions
- Order queuing for later sync
- Background sync when online

### Push Notifications
- Order status updates
- Promotional notifications
- System announcements

## Monitoring and Maintenance

### 1. Performance Monitoring

Monitor these metrics:
- First Contentful Paint < 2 seconds
- Time to Interactive < 3 seconds
- Service worker registration success rate

### 2. Error Tracking

Monitor for:
- Service worker registration failures
- Cache storage errors
- Offline sync failures
- Push notification delivery issues

### 3. Updates

To deploy updates:
1. Make changes to the code
2. Update version in `app.json`
3. Run build and deployment process
4. Service worker will automatically update users

## Troubleshooting

### Common Issues

**PWA not installable:**
- Check HTTPS deployment
- Verify manifest.json is valid
- Ensure service worker is registered

**Offline functionality not working:**
- Check service worker registration
- Verify cache strategies
- Test network connectivity detection

**Push notifications not working:**
- Verify notification permissions
- Check Expo push token registration
- Test notification payload format

### Debug Tools

Use browser dev tools:
- **Application tab**: Check service worker, cache, manifest
- **Network tab**: Verify caching behavior
- **Console**: Check for errors and logs

## Security Considerations

- All traffic served over HTTPS
- Service worker validates cached resources
- Push notifications use secure tokens
- User data encrypted in offline storage

## Performance Optimization

- Static assets cached aggressively
- Menu data cached with smart invalidation
- Images optimized for web delivery
- Code splitting for faster initial load

## Browser Compatibility

**Full PWA Support:**
- Chrome 67+
- Edge 79+
- Firefox 44+

**Limited PWA Support:**
- Safari 11.1+ (iOS/macOS)
- Samsung Internet 7.2+

**Graceful Degradation:**
- All browsers support basic functionality
- PWA features enhance experience when available