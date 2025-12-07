import { ReadingHistoryItem, DownloadedBook } from './types';

const READING_HISTORY_KEY = 'maktaba-mauritania-history';
const DOWNLOADS_KEY = 'maktaba-mauritania-downloads';

export const getReadingHistory = (): ReadingHistoryItem[] => {
  try {
    const data = localStorage.getItem(READING_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addToReadingHistory = (item: ReadingHistoryItem): void => {
  try {
    const history = getReadingHistory();
    const filtered = history.filter((h) => h.bookId !== item.bookId);
    const updated = [{ ...item, lastRead: new Date().toISOString() }, ...filtered].slice(0, 50);
    localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving reading history:', error);
  }
};

export const clearReadingHistory = (): void => {
  localStorage.removeItem(READING_HISTORY_KEY);
};

export const getDownloads = (): DownloadedBook[] => {
  try {
    const data = localStorage.getItem(DOWNLOADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addToDownloads = (item: DownloadedBook): void => {
  try {
    const downloads = getDownloads();
    const exists = downloads.find((d) => d.bookId === item.bookId);
    if (!exists) {
      const updated = [{ ...item, downloadedAt: new Date().toISOString() }, ...downloads];
      localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Error saving download:', error);
  }
};

export const removeFromDownloads = (bookId: string): void => {
  try {
    const downloads = getDownloads();
    const filtered = downloads.filter((d) => d.bookId !== bookId);
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing download:', error);
  }
};

export const clearDownloads = (): void => {
  localStorage.removeItem(DOWNLOADS_KEY);
};
