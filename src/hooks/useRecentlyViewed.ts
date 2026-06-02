import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'recently_viewed_books';
const MAX = 20;

const read = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export const trackRecentlyViewed = (bookId: string) => {
  if (!bookId) return;
  const current = read().filter((id) => id !== bookId);
  current.unshift(bookId);
  const next = current.slice(0, MAX);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('recently-viewed-updated'));
  } catch {}
};

export const useRecentlyViewedIds = () => {
  const [ids, setIds] = useState<string[]>(() => read());
  useEffect(() => {
    const handler = () => setIds(read());
    window.addEventListener('recently-viewed-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('recently-viewed-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  return ids;
};

export const useClearRecentlyViewed = () => {
  return useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('recently-viewed-updated'));
  }, []);
};
