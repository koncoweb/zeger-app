import { describe, it, expect, vi } from 'vitest';
import { chunkArray, processBatches } from './array-utils';

describe('Array Utils', () => {
  describe('chunkArray', () => {
    it('should split array into chunks of specified size', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const chunks = chunkArray(array, 3);
      
      expect(chunks).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10]
      ]);
    });

    it('should handle empty array', () => {
      const array: number[] = [];
      const chunks = chunkArray(array, 5);
      
      expect(chunks).toEqual([]);
    });

    it('should handle array smaller than chunk size', () => {
      const array = [1, 2, 3];
      const chunks = chunkArray(array, 10);
      
      expect(chunks).toEqual([[1, 2, 3]]);
    });

    it('should handle array equal to chunk size', () => {
      const array = [1, 2, 3, 4, 5];
      const chunks = chunkArray(array, 5);
      
      expect(chunks).toEqual([[1, 2, 3, 4, 5]]);
    });

    it('should use default chunk size of 150', () => {
      const array = Array.from({ length: 300 }, (_, i) => i);
      const chunks = chunkArray(array);
      
      expect(chunks.length).toBe(2);
      expect(chunks[0].length).toBe(150);
      expect(chunks[1].length).toBe(150);
    });

    it('should handle chunk size of 1', () => {
      const array = [1, 2, 3];
      const chunks = chunkArray(array, 1);
      
      expect(chunks).toEqual([[1], [2], [3]]);
    });

    it('should work with different data types', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      const chunks = chunkArray(array, 2);
      
      expect(chunks).toEqual([
        ['a', 'b'],
        ['c', 'd'],
        ['e']
      ]);
    });
  });

  describe('processBatches', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const processFn = vi.fn(async (batch: number[]) => {
        return batch.map(n => n * 2);
      });

      const result = await processBatches(items, processFn, 3);

      expect(result).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
      expect(processFn).toHaveBeenCalledTimes(4); // 3+3+3+1
    });

    it('should handle empty array', async () => {
      const items: number[] = [];
      const processFn = vi.fn(async (batch: number[]) => batch);

      const result = await processBatches(items, processFn, 5);

      expect(result).toEqual([]);
      expect(processFn).not.toHaveBeenCalled();
    });

    it('should handle single batch', async () => {
      const items = [1, 2, 3];
      const processFn = vi.fn(async (batch: number[]) => {
        return batch.map(n => n + 10);
      });

      const result = await processBatches(items, processFn, 10);

      expect(result).toEqual([11, 12, 13]);
      expect(processFn).toHaveBeenCalledTimes(1);
    });

    it('should use default batch size of 150', async () => {
      const items = Array.from({ length: 300 }, (_, i) => i);
      const processFn = vi.fn(async (batch: number[]) => batch);

      await processBatches(items, processFn);

      expect(processFn).toHaveBeenCalledTimes(2);
    });

    it('should handle async processing correctly', async () => {
      const items = [1, 2, 3, 4];
      const processFn = async (batch: number[]) => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));
        return batch.map(n => n * 3);
      };

      const result = await processBatches(items, processFn, 2);

      expect(result).toEqual([3, 6, 9, 12]);
    });

    it('should preserve order of results', async () => {
      const items = ['a', 'b', 'c', 'd', 'e'];
      const processFn = async (batch: string[]) => {
        return batch.map(s => s.toUpperCase());
      };

      const result = await processBatches(items, processFn, 2);

      expect(result).toEqual(['A', 'B', 'C', 'D', 'E']);
    });
  });
});
