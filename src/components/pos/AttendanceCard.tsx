import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  MapPin, 
  LogIn, 
  LogOut, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const AttendanceCard = () => {
  const { todayAttendance, checkIn, checkOut, loading } = useAttendance();
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          setLocationError(null);
        },
        (error) => {
          setLocationError(error.message);
          toast.error('Gagal mendapatkan lokasi: ' + error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      setLocationError('Geolocation tidak didukung pada browser ini');
      toast.error('Geolocation tidak didukung pada browser ini');
    }
  }, []);

  const handleCheckIn = async () => {
    if (!location) {
      toast.error('Lokasi belum tersedia');
      return;
    }

    try {
      await checkIn(location);
      toast.success('Berhasil check-in!');
    } catch (error: any) {
      toast.error('Gagal check-in: ' + error.message);
    }
  };

  const handleCheckOut = async () => {
    if (!location) {
      toast.error('Lokasi belum tersedia');
      return;
    }

    try {
      await checkOut(location);
      toast.success('Berhasil check-out!');
    } catch (error: any) {
      toast.error('Gagal check-out: ' + error.message);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'HH:mm:ss', { locale: idLocale });
  };

  const formatLocation = (locationString: string | null) => {
    if (!locationString) return '-';
    return locationString;
  };

  return (
    <Card className="border-red-200">
      <CardHeader className="bg-gradient-to-r from-red-50 to-white">
        <CardTitle className="flex items-center gap-2 text-red-700">
          <Clock className="h-5 w-5" />
          Absensi Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Current Date and Time */}
        <div className="text-center pb-4 border-b">
          <p className="text-2xl font-bold text-gray-900">
            {format(currentTime, 'EEEE, dd MMMM yyyy', { locale: idLocale })}
          </p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {format(currentTime, 'HH:mm:ss')}
          </p>
        </div>

        {/* Location Info */}
        {location && (
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-gray-900">Lokasi Saat Ini:</p>
              <p className="text-gray-600">
                {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        )}

        {locationError && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-orange-700">
              {locationError}
            </p>
          </div>
        )}

        {/* Attendance Status */}
        {todayAttendance ? (
          <div className="space-y-3">
            {/* Check-in Status */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <LogIn className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">Check-in</p>
                  <p className="text-sm text-green-700">
                    {formatTime(todayAttendance.check_in_time)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {formatLocation(todayAttendance.check_in_location)}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Selesai
              </Badge>
            </div>

            {/* Check-out Status or Button */}
            {todayAttendance.status === 'checked_out' ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <LogOut className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Check-out</p>
                    <p className="text-sm text-blue-700">
                      {formatTime(todayAttendance.check_out_time)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {formatLocation(todayAttendance.check_out_location)}
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selesai
                </Badge>
              </div>
            ) : (
              <Button
                onClick={handleCheckOut}
                disabled={loading || !location}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogOut className="h-5 w-5 mr-2" />
                    Check-out
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <Button
            onClick={handleCheckIn}
            disabled={loading || !location}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Memproses...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                Check-in
              </>
            )}
          </Button>
        )}

        {!location && !locationError && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
            <p className="text-sm text-gray-600">
              Menunggu lokasi GPS...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceCard;
