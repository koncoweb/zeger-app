import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePOSAuth } from '@/hooks/usePOSAuth';
import { Loader2 } from 'lucide-react';

interface POSProtectedRouteProps {
  children: ReactNode;
}

export const POSProtectedRoute = ({ children }: POSProtectedRouteProps) => {
  const { user, profile, loading, isKasir } = usePOSAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !profile) {
    return <Navigate to="/pos-app/auth" state={{ from: location }} replace />;
  }

  // Check if user has kasir role
  const kasirRoles = ['bh_kasir', 'sb_kasir', '2_Hub_Kasir', '3_SB_Kasir'];
  if (!kasirRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 mb-6">
            Hanya kasir yang dapat mengakses aplikasi POS.
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user is active
  if (!profile.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akun Tidak Aktif</h2>
          <p className="text-gray-600 mb-6">
            Akun Anda tidak aktif. Silakan hubungi administrator.
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
};
