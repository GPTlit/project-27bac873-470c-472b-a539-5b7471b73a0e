import { ReadingHistoryItem, DownloadedBook } from './types';

const READING_HISTORY_KEY = 'maktaba-mauritania-history';
const DOWNLOADS_KEY = 'maktaba-mauritania-downloads';
const OFFLINE_BOOKS_KEY = 'maktaba-mauritania-offline';

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
    // Also remove from offline storage
    removeOfflineBook(bookId);
  } catch (error) {
    console.error('Error removing download:', error);
  }
};

export const clearDownloads = (): void => {
  localStorage.removeItem(DOWNLOADS_KEY);
  localStorage.removeItem(OFFLINE_BOOKS_KEY);
};

// Offline book storage using base64 encoding
interface OfflineBook {
  bookId: string;
  title: string;
  author: string;
  coverUrl: string;
  fileData: string; // base64 encoded file
  fileType: string;
  savedAt: string;
}

export const getOfflineBooks = (): OfflineBook[] => {
  try {
    const data = localStorage.getItem(OFFLINE_BOOKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveBookOffline = async (
  bookId: string,
  title: string,
  author: string,
  coverUrl: string,
  fileUrl: string,
  fileType: string = 'pdf'
): Promise<boolean> => {
  try {
    // Fetch the file
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error('Failed to fetch file');
    
    const blob = await response.blob();
    
    // Convert to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64 = reader.result as string;
          const offlineBooks = getOfflineBooks();
          
          // Remove if exists
          const filtered = offlineBooks.filter((b) => b.bookId !== bookId);
          
          // Add new
          const newBook: OfflineBook = {
            bookId,
            title,
            author,
            coverUrl,
            fileData: base64,
            fileType,
            savedAt: new Date().toISOString(),
          };
          
          const updated = [newBook, ...filtered];
          localStorage.setItem(OFFLINE_BOOKS_KEY, JSON.stringify(updated));
          
          // Also add to downloads list
          addToDownloads({
            bookId,
            title,
            author,
            coverUrl,
            pdfUrl: fileUrl,
            downloadedAt: new Date().toISOString(),
          });
          
          resolve(true);
        } catch (error) {
          console.error('Error saving offline book:', error);
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error downloading book for offline:', error);
    return false;
  }
};

export const getOfflineBook = (bookId: string): OfflineBook | null => {
  const books = getOfflineBooks();
  return books.find((b) => b.bookId === bookId) || null;
};

export const removeOfflineBook = (bookId: string): void => {
  try {
    const books = getOfflineBooks();
    const filtered = books.filter((b) => b.bookId !== bookId);
    localStorage.setItem(OFFLINE_BOOKS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing offline book:', error);
  }
};

export const isBookAvailableOffline = (bookId: string): boolean => {
  const books = getOfflineBooks();
  return books.some((b) => b.bookId === bookId);
};

export const openOfflineBook = (bookId: string): void => {
  const book = getOfflineBook(bookId);
  if (book) {
    // Create a blob URL from the base64 data
    const byteString = atob(book.fileData.split(',')[1]);
    const mimeType = book.fileData.split(';')[0].split(':')[1];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    // Open in new tab
    window.open(url, '_blank');
  }
};
