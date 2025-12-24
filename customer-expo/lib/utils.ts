// Format currency to Indonesian Rupiah
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format currency without symbol
export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('id-ID').format(amount);
};

// Format date to Indonesian locale
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Format time
export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format datetime
export const formatDateTime = (date: string | Date): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

// Calculate distance using Haversine formula
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

// Calculate ETA based on distance (assuming 20 km/h average speed)
export const calculateETA = (distanceKm: number): number => {
  return Math.ceil((distanceKm / 20) * 60);
};

// Get initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Format phone number for WhatsApp
export const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove all non-digit characters
  let phoneNumber = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (phoneNumber.startsWith('0')) {
    phoneNumber = '62' + phoneNumber.slice(1);
  } else if (!phoneNumber.startsWith('62')) {
    phoneNumber = '62' + phoneNumber;
  }
  
  return phoneNumber;
};

// Open WhatsApp with phone number
export const openWhatsApp = (phone: string, message?: string): string => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${formattedPhone}${encodedMessage}`;
};

// Open Google Maps directions
export const getGoogleMapsDirectionsUrl = (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): string => {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indonesian format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};
