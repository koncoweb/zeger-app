import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Phone, MapPin, Clock, Loader2, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Rider {
  id: string;
  full_name: string;
  phone: string;
  photo_url?: string;
  distance_km: number;
  eta_minutes: number;
}

interface CustomerOrderWaitingProps {
  orderId: string;
  rider: Rider;
  onAccepted: () => void;
  onRejected: (reason: string) => void;
  onCancel: () => void;
}

export default function CustomerOrderWaiting({
  orderId,
  rider,
  onAccepted,
  onRejected,
  onCancel
}: CustomerOrderWaitingProps) {
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(60);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    // Subscribe to order status changes
    const channel = supabase
      .channel('order_status_waiting')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'customer_orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        console.log('Order status changed:', payload);
        const newStatus = payload.new.status;
        
        if (newStatus === 'accepted' || newStatus === 'in_progress') {
          toast({
            title: '✅ Pesanan Diterima!',
            description: `${rider.full_name} menerima pesanan Anda`,
          });
          onAccepted();
        } else if (newStatus === 'rejected') {
          const reason = payload.new.rejection_reason || 'Rider menolak pesanan';
          setRejectionReason(reason);
          setShowRejectionDialog(true);
          setTimeout(() => {
            setShowRejectionDialog(false);
            onRejected(reason);
          }, 5000);
        }
      })
      .subscribe();

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: '⏱️ Waktu Habis',
            description: 'Rider tidak merespons dalam waktu yang ditentukan',
            variant: 'destructive'
          });
          onRejected('Tidak ada respons dari rider');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [orderId, onAccepted, onRejected]);

  const handleCallRider = () => {
    if (rider.phone) {
      window.location.href = `tel:${rider.phone}`;
    }
  };

  const handleWhatsAppRider = () => {
    if (rider.phone) {
      const cleanPhone = rider.phone.replace(/[^\d]/g, '');
      const whatsappPhone = cleanPhone.startsWith('62') 
        ? cleanPhone 
        : `62${cleanPhone.replace(/^0/, '')}`;
      const message = encodeURIComponent(
        `Halo ${rider.full_name}, saya customer Zeger dengan pesanan #${orderId}.`
      );
      window.open(`https://wa.me/${whatsappPhone}?text=${message}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="relative">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🏍️</span>
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold">Menunggu Konfirmasi</h2>
            <p className="text-muted-foreground">
              Mohon tunggu, rider akan segera merespons pesanan Anda
            </p>
          </div>

          {/* Countdown */}
          <div className="flex justify-center">
            <div className="bg-primary text-primary-foreground rounded-full w-20 h-20 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold">{countdown}</div>
                <div className="text-xs">detik</div>
              </div>
            </div>
          </div>

          {/* Rider Info */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16 ring-2 ring-primary/10">
                <AvatarImage src={rider.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rider.id}`} />
                <AvatarFallback>{rider.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{rider.full_name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{rider.phone}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{rider.distance_km.toFixed(1)} km</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium">~{rider.eta_minutes} menit</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleCallRider}
              >
                <Phone className="h-4 w-4 mr-2" />
                Telepon
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-[#25D366]"
                onClick={handleWhatsAppRider}
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </Button>
            </div>
            <Button
              variant="destructive"
              size="lg"
              className="w-full"
              onClick={onCancel}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Batalkan Pesanan
            </Button>
          </div>

          {/* Info Text */}
          <p className="text-center text-xs text-muted-foreground">
          Pesanan akan otomatis dibatalkan jika tidak ada respons dalam {countdown} detik
        </p>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Pesanan Ditolak
            </DialogTitle>
            <DialogDescription>
              Mohon maaf, rider tidak dapat menerima pesanan Anda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-destructive/10 p-4 rounded-lg">
              <p className="text-sm font-medium mb-1">Alasan Penolakan:</p>
              <p className="text-sm text-destructive">{rejectionReason}</p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="h-10 w-10">
                <AvatarImage src={rider.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rider.id}`} />
                <AvatarFallback>{rider.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{rider.full_name}</p>
                <p className="text-xs">{rider.phone}</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowRejectionDialog(false);
                onRejected(rejectionReason);
              }}
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
