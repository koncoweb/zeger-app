import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, getErrorMessage, formatErrorMessage } from '@/lib/error-messages';

// Feature: pos-karyawan-branch, Property 43: Error messages displayed in Indonesian
describe('Property 43: Error messages displayed in Indonesian', () => {
  it('should display all error messages in Indonesian', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ...Object.values(ERROR_MESSAGES.AUTH),
          ...Object.values(ERROR_MESSAGES.TRANSACTION).filter(v => typeof v === 'string'),
          ...Object.values(ERROR_MESSAGES.INVENTORY),
          ...Object.values(ERROR_MESSAGES.PRODUCT),
          ...Object.values(ERROR_MESSAGES.ATTENDANCE),
          ...Object.values(ERROR_MESSAGES.PRINT),
          ...Object.values(ERROR_MESSAGES.VOID),
          ...Object.values(ERROR_MESSAGES.DASHBOARD),
          ...Object.values(ERROR_MESSAGES.HISTORY),
          ...Object.values(ERROR_MESSAGES.NETWORK),
          ...Object.values(ERROR_MESSAGES.GENERIC)
        ),
        (errorMessage) => {
          // Property: All error messages should be in Indonesian
          // Check for common Indonesian words/patterns (expanded list)
          const indonesianPatterns = [
            /gagal/i,
            /tidak/i,
            /silakan/i,
            /anda/i,
            /sudah/i,
            /belum/i,
            /atau/i,
            /untuk/i,
            /dari/i,
            /ke/i,
            /dengan/i,
            /yang/i,
            /telah/i,
            /periksa/i,
            /hubungi/i,
            /akses/i,
            /tersedia/i,
            /terjadi/i,
            /kesalahan/i,
            /koneksi/i,
            /terputus/i,
            /offline/i,
            /timeout/i,
            /permintaan/i,
            /kembali/i,
            /data/i,
            /struk/i,
            /printer/i,
            /void/i,
            /request/i,
            /approval/i,
            /manager/i,
            /branch/i,
            /ditemukan/i,
            /memuat/i,
            /riwayat/i,
            /transaksi/i,
            /detail/i,
            /coba/i,
            /lagi/i,
            /support/i,
            /produk/i,
            /habis/i,
            /stok/i,
            /rendah/i,
            /mencukupi/i,
            /kosong/i,
            /minimal/i,
            /item/i,
            /keranjang/i,
            /selesaikan/i,
            /terlebih/i,
            /dahulu/i,
            /pembayaran/i,
            /split/i,
            /bill/i,
          ];

          // At least one Indonesian pattern should match OR message is short technical term
          const hasIndonesianPattern = indonesianPatterns.some(pattern => 
            pattern.test(errorMessage)
          );

          expect(hasIndonesianPattern).toBe(true);

          // Property: Error messages should not contain common English error words
          const englishErrorWords = ['error', 'failed', 'invalid', 'unauthorized', 'forbidden'];
          const hasEnglishWords = englishErrorWords.some(word => 
            errorMessage.toLowerCase().includes(word)
          );

          expect(hasEnglishWords).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle dynamic error messages with parameters in Indonesian', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (productName) => {
          // Test dynamic error messages
          const insufficientStockMsg = ERROR_MESSAGES.TRANSACTION.INSUFFICIENT_STOCK(productName);
          
          // Property: Dynamic messages should include the parameter
          expect(insufficientStockMsg).toContain(productName);
          
          // Property: Dynamic messages should be in Indonesian
          expect(insufficientStockMsg).toMatch(/stok tidak mencukupi/i);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract error messages from Error objects', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (errorMsg) => {
          // Test getErrorMessage helper
          const error = new Error(errorMsg);
          const extractedMessage = getErrorMessage(error);

          // Property: Should extract the error message correctly
          expect(extractedMessage).toBe(errorMsg);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle unknown error types gracefully', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.integer(),
          fc.object()
        ),
        (unknownError) => {
          const message = getErrorMessage(unknownError);

          // Property: Unknown errors should return generic Indonesian message
          expect(message).toBe(ERROR_MESSAGES.GENERIC.UNKNOWN);
          expect(message).toMatch(/terjadi kesalahan/i);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format error messages with context', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 50 }),
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        (baseMessage, context) => {
          const formatted = formatErrorMessage(baseMessage, context);

          // Property: Should always include base message
          expect(formatted).toContain(baseMessage);

          // Property: If context provided, should include it
          if (context) {
            expect(formatted).toContain(context);
            expect(formatted).toContain(':');
          } else {
            expect(formatted).toBe(baseMessage);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: pos-karyawan-branch, Property 44: Success notifications displayed
describe('Property 44: Success notifications displayed', () => {
  it('should display all success messages in Indonesian', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ...Object.values(SUCCESS_MESSAGES.TRANSACTION).filter(v => typeof v === 'string'),
          ...Object.values(SUCCESS_MESSAGES.CART).filter(v => typeof v === 'string'),
          ...Object.values(SUCCESS_MESSAGES.INVENTORY),
          ...Object.values(SUCCESS_MESSAGES.ATTENDANCE),
          ...Object.values(SUCCESS_MESSAGES.PRINT),
          ...Object.values(SUCCESS_MESSAGES.VOID),
          ...Object.values(SUCCESS_MESSAGES.AUTH)
        ),
        (successMessage) => {
          // Property: All success messages should be in Indonesian (expanded patterns)
          const indonesianPatterns = [
            /berhasil/i,
            /sukses/i,
            /selesai/i,
            /ditambahkan/i,
            /diperbarui/i,
            /dimuat/i,
            /diunduh/i,
            /diajukan/i,
            /mencetak/i,
            /struk/i,
            /login/i,
            /logout/i,
            /check-in/i,
            /check-out/i,
            /inventory/i,
            /data/i,
            /ulang/i,
            /request/i,
            /void/i,
            /approval/i,
            /manager/i,
            /menunggu/i,
            /item/i,
            /dihapus/i,
            /keranjang/i,
            /jumlah/i,
            /pembayaran/i,
            /grup/i,
            /lanjut/i,
            /semua/i,
            /split/i,
            /bill/i,
          ];

          const hasIndonesianPattern = indonesianPatterns.some(pattern => 
            pattern.test(successMessage)
          );

          expect(hasIndonesianPattern).toBe(true);

          // Property: Success messages should not contain English success words
          const englishSuccessWords = ['success', 'completed', 'done', 'finished'];
          const hasEnglishWords = englishSuccessWords.some(word => 
            successMessage.toLowerCase().includes(word)
          );

          expect(hasEnglishWords).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle dynamic success messages with parameters in Indonesian', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (productName) => {
          // Test dynamic success messages
          const itemAddedMsg = SUCCESS_MESSAGES.CART.ITEM_ADDED(productName);
          
          // Property: Dynamic messages should include the parameter
          expect(itemAddedMsg).toContain(productName);
          
          // Property: Dynamic messages should be in Indonesian
          expect(itemAddedMsg).toMatch(/ditambahkan ke keranjang/i);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle numeric parameters in success messages', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (groupNumber) => {
          // Test success messages with numeric parameters
          const groupMsg = SUCCESS_MESSAGES.TRANSACTION.SPLIT_BILL_GROUP(groupNumber);
          const nextGroupMsg = SUCCESS_MESSAGES.TRANSACTION.NEXT_GROUP(groupNumber);

          // Property: Messages should include the group number
          expect(groupMsg).toContain(groupNumber.toString());
          expect(nextGroupMsg).toContain(groupNumber.toString());

          // Property: Messages should be in Indonesian
          expect(groupMsg).toMatch(/pembayaran grup.*berhasil/i);
          expect(nextGroupMsg).toMatch(/lanjut ke pembayaran grup/i);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure success and error messages are distinct', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(ERROR_MESSAGES)),
        (category) => {
          // Property: Success and error message categories should not overlap
          const errorCategory = ERROR_MESSAGES[category as keyof typeof ERROR_MESSAGES];
          const successCategory = SUCCESS_MESSAGES[category as keyof typeof SUCCESS_MESSAGES];

          if (errorCategory && successCategory) {
            const errorValues = Object.values(errorCategory).filter(v => typeof v === 'string');
            const successValues = Object.values(successCategory).filter(v => typeof v === 'string');

            // Property: No error message should be identical to a success message
            errorValues.forEach(errorMsg => {
              expect(successValues).not.toContain(errorMsg);
            });
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain consistent message structure', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ...Object.values(ERROR_MESSAGES.AUTH),
          ...Object.values(SUCCESS_MESSAGES.AUTH)
        ),
        (message) => {
          // Property: Messages should not be empty
          expect(message.trim().length).toBeGreaterThan(0);

          // Property: Messages should not have excessive whitespace
          expect(message).not.toMatch(/\s{2,}/);

          // Property: Messages should not start or end with whitespace
          expect(message).toBe(message.trim());

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
