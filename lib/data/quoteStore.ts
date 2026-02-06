import { Quote } from '@/lib/types/quote';

// In-memory quote store (will be replaced with database later)
// Note: This resets on server restart in development mode
class QuoteStore {
  private quotes: Map<string, Quote> = new Map();
  private nextId = 1;

  constructor() {
    // Log when store is initialized/reset
    console.log('[QuoteStore] Initialized - quotes will be lost on server restart');
  }

  getAllQuotes(): Quote[] {
    const quotes = Array.from(this.quotes.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    console.log(`[QuoteStore] Getting all quotes - Total: ${quotes.length}`);
    return quotes;
  }

  getQuoteById(id: string): Quote | undefined {
    const quote = this.quotes.get(id);
    console.log(`[QuoteStore] Getting quote ${id} - Found: ${quote ? 'yes' : 'no'}, Total quotes: ${this.quotes.size}`);
    if (!quote) {
      console.log(`[QuoteStore] Available quote IDs:`, Array.from(this.quotes.keys()));
    }
    return quote;
  }

  createQuote(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Quote {
    const id = `quote-${this.nextId++}`;
    const now = new Date().toISOString();
    const newQuote: Quote = {
      ...quote,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.quotes.set(id, newQuote);
    console.log(`[QuoteStore] Created quote ${id} - Total quotes: ${this.quotes.size}`);
    return newQuote;
  }

  updateQuote(id: string, updates: Partial<Omit<Quote, 'id' | 'createdAt'>>): Quote | null {
    const existing = this.quotes.get(id);
    if (!existing) return null;

    const updated: Quote = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.quotes.set(id, updated);
    return updated;
  }

  deleteQuote(id: string): boolean {
    return this.quotes.delete(id);
  }

  duplicateQuote(id: string, createdBy: string): Quote | null {
    const original = this.quotes.get(id);
    if (!original) return null;

    const now = new Date().toISOString();
    const duplicated: Quote = {
      ...original,
      id: `quote-${this.nextId++}`,
      dealName: `${original.dealName} (Copy)`,
      createdAt: now,
      updatedAt: now,
      createdBy,
    };
    this.quotes.set(duplicated.id, duplicated);
    return duplicated;
  }
}

// Use global variable to persist across requests in Next.js
// In development, Next.js may reload modules, so we use a global to persist
declare global {
  // eslint-disable-next-line no-var
  var __quoteStoreInstance: QuoteStore | undefined;
}

// Create or reuse the global instance
// Use globalThis which works in both Node.js and browser environments
if (!globalThis.__quoteStoreInstance) {
  globalThis.__quoteStoreInstance = new QuoteStore();
  console.log('[QuoteStore] Created new global instance');
} else {
  console.log('[QuoteStore] Reusing existing global instance');
}

export const quoteStore = globalThis.__quoteStoreInstance;
