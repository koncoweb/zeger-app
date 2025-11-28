import { useRef, useCallback } from 'react';
import jsPDF from 'jspdf';

interface UsePrintReturn {
  printRef: React.RefObject<HTMLDivElement>;
  handlePrint: () => void;
  handleDownloadPDF: () => void;
}

/**
 * Custom hook for printing receipts
 * Provides browser print API integration with PDF fallback
 */
export const usePrint = (documentTitle: string = 'Receipt'): UsePrintReturn => {
  const printRef = useRef<HTMLDivElement>(null);

  /**
   * Print using browser print API
   * Falls back to PDF download if print is not available
   */
  const handlePrint = useCallback(() => {
    if (!printRef.current) {
      console.error('Print ref not available');
      return;
    }

    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        // If popup is blocked, fallback to PDF
        console.warn('Print window blocked, falling back to PDF download');
        handleDownloadPDF();
        return;
      }

      // Get the content to print
      const content = printRef.current.innerHTML;

      // Write the content to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${documentTitle}</title>
            <style>
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
              }
              body {
                font-family: monospace;
                margin: 0;
                padding: 0;
              }
              .receipt-template {
                width: 80mm;
                padding: 10mm;
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);

      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        
        // Close the window after printing (or if user cancels)
        // Small delay to ensure print dialog has opened
        setTimeout(() => {
          printWindow.close();
        }, 100);
      };
    } catch (error) {
      console.error('Print error:', error);
      // Fallback to PDF download
      handleDownloadPDF();
    }
  }, [documentTitle]);

  /**
   * Download receipt as PDF
   * Fallback when printer is not available
   */
  const handleDownloadPDF = useCallback(() => {
    if (!printRef.current) {
      console.error('Print ref not available');
      return;
    }

    try {
      // Create PDF with thermal printer dimensions (80mm width)
      // 80mm = ~226 pixels at 72 DPI, convert to points (1 point = 1/72 inch)
      const mmToPt = 2.83465; // conversion factor
      const widthMm = 80;
      const widthPt = widthMm * mmToPt;
      
      // Get the height of the content
      const contentHeight = printRef.current.scrollHeight;
      const heightPt = (contentHeight / 96) * 72; // Convert pixels to points (96 DPI to 72 DPI)

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [widthPt, Math.max(heightPt, 200)], // Minimum height of 200pt
      });

      // Convert HTML to PDF
      pdf.html(printRef.current, {
        callback: (doc) => {
          doc.save(`${documentTitle}.pdf`);
        },
        x: 0,
        y: 0,
        width: widthPt,
        windowWidth: printRef.current.scrollWidth,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    }
  }, [documentTitle]);

  return {
    printRef,
    handlePrint,
    handleDownloadPDF,
  };
};
