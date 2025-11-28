import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component untuk menangkap error React
 * Menampilkan UI fallback yang user-friendly dalam bahasa Indonesia
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state sehingga render berikutnya akan menampilkan fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error ke console untuk debugging
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Di production, bisa kirim error ke error tracking service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Jika ada custom fallback, gunakan itu
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI dalam bahasa Indonesia
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-6 h-6" />
                Terjadi Kesalahan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <p className="text-gray-700">
                  Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi administrator jika masalah berlanjut.
                </p>
                
                {this.state.error && (
                  <div className="bg-gray-100 rounded-lg p-4 mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Detail Error:
                    </p>
                    <p className="text-sm text-gray-600 font-mono">
                      {this.state.error.message}
                    </p>
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                      Stack Trace (Development Only)
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Muat Ulang Halaman
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center pt-2">
                Jika masalah terus berlanjut, silakan hubungi tim support
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
