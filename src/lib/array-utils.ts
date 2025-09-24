/**
 * Splits an array into chunks of specified size
 * Used to avoid large payload issues with Supabase queries
 */
export const chunkArray = <T>(array: T[], chunkSize: number = 150): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Processes data in batches to avoid overwhelming the database
 */
export const processBatches = async <TInput, TOutput>(
  items: TInput[],
  processFn: (batch: TInput[]) => Promise<TOutput[]>,
  batchSize: number = 150
): Promise<TOutput[]> => {
  const chunks = chunkArray(items, batchSize);
  const results: TOutput[] = [];
  
  for (const chunk of chunks) {
    const batchResult = await processFn(chunk);
    results.push(...batchResult);
  }
  
  return results;
};