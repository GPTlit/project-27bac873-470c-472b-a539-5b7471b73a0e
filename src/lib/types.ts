export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  coverUrl: string;
  pdfUrl: string;
  createdAt: string;
  featured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  bookCount: number;
}

export interface BookSubmission {
  title: string;
  author: string;
  category: string;
  pdfFile: File | null;
  note: string;
}

export interface ReadingHistoryItem {
  bookId: string;
  title: string;
  author: string;
  coverUrl: string;
  lastRead: string;
}

export interface DownloadedBook {
  bookId: string;
  title: string;
  author: string;
  coverUrl: string;
  pdfUrl: string;
  downloadedAt: string;
}
