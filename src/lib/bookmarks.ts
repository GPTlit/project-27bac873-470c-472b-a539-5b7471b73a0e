export interface Bookmark {
  id: string;
  bookId: string;
  page: number;
  scrollOffset: number; // fraction 0-1 within the page
  name: string;
  color: string;
  createdAt: string;
}

const BOOKMARKS_KEY = 'maktaba-mauritania-bookmarks';

const BOOKMARK_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#e91e63',
];

export const getBookmarkColors = () => BOOKMARK_COLORS;

const getAllBookmarks = (): Bookmark[] => {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveAllBookmarks = (bookmarks: Bookmark[]) => {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
};

export const getBookmarks = (bookId: string): Bookmark[] => {
  return getAllBookmarks().filter((b) => b.bookId === bookId).sort((a, b) => a.page - b.page);
};

export const addBookmark = (
  bookId: string,
  page: number,
  scrollOffset: number,
  name?: string,
  color?: string
): Bookmark => {
  const all = getAllBookmarks();
  const bookmark: Bookmark = {
    id: crypto.randomUUID(),
    bookId,
    page,
    scrollOffset,
    name: name || `صفحة ${page}`,
    color: color || BOOKMARK_COLORS[all.filter((b) => b.bookId === bookId).length % BOOKMARK_COLORS.length],
    createdAt: new Date().toISOString(),
  };
  saveAllBookmarks([...all, bookmark]);
  return bookmark;
};

export const removeBookmark = (id: string) => {
  saveAllBookmarks(getAllBookmarks().filter((b) => b.id !== id));
};

export const updateBookmark = (id: string, updates: Partial<Pick<Bookmark, 'name' | 'color' | 'page' | 'scrollOffset'>>) => {
  const all = getAllBookmarks();
  const idx = all.findIndex((b) => b.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    saveAllBookmarks(all);
  }
};

export const getLastBookmark = (bookId: string): Bookmark | null => {
  const bookmarks = getBookmarks(bookId);
  if (bookmarks.length === 0) return null;
  // Return the most recently created one
  return bookmarks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
};
