import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { TransactionHistory } from '@/components/pos/TransactionHistory';
import { TransactionDetail } from '@/components/pos/TransactionDetail';

export const POSHistory = () => {
  const navigate = useNavigate();
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedTransactionId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      {/* Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/pos-app/dashboard')}
              className="text-white hover:bg-red-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="border-red-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-600">Daftar Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionHistory onSelectTransaction={handleSelectTransaction} />
          </CardContent>
        </Card>
      </main>

      {/* Transaction Detail Dialog */}
      <TransactionDetail
        transactionId={selectedTransactionId}
        open={detailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
};
