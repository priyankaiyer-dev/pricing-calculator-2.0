/**
 * File-based quote store (mock database).
 * Persists quotes to data/quotes.json so they survive server restarts.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Quote } from '@/lib/types/quote';

const DATA_DIR = join(process.cwd(), 'data');
const QUOTES_FILE = join(DATA_DIR, 'quotes.json');

interface PersistedData {
  quotes: Quote[];
  nextId: number;
}

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load(): PersistedData {
  ensureDataDir();
  if (!existsSync(QUOTES_FILE)) {
    return { quotes: [], nextId: 1 };
  }
  try {
    const raw = readFileSync(QUOTES_FILE, 'utf-8');
    const data = JSON.parse(raw) as PersistedData;
    if (!Array.isArray(data.quotes)) data.quotes = [];
    if (typeof data.nextId !== 'number') {
      const max = data.quotes.reduce((m, q) => {
        const n = parseInt(q.id.replace(/\D/g, ''), 10);
        return isNaN(n) ? m : Math.max(m, n);
      }, 0);
      data.nextId = max + 1;
    }
    return data;
  } catch {
    return { quotes: [], nextId: 1 };
  }
}

function save(data: PersistedData): void {
  ensureDataDir();
  writeFileSync(QUOTES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

class FileQuoteStore {
  getAllQuotes(): Quote[] {
    const { quotes } = load();
    return [...quotes].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getQuoteById(id: string): Quote | undefined {
    const { quotes } = load();
    return quotes.find((q) => q.id === id);
  }

  createQuote(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Quote {
    const data = load();
    const id = `quote-${data.nextId++}`;
    const now = new Date().toISOString();
    const newQuote: Quote = {
      ...quote,
      id,
      createdAt: now,
      updatedAt: now,
    };
    data.quotes.push(newQuote);
    save(data);
    return newQuote;
  }

  updateQuote(id: string, updates: Partial<Omit<Quote, 'id' | 'createdAt'>>): Quote | null {
    const data = load();
    const index = data.quotes.findIndex((q) => q.id === id);
    if (index === -1) return null;
    const updated: Quote = {
      ...data.quotes[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    data.quotes[index] = updated;
    save(data);
    return updated;
  }

  deleteQuote(id: string): boolean {
    const data = load();
    const index = data.quotes.findIndex((q) => q.id === id);
    if (index === -1) return false;
    data.quotes.splice(index, 1);
    save(data);
    return true;
  }

  duplicateQuote(id: string, createdBy: string): Quote | null {
    const data = load();
    const original = data.quotes.find((q) => q.id === id);
    if (!original) return null;
    const newId = `quote-${data.nextId++}`;
    const now = new Date().toISOString();
    const duplicated: Quote = {
      ...original,
      id: newId,
      dealName: `${original.dealName} (Copy)`,
      createdAt: now,
      updatedAt: now,
      createdBy,
    };
    data.quotes.push(duplicated);
    save(data);
    return duplicated;
  }
}

export const fileQuoteStore = new FileQuoteStore();
