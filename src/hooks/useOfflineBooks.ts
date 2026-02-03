import { useState, useEffect, useCallback } from 'react';

const OFFLINE_BOOKS_KEY = 'maktaba-mauritania-offline-books';

export interface OfflineBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  fileData: string; // base64 encoded
  fileType: string;
  savedAt: string;
  fileSize: number;
}

export const useOfflineBooks = () => {
  const [offlineBooks, setOfflineBooks] = useState<OfflineBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOfflineBooks = useCallback(() => {
    try {
      const data = localStorage.getItem(OFFLINE_BOOKS_KEY);
      setOfflineBooks(data ? JSON.parse(data) : []);
    } catch {
      setOfflineBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfflineBooks();
  }, [loadOfflineBooks]);

  const saveBookOffline = async (
    book: {
      id: string;
      title: string;
      author: string;
      coverUrl: string;
      fileUrl: string;
      fileType: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<boolean> => {
    try {
      onProgress?.(10);
      
      // Fetch the file
      const response = await fetch(book.fileUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      
      onProgress?.(30);
      
      const blob = await response.blob();
      const fileSize = blob.size;
      
      onProgress?.(50);
      
      // Convert to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = 50 + (event.loaded / event.total) * 40;
            onProgress?.(progress);
          }
        };
        reader.onloadend = () => {
          try {
            const base64 = reader.result as string;
            
            // Get existing books
            const existingData = localStorage.getItem(OFFLINE_BOOKS_KEY);
            const existingBooks: OfflineBook[] = existingData ? JSON.parse(existingData) : [];
            
            // Remove if exists
            const filtered = existingBooks.filter((b) => b.id !== book.id);
            
            // Add new
            const newBook: OfflineBook = {
              id: book.id,
              title: book.title,
              author: book.author,
              coverUrl: book.coverUrl,
              fileData: base64,
              fileType: book.fileType,
              savedAt: new Date().toISOString(),
              fileSize,
            };
            
            const updated = [newBook, ...filtered];
            
            // Try to save
            try {
              localStorage.setItem(OFFLINE_BOOKS_KEY, JSON.stringify(updated));
              setOfflineBooks(updated);
              onProgress?.(100);
              resolve(true);
            } catch (storageError) {
              // Storage quota exceeded
              console.error('Storage quota exceeded:', storageError);
              resolve(false);
            }
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

  const getOfflineBook = (bookId: string): OfflineBook | null => {
    return offlineBooks.find((b) => b.id === bookId) || null;
  };

  const removeOfflineBook = (bookId: string): void => {
    try {
      const filtered = offlineBooks.filter((b) => b.id !== bookId);
      localStorage.setItem(OFFLINE_BOOKS_KEY, JSON.stringify(filtered));
      setOfflineBooks(filtered);
    } catch (error) {
      console.error('Error removing offline book:', error);
    }
  };

  const isBookOffline = (bookId: string): boolean => {
    return offlineBooks.some((b) => b.id === bookId);
  };

  const getOfflineBookUrl = (bookId: string): string | null => {
    const book = getOfflineBook(bookId);
    if (!book) return null;
    return book.fileData; // Returns the data URL directly
  };

  const getTotalStorageUsed = (): number => {
    return offlineBooks.reduce((total, book) => total + book.fileSize, 0);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    offlineBooks,
    isLoading,
    saveBookOffline,
    getOfflineBook,
    removeOfflineBook,
    isBookOffline,
    getOfflineBookUrl,
    getTotalStorageUsed,
    formatFileSize,
    refresh: loadOfflineBooks,
  };
};
