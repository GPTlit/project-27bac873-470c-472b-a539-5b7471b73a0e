import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Download, ZoomIn, ZoomOut, Loader2, WifiOff } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { useBook } from '@/hooks/useBooks';
import { addToReadingHistory } from '@/lib/storage';
import { useOfflineBooks } from '@/hooks/useOfflineBooks';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const VISIBLE_BUFFER = 3; // pages before/after viewport to render

const BookReader = () => {
  const { id } = useParams<{ id: string }>();
  const { data: book, isLoading } = useBook(id || '');
  const { isBookOffline, getOfflineBookUrl } = useOfflineBooks();
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 1, end: 5 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && book) {
      // Check if book is available offline
      const offlineUrl = getOfflineBookUrl(id);
      if (offlineUrl) {
        setFileUrl(offlineUrl);
        setIsOfflineMode(true);
      } else {
        setFileUrl(book.file_url);
        setIsOfflineMode(false);
      }

      addToReadingHistory({
        bookId: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.cover_url || '/placeholder.svg',
        lastRead: new Date().toISOString(),
      });
    }
  }, [book, id, getOfflineBookUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  // Virtualized scrolling: only render pages near the viewport
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;
    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;
    const pageHeight = (viewportHeight * scale) + 16; // approx page height + gap
    const currentPage = Math.max(1, Math.floor(scrollTop / pageHeight) + 1);
    setVisibleRange({
      start: Math.max(1, currentPage - VISIBLE_BUFFER),
      end: Math.min(numPages, currentPage + VISIBLE_BUFFER),
    });
  }, [numPages, scale]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            الكتاب غير موجود
          </h1>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container-library">
          <div className="flex items-center justify-between h-14">
            {/* Back & Title */}
            <div className="flex items-center gap-4">
              <Link to={`/book/${book.id}`}>
                <Button variant="ghost" size="icon">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <div className="hidden sm:block">
                <h1 className="font-bold text-foreground line-clamp-1">
                  {book.title}
                </h1>
                <p className="text-xs text-muted-foreground">{book.author}</p>
              </div>
              {/* Offline indicator */}
              {isOfflineMode && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs">
                  <WifiOff className="h-3 w-3" />
                  <span className="hidden sm:inline">بدون إنترنت</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Page count */}
              <span className="text-sm text-muted-foreground">
                {numPages} صفحة
              </span>
              
              <div className="h-6 w-px bg-border mx-1 sm:mx-2" />
              
              {/* Zoom */}
              <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[3rem] text-center hidden sm:block">
                {Math.round(scale * 100)}%
              </span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <div className="h-6 w-px bg-border mx-1 sm:mx-2" />
              
              <a href={book.file_url} download target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">تحميل</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer - Scrollable with virtualization */}
      <div className="flex-1 overflow-auto p-4" ref={containerRef} onScroll={handleScroll}>
        <div className="flex justify-center">
          {fileUrl && (
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-destructive mb-4">فشل في تحميل الملف</p>
                  <a href={book.file_url} download target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      تحميل الملف مباشرة
                    </Button>
                  </a>
                </div>
              }
              className="flex flex-col items-center gap-4"
            >
              {Array.from(new Array(numPages), (_, index) => {
                const pageNum = index + 1;
                const isVisible = pageNum >= visibleRange.start && pageNum <= visibleRange.end;
                return isVisible ? (
                  <Page
                    key={`page_${pageNum}`}
                    pageNumber={pageNum}
                    scale={scale}
                    className="shadow-xl rounded-lg overflow-hidden"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                ) : (
                  <div
                    key={`placeholder_${pageNum}`}
                    style={{ height: `${800 * scale}px`, width: `${600 * scale}px` }}
                    className="bg-muted rounded-lg"
                  />
                );
              })}
            </Document>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookReader;
