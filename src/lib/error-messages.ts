/**
 * Standardized error messages in Indonesian for the POS application
 * Ensures consistent error messaging across the application
 */

export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH: {
    INVALID_CREDENTIALS: 'Email atau password salah',
    SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan login kembali',
    UNAUTHORIZED: 'Anda tidak memiliki akses ke halaman ini',
    NETWORK_ERROR: 'Gagal terhubung ke server. Periksa koneksi internet Anda',
    LOGOUT_FAILED: 'Gagal logout',
  },

  // Transaction errors
  TRANSACTION: {
    EMPTY_CART: 'Keranjang kosong',
    INSUFFICIENT_STOCK: (productName: string) => `Stok tidak mencukupi untuk ${productName}`,
    PAYMENT_FAILED: 'Gagal memproses pembayaran',
    SAVE_FAILED: 'Gagal menyimpan transaksi. Silakan coba lagi',
    INVALID_PAYMENT: 'Jumlah pembayaran tidak valid',
    SPLIT_BILL_MIN_ITEMS: 'Minimal 2 item untuk split bill',
    SPLIT_BILL_INCOMPLETE: 'Selesaikan pembayaran split bill terlebih dahulu',
  },

  // Inventory errors
  INVENTORY: {
    LOAD_FAILED: 'Gagal memuat inventory',
    UPDATE_FAILED: 'Gagal memperbarui stok',
    OUT_OF_STOCK: 'Produk habis',
    LOW_STOCK: 'Stok produk rendah',
  },

  // Product errors
  PRODUCT: {
    LOAD_FAILED: 'Gagal memuat produk',
    NOT_FOUND: 'Produk tidak ditemukan',
    NOT_AVAILABLE: 'Produk tidak tersedia',
  },

  // Attendance errors
  ATTENDANCE: {
    CHECKIN_FAILED: 'Gagal check-in',
    CHECKOUT_FAILED: 'Gagal check-out',
    ALREADY_CHECKEDIN: 'Anda sudah melakukan check-in hari ini',
    NOT_CHECKEDIN: 'Anda belum melakukan check-in',
    LOCATION_DENIED: 'Akses lokasi ditolak. Izinkan akses lokasi untuk melanjutkan',
    LOCATION_UNAVAILABLE: 'Lokasi tidak tersedia',
  },

  // Print errors
  PRINT: {
    NO_DATA: 'Data struk tidak tersedia',
    FAILED: 'Gagal mencetak struk. Mencoba download PDF...',
    PRINTER_UNAVAILABLE: 'Printer tidak tersedia',
  },

  // Void errors
  VOID: {
    ALREADY_VOIDED: 'Transaksi sudah di-void',
    REQUEST_FAILED: 'Gagal membuat request void',
    PENDING_APPROVAL: 'Request void menunggu approval dari manager',
  },

  // Dashboard errors
  DASHBOARD: {
    LOAD_FAILED: 'Gagal memuat data dashboard',
    BRANCH_NOT_FOUND: 'Branch tidak ditemukan',
  },

  // History errors
  HISTORY: {
    LOAD_FAILED: 'Gagal memuat riwayat transaksi',
    DETAIL_LOAD_FAILED: 'Gagal memuat detail transaksi',
  },

  // Network errors
  NETWORK: {
    TIMEOUT: 'Permintaan timeout. Silakan coba lagi',
    CONNECTION_LOST: 'Koneksi terputus',
    OFFLINE: 'Anda sedang offline',
    RECONNECTED: 'Koneksi kembali',
  },

  // Generic errors
  GENERIC: {
    UNKNOWN: 'Terjadi kesalahan yang tidak terduga',
    TRY_AGAIN: 'Silakan coba lagi',
    CONTACT_SUPPORT: 'Jika masalah berlanjut, hubungi tim support',
  },
} as const;

export const SUCCESS_MESSAGES = {
  // Transaction success
  TRANSACTION: {
    COMPLETED: 'Transaksi berhasil disimpan',
    SPLIT_BILL_COMPLETED: 'Semua pembayaran split bill berhasil!',
    SPLIT_BILL_GROUP: (groupNumber: number) => `Pembayaran grup ${groupNumber} berhasil`,
    NEXT_GROUP: (groupNumber: number) => `Lanjut ke pembayaran grup ${groupNumber}`,
  },

  // Cart success
  CART: {
    ITEM_ADDED: (productName: string) => `${productName} ditambahkan ke keranjang`,
    ITEM_REMOVED: 'Item dihapus dari keranjang',
    ITEM_UPDATED: 'Jumlah item diperbarui',
  },

  // Inventory success
  INVENTORY: {
    UPDATED: 'Inventory berhasil diperbarui',
    REFRESHED: 'Data inventory berhasil dimuat ulang',
  },

  // Attendance success
  ATTENDANCE: {
    CHECKIN: 'Berhasil check-in!',
    CHECKOUT: 'Berhasil check-out!',
  },

  // Print success
  PRINT: {
    PRINTING: 'Mencetak struk...',
    DOWNLOADED: 'Struk berhasil diunduh',
  },

  // Void success
  VOID: {
    REQUEST_CREATED: 'Request void berhasil diajukan dan menunggu approval dari manager',
  },

  // Auth success
  AUTH: {
    LOGIN: 'Login berhasil',
    LOGOUT: 'Logout berhasil',
  },
} as const;

/**
 * Helper function to get error message from Error object
 * Falls back to generic error message if no specific message is available
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return ERROR_MESSAGES.GENERIC.UNKNOWN;
}

/**
 * Helper function to format error message with additional context
 */
export function formatErrorMessage(baseMessage: string, context?: string): string {
  if (context) {
    return `${baseMessage}: ${context}`;
  }
  return baseMessage;
}
