import { useState, useEffect, useCallback } from 'react';

const OFFLINE_BOOKS_KEY = 'maktaba-mauritania-offline-books';
const OFFLINE_INDEX_KEY = 'maktaba-mauritania-offline-index';
const OFFLINE_DIR = 'offline-books';

// Detect Capacitor native runtime
const isNative = (): boolean => {
  try {
    // @ts-ignore
    return !!(window as any)?.Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

// Lazy-loaded Capacitor Filesystem module
let _fs: any = null;
const getFs = async () => {
  if (_fs) return _fs;
  try {
    const mod = await import('@capacitor/filesystem');
    _fs = mod;
    return mod;
  } catch {
    return null;
  }
};

export interface OfflineBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  fileData: string; // base64 data URL (web) OR blob:/file URL (native)
  fileType: string;
  savedAt: string;
  fileSize: number;
}

interface NativeIndexEntry {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  fileType: string;
  savedAt: string;
  fileSize: number;
  filename: string; // path inside OFFLINE_DIR in Directory.Data
  mimeType: string;
}

const loadNativeIndex = (): NativeIndexEntry[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveNativeIndex = (entries: NativeIndexEntry[]) => {
  localStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(entries));
};

// Resolve a native file to a usable URL for the WebView (blob: URL).
const nativeFileToBlobUrl = async (filename: string, mimeType: string): Promise<string | null> => {
  const fs = await getFs();
  if (!fs) return null;
  try {
    const res = await fs.Filesystem.readFile({
      path: `${OFFLINE_DIR}/${filename}`,
      directory: fs.Directory.Data,
    });
    const base64 = typeof res.data === 'string' ? res.data : '';
    if (!base64) return null;
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return URL.createObjectURL(new Blob([ab], { type: mimeType }));
  } catch (e) {
    console.error('Failed to read offline file', filename, e);
    return null;
  }
};

export const useOfflineBooks = () => {
  const [offlineBooks, setOfflineBooks] = useState<OfflineBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // For native: id -> blob URL (created from Filesystem read)
  const [nativeUrls, setNativeUrls] = useState<Record<string, string>>({});

  const loadOfflineBooks = useCallback(async () => {
    try {
      if (isNative()) {
        // Ensure dir exists (best effort)
        const fs = await getFs();
        if (fs) {
          try {
            await fs.Filesystem.mkdir({
              path: OFFLINE_DIR,
              directory: fs.Directory.Data,
              recursive: true,
            });
          } catch {/* exists */}
        }
        const index = loadNativeIndex();
        // Build placeholder list (URLs filled lazily / below)
        const list: OfflineBook[] = index.map((e) => ({
          id: e.id,
          title: e.title,
          author: e.author,
          coverUrl: e.coverUrl,
          fileData: '', // resolved below to blob URL
          fileType: e.fileType,
          savedAt: e.savedAt,
          fileSize: e.fileSize,
        }));
        setOfflineBooks(list);

        // Resolve blob URLs in background
        const urlMap: Record<string, string> = {};
        await Promise.all(
          index.map(async (e) => {
            const url = await nativeFileToBlobUrl(e.filename, e.mimeType);
            if (url) urlMap[e.id] = url;
          })
        );
        setNativeUrls(urlMap);
      } else {
        const data = localStorage.getItem(OFFLINE_BOOKS_KEY);
        setOfflineBooks(data ? JSON.parse(data) : []);
      }
    } catch {
      setOfflineBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfflineBooks();
    // Cleanup blob URLs on unmount
    return () => {
      Object.values(nativeUrls).forEach((u) => {
        try { URL.revokeObjectURL(u); } catch {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const mimeType = blob.type || 'application/pdf';

      onProgress?.(50);

      // Native path: write to private app sandbox via Capacitor Filesystem.
      // Files in Directory.Data are NOT visible in the device's gallery / file
      // manager — they live in the app's internal storage and are only
      // accessible from inside the app.
      if (isNative()) {
        const fs = await getFs();
        if (!fs) {
          console.warn('Capacitor Filesystem not available, falling back to localStorage');
        } else {
          // Convert blob -> base64 (no data: prefix) for Filesystem.writeFile
          const base64 = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onloadend = () => {
              const result = r.result as string;
              const idx = result.indexOf(',');
              resolve(idx >= 0 ? result.slice(idx + 1) : result);
            };
            r.onerror = () => reject(r.error);
            r.readAsDataURL(blob);
          });
          onProgress?.(75);
          try {
            await fs.Filesystem.mkdir({
              path: OFFLINE_DIR,
              directory: fs.Directory.Data,
              recursive: true,
            });
          } catch {/* exists */}
          // Hidden-style filename (UUID, no human-readable title) so even if
          // the user browses internal storage there's nothing recognizable.
          const filename = `.${book.id}.bin`;
          await fs.Filesystem.writeFile({
            path: `${OFFLINE_DIR}/${filename}`,
            data: base64,
            directory: fs.Directory.Data,
          });
          // Update index
          const index = loadNativeIndex().filter((e) => e.id !== book.id);
          const entry: NativeIndexEntry = {
            id: book.id,
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl,
            fileType: book.fileType,
            savedAt: new Date().toISOString(),
            fileSize,
            filename,
            mimeType,
          };
          saveNativeIndex([entry, ...index]);

          // Refresh state + register blob URL
          const url = await nativeFileToBlobUrl(filename, mimeType);
          setOfflineBooks((prev) => {
            const filtered = prev.filter((b) => b.id !== book.id);
            return [
              {
                id: book.id,
                title: book.title,
                author: book.author,
                coverUrl: book.coverUrl,
                fileData: '',
                fileType: book.fileType,
                savedAt: entry.savedAt,
                fileSize,
              },
              ...filtered,
            ];
          });
          if (url) setNativeUrls((prev) => ({ ...prev, [book.id]: url }));
          onProgress?.(100);
          return true;
        }
      }
      
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
