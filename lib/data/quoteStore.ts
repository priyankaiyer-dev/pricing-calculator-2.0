/**
 * Quote store: uses file-based persistence (mock database).
 * Quotes are saved to data/quotes.json and persist across server restarts.
 */

import { fileQuoteStore } from '@/lib/data/fileQuoteStore';

export const quoteStore = fileQuoteStore;
