# Customer Expo PWA Conversion - Technical Design

## Architecture Overview

The customer-expo PWA conversion follows the same proven pattern used for rider-expo, adapting it for customer-specific features while preserving the Google Maps integration and ensuring optimal user experience across mobile and web platforms.

```
┌─────────────────────────────────────────────────────────────┐
│                    Customer PWA Architecture                 │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React Native + Expo Router)                     │
│  ├── PWA Manifest (app shortcuts, theme)                   │
│  ├── Service Worker (caching, offline, push)               │
│  ├── Map Integration (native mobile, web fallback)         │
│  └── Offline Store (menu, cart, orders)                    │
├─────────────────────────────────────────────────────────────┤
│  Backend (Supabase)                                        │
│  ├── Database (customers, orders, products, riders)        │
│  ├── Authentication (customer accounts)                    │
│  ├── Edge Functions (order processing, notifications)      │
│  └── Push Notifications (Expo Push Service)                │
├─────────────────────────────────────────────────────────────┤
│  Deployment (EAS Hosting)                                  │
│  ├── Web Build (static files + PWA assets)                 │
│  ├── Mobile Apps (iOS/Android via EAS Build)               │
│  └── HTTPS/SSL (automatic via EAS)                         │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. PWA Configuration Files

#### app.json Web Configuration
```json
{
  "web": {
    "bundler": "metro",
    "output": "static",
    "favicon": "./assets/images/favicon.png",
    "name": "Zeger Customer",
    "shortName": "Zeger Customer", 
    "lang": "id",
    "scope": "/",
    "themeColor": "#EA2831",
    "backgroundColor": "#EA2831",
    "display": "standalone",
    "orientation": "portrait",
    "startUrl": "/",
    "preferRelatedApplications": false
  }
}
```

#### PWA Manifest Structure
```typescript
interface CustomerPWAManifest {
  name: "Zeger Customer - Pesan Kopi & Makanan";
  short_name: "Zeger Customer";
  description: "Aplikasi untuk memesan kopi dan makanan dari Zeger Coffee";
  start_url: "/";
  display: "standalone";
  theme_color: "#EA2831";
  background_color: "#EA2831";
  categories: ["food", "shopping"];
  shortcuts: CustomerAppShortcut[];
  icons: PWAIcon[];
}

interface CustomerAppShortcut {
  name: "Menu" | "Keranjang" | "Pesanan" | "Peta Rider";
  url: "/menu" | "/cart" | "/orders" | "/map";
  description: string;
  icons: PWAIcon[];
}
```

### 2. Service Worker Architecture

#### Caching Strategy
```typescript
// Customer-specific caching strategy
const CACHE_STRATEGIES = {
  // Static assets - Cache First
  static: {
    pattern: /\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/,
    strategy: 'CacheFirst',
    cacheName: 'zeger-customer-static-v1'
  },
  
  // Menu data - Stale While Revalidate
  menu: {
    pattern: /\/api\/menu|\/api\/products/,
    strategy: 'StaleWhileRevalidate',
    cacheName: 'zeger-customer-menu-v1'
  },
  
  // User data - Network First
  user: {
    pattern: /\/api\/profile|\/api\/orders/,
    strategy: 'NetworkFirst',
    cacheName: 'zeger-customer-user-v1'
  },
  
  // Real-time data - Network Only
  realtime: {
    pattern: /\/api\/riders\/nearby|\/api\/orders\/track/,
    strategy: 'NetworkOnly'
  }
};
```

#### Background Sync Implementation
```typescript
// Queue orders when offline
interface OfflineOrder {
  id: string;
  items: CartItem[];
  delivery_address: Address;
  payment_method: string;
  timestamp: number;
  retry_count: number;
}

class CustomerOfflineSync {
  private orderQueue: OfflineOrder[] = [];
  
  async queueOrder(order: OfflineOrder): Promise<void> {
    this.orderQueue.push(order);
    await this.persistQueue();
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('customer-order-sync');
    }
  }
  
  async processQueue(): Promise<void> {
    for (const order of this.orderQueue) {
      try {
        await this.submitOrder(order);
        this.removeFromQueue(order.id);
      } catch (error) {
        order.retry_count++;
        if (order.retry_count >= 3) {
          this.moveToFailedQueue(order);
        }
      }
    }
  }
}
```

### 3. Map Integration Design

#### Platform-Specific Map Components
```typescript
// Native Map (iOS/Android)
interface NativeMapProps {
  initialRegion: Region;
  userLocation?: Location;
  nearbyRiders: Rider[];
  selectedRider?: Rider;
  onRiderSelect: (rider: Rider) => void;
  showRoute?: boolean;
  routeCoordinates?: Coordinate[];
}

