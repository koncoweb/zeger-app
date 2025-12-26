import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export interface NotificationPayload {
  type: 'new_order' | 'stock_transfer' | 'message' | 'system';
  title: string;
  body: string;
  orderId?: string;
  stockMovementId?: string;
}

class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async showNewOrderNotification(orderId: string, customerName: string, total: number) {
    const formattedTotal = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(total);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛵 Pesanan Baru!',
        body: `Pesanan dari ${customerName} - ${formattedTotal}`,
        data: {
          type: 'new_order',
          orderId,
        },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'orders' }),
      },
      trigger: null,
    });
  }

  async showStockTransferNotification(movementId: string, productName: string, quantity: number) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📦 Transfer Stok Baru',
        body: `${productName} x${quantity} menunggu konfirmasi`,
        data: {
          type: 'stock_transfer',
          stockMovementId: movementId,
        },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'stock' }),
      },
      trigger: null,
    });
  }

  async showSystemNotification(title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'system' },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'system' }),
      },
      trigger: null,
    });
  }

  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }

  async dismissAll() {
    await Notifications.dismissAllNotificationsAsync();
  }

  // Subscribe to realtime notifications from Supabase
  subscribeToOrders(riderId: string, onNewOrder: (order: any) => void) {
    return supabase
      .channel('rider-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_orders',
          filter: `assigned_rider_id=eq.${riderId}`,
        },
        (payload) => {
          onNewOrder(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customer_orders',
          filter: `assigned_rider_id=eq.${riderId}`,
        },
        (payload) => {
          if (payload.new.status === 'pending') {
            onNewOrder(payload.new);
          }
        }
      )
      .subscribe();
  }

  subscribeToStockTransfers(riderId: string, onNewTransfer: (transfer: any) => void) {
    return supabase
      .channel('rider-stock')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_movements',
          filter: `to_location_id=eq.${riderId}`,
        },
        (payload) => {
          if (payload.new.status === 'pending') {
            onNewTransfer(payload.new);
          }
        }
      )
      .subscribe();
  }

  unsubscribeAll() {
    supabase.removeAllChannels();
  }
}

export const notificationService = NotificationService.getInstance();
