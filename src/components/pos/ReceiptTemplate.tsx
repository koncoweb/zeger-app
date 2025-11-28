import { forwardRef } from 'react';
import { CartItem } from '@/lib/types';

export interface ReceiptData {
  transaction_number: string;
  branch_name: string;
  branch_address: string;
  transaction_date: Date;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  cash_received?: number;
  change?: number;
}

interface ReceiptTemplateProps {
  data: ReceiptData;
}

/**
 * ReceiptTemplate component for thermal printer (58mm or 80mm)
 * Designed to be printed using browser print API
 */
export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ data }, ref) => {
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const formatDate = (date: Date): string => {
      // Handle invalid dates
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    };

    return (
      <div
        ref={ref}
        className="receipt-template"
        style={{
          width: '80mm',
          fontFamily: 'monospace',
          fontSize: '12px',
          padding: '10mm',
          backgroundColor: 'white',
          color: 'black',
        }}
      >
        {/* Header - Logo and Branch Info */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#DC2626',
              marginBottom: '5px',
            }}
          >
            ZEGER
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '3px' }}>
            {data.branch_name}
          </div>
          <div style={{ fontSize: '11px', marginBottom: '3px' }}>
            {data.branch_address}
          </div>
          <div
            style={{
              borderTop: '1px dashed black',
              margin: '10px 0',
            }}
          />
        </div>

        {/* Transaction Info */}
        <div style={{ marginBottom: '10px', fontSize: '11px' }}>
          <div style={{ marginBottom: '3px' }}>
            <strong>No. Transaksi:</strong> {data.transaction_number}
          </div>
          <div>
            <strong>Tanggal:</strong> {formatDate(data.transaction_date)}
          </div>
        </div>

        <div
          style={{
            borderTop: '1px dashed black',
            margin: '10px 0',
          }}
        />

        {/* Items List */}
        <div style={{ marginBottom: '10px' }}>
          {data.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                {item.product_name}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                }}
              >
                <span>
                  {item.quantity} x {formatCurrency(item.unit_price)}
                </span>
                <span style={{ fontWeight: 'bold' }}>
                  {formatCurrency(item.total_price)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: '1px dashed black',
            margin: '10px 0',
          }}
        />

        {/* Totals */}
        <div style={{ marginBottom: '10px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '3px',
            }}
          >
            <span>Subtotal:</span>
            <span>{formatCurrency(data.subtotal)}</span>
          </div>
          {data.discount > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '3px',
              }}
            >
              <span>Diskon:</span>
              <span>-{formatCurrency(data.discount)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: 'bold',
              marginTop: '5px',
            }}
          >
            <span>TOTAL:</span>
            <span>{formatCurrency(data.total)}</span>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px dashed black',
            margin: '10px 0',
          }}
        />

        {/* Payment Info */}
        <div style={{ marginBottom: '10px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '3px',
            }}
          >
            <span>Metode Pembayaran:</span>
            <span style={{ fontWeight: 'bold' }}>{data.payment_method}</span>
          </div>
          {data.cash_received && (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '3px',
                }}
              >
                <span>Uang Diterima:</span>
                <span>{formatCurrency(data.cash_received)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Kembalian:</span>
                <span>{formatCurrency(data.change || 0)}</span>
              </div>
            </>
          )}
        </div>

        <div
          style={{
            borderTop: '1px dashed black',
            margin: '10px 0',
          }}
        />

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '10px' }}>
          <div style={{ marginBottom: '5px' }}>Terima kasih atas kunjungan Anda!</div>
          <div style={{ marginBottom: '5px' }}>Selamat menikmati pesanan Anda</div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            Struk ini adalah bukti pembayaran yang sah
          </div>
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';