// Web Map Fallback
interface WebMapFallbackProps {
  nearbyRiders: Rider[];
  userLocation?: Location;
  onRiderSelect: (rider: Rider) => void;
}

// Map Container (Platform Agnostic)
const MapContainer: React.FC<MapContainerProps> = (props) => {
  return Platform.OS === 'web' ? (
    <WebMapFallback {...props} />
  ) : (
    <NativeMap {...props} />
  );
};
```

#### Enhanced Web Map (Optional Future Enhancement)
```typescript
// Google Maps JavaScript API integration for web
interface WebGoogleMapProps extends WebMapFallbackProps {
  googleMapsApiKey: string;
  mapContainerStyle: React.CSSProperties;
}

const WebGoogleMap: React.FC<WebGoogleMapProps> = ({
  nearbyRiders,
  userLocation,
  onRiderSelect,
  googleMapsApiKey
}) => {
  // Implementation using @googlemaps/js-api-loader
  // This would provide full map functionality on web
};
```

### 4. Offline Data Management

#### Customer Offline Store
```typescript
interface CustomerOfflineStore {
  // Menu data
  menu: {
    categories: ProductCategory[];
    products: Product[];
    lastUpdated: number;
  };
  
  // User data
  user: {
    profile: CustomerProfile;
    addresses: Address[];
    orderHistory: Order[];
    favorites: Product[];
  };
  
  // Cart data
  cart: {
    items: CartItem[];
    deliveryAddress?: Address;
    paymentMethod?: PaymentMethod;
    promoCode?: string;
  };
  
  // Sync queue
  syncQueue: {
    orders: OfflineOrder[];
    profileUpdates: ProfileUpdate[];
    addressUpdates: AddressUpdate[];
  };
}

class CustomerOfflineManager {
  private store: CustomerOfflineStore;
  
  async cacheMenu(menu: MenuData): Promise<void> {
    this.store.menu = {
      ...menu,
      lastUpdated: Date.now()
    };
    await this.persistStore();
  }
  
  async getOfflineMenu(): Promise<MenuData | null> {
    const { menu } = this.store;
    const isStale = Date.now() - menu.lastUpdated > 24 * 60 * 60 * 1000; // 24 hours
    
    return isStale ? null : menu;
  }
  
  async persistCart(cart: CartData): Promise<void> {
    this.store.cart = cart;
    await this.persistStore();
  }
}
```

### 5. Push Notification System

#### Customer Notification Types
```typescript
enum CustomerNotificationType {
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_PREPARING = 'order_preparing', 
  RIDER_ASSIGNED = 'rider_assigned',
  RIDER_APPROACHING = 'rider_approaching',
  ORDER_DELIVERED = 'order_delivered',
  PROMOTIONAL = 'promotional',
  SYSTEM = 'system'
}

interface CustomerNotification {
  type: CustomerNotificationType;
  title: string;
  body: string;
  data: {
    orderId?: string;
    riderId?: string;
    promoCode?: string;
    deepLink: string;
  };
}
```

#### Notification Handler
```typescript
class CustomerNotificationHandler {
  async handleNotification(notification: CustomerNotification): Promise<void> {
    const { type, data } = notification;
    
    switch (type) {
      case CustomerNotificationType.ORDER_CONFIRMED:
        // Navigate to order tracking
        router.push(`/order-tracking/${data.orderId}`);
        break;
        
      case CustomerNotificationType.RIDER_ASSIGNED:
        // Show rider info and update map
        this.showRiderAssigned(data.riderId, data.orderId);
        break;
        
      case CustomerNotificationType.PROMOTIONAL:
        // Navigate to menu with promo code
        router.push(`/menu?promo=${data.promoCode}`);
        break;
        
      default:
        // Default navigation
        router.push(data.deepLink);
    }
  }
}
```

## File Structure

```
customer-expo/
├── app.json                          # Updated with PWA config
├── dist/                            # Web build output
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker
│   └── browserconfig.xml           # Windows tiles config
├── add-pwa-tags.js                 # PWA meta tags injection
├── components/
│   ├── map/
│   │   ├── NativeMap.tsx          # Mobile map (existing)
│   │   ├── NativeMap.web.tsx      # Web fallback (existing)
│   │   └── MapContainer.tsx       # Platform-agnostic wrapper
│   ├── offline/
│   │   ├── OfflineIndicator.tsx   # Network status indicator
│   │   ├── OfflineBanner.tsx      # Offline mode banner
│   │   └── SyncStatus.tsx         # Sync queue status
│   └── pwa/
│       ├── InstallPrompt.tsx      # PWA install prompt
│       └── UpdatePrompt.tsx       # App update prompt
├── hooks/
│   ├── useOffline.ts              # Network status hook
│   ├── useOfflineSync.ts          # Offline sync hook
│   ├── usePWAInstall.ts           # PWA installation hook
│   └── useNotifications.ts        # Push notifications hook
├── store/
│   ├── offlineStore.ts            # Offline data management
│   ├── cartStore.ts               # Enhanced with offline support
│   └── authStore.ts               # Enhanced with offline support
└── lib/
    ├── pwa.ts                     # PWA utilities
    ├── serviceWorker.ts           # SW registration
    └── offlineManager.ts          # Offline data manager
```

## Implementation Strategy

### Phase 1: Core PWA Setup
1. **Update app.json** with PWA web configuration
2. **Create manifest.json** with customer-specific shortcuts and branding
3. **Implement basic service worker** with caching strategies
4. **Add PWA meta tags injection script** adapted from rider-expo
5. **Deploy to EAS hosting** and verify PWA installation

### Phase 2: Offline Capabilities  
1. **Implement offline menu caching** with stale-while-revalidate strategy
2. **Add cart persistence** with local storage backup
3. **Create offline indicators** to show network status
4. **Implement background sync** for order queue management
5. **Add offline order history** caching

### Phase 3: Enhanced Features
1. **Push notification system** for order updates and promotions
2. **Advanced caching strategies** for performance optimization
3. **PWA install prompts** and update notifications
4. **Performance monitoring** and optimization
5. **Enhanced web map integration** (optional)

## Data Flow Diagrams

### Order Flow (Online vs Offline)
```
Online Order Flow:
User → Menu → Cart → Checkout → Payment → Supabase → Confirmation

Offline Order Flow:  
User → Cached Menu → Cart → Queue Order → Background Sync → Supabase
```

### Map Integration Flow
```
Mobile Platform:
Location Permission → Google Maps API → NativeMap → Rider Markers

Web Platform:
Location Permission → WebMapFallback → Rider List → Manual Selection
```

### Notification Flow
```
Order Update → Supabase Edge Function → Expo Push API → Service Worker → User Notification
```

## Performance Considerations

### Caching Strategy
- **Static Assets**: Aggressive caching with cache-first strategy
- **Menu Data**: Stale-while-revalidate for fresh content with fallback
- **User Data**: Network-first with offline fallback
- **Real-time Data**: Network-only to ensure accuracy

### Bundle Optimization
- **Code Splitting**: Route-based splitting for faster initial load
- **Image Optimization**: WebP format with fallbacks
- **Tree Shaking**: Remove unused dependencies
- **Compression**: Gzip/Brotli compression via EAS hosting

### Memory Management
- **Cache Size Limits**: Implement cache eviction policies
- **Image Lazy Loading**: Load images on demand
- **Component Lazy Loading**: Load heavy components when needed
- **Memory Leak Prevention**: Proper cleanup of subscriptions and timers

## Security Considerations

### Data Protection
- **Secure Storage**: Use expo-secure-store for sensitive data
- **Token Management**: Automatic token refresh and secure storage
- **API Security**: Validate all API requests server-side
- **User Privacy**: Minimal location data collection and storage

### PWA Security
- **HTTPS Only**: Enforced by EAS hosting
- **Content Security Policy**: Prevent XSS attacks
- **Service Worker Security**: Validate all cached resources
- **Update Security**: Verify service worker updates

## Testing Strategy

### PWA Testing
- **Installation Testing**: Verify install prompts and app installation
- **Offline Testing**: Test all offline scenarios and data persistence
- **Performance Testing**: Lighthouse audits and Core Web Vitals
- **Cross-Browser Testing**: Chrome, Safari, Firefox, Edge

### Functional Testing
- **Map Integration**: Test native maps vs web fallback
- **Order Flow**: Complete order journey testing
- **Notification Testing**: Push notification delivery and handling
- **Sync Testing**: Offline-to-online data synchronization

### User Acceptance Testing
- **Customer Journey**: End-to-end customer experience
- **Accessibility**: Screen reader and keyboard navigation
- **Performance**: Real-world network conditions
- **Device Testing**: Various mobile devices and screen sizes

## Deployment Pipeline

### Build Process
1. **Web Build**: `expo export --platform web`
2. **PWA Assets**: Generate manifest.json and service worker
3. **Meta Tags**: Inject PWA meta tags into HTML files
4. **Asset Optimization**: Compress images and minify code
5. **EAS Deploy**: Upload to EAS hosting with HTTPS

### Monitoring and Analytics
- **Performance Monitoring**: Core Web Vitals tracking
- **Error Tracking**: Service worker and app error logging
- **Usage Analytics**: PWA installation and usage metrics
- **User Feedback**: In-app feedback collection for improvements