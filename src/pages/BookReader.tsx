import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Download, ZoomIn, ZoomOut, Loader2, WifiOff, BookmarkPlus, Bookmark as BookmarkIcon, List } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { useBook } from '@/hooks/useBooks';
import { addToReadingHistory } from '@/lib/storage';
import { useOfflineBooks } from '@/hooks/useOfflineBooks';
import { getBookmarks, addBookmark, removeBookmark, getLastBookmark, Bookmark } from '@/lib/bookmarks';
import BookmarkPanel from '@/components/books/BookmarkPanel';
import { toast } from 'sonner';
import { AmbientPlayer } from '@/components/books/AmbientPlayer';
import { AskTheBook } from '@/components/books/AskTheBook';
import { useReadingPresence } from '@/hooks/useReadingPresence';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BookReader = () => {
  const { id } = useParams<{ id: string }>();
  const { data: book, isLoading } = useBook(id || '');
  const { getOfflineBookUrl } = useOfflineBooks();
  const { user } = useAuth();
  useReadingPresence(id);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selection, setSelection] = useState('');
  const [askOpen, setAskOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const shouldRestoreRef = useRef(true);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);

  // Load bookmarks
  useEffect(() => {
    if (id) setBookmarks(getBookmarks(id));
  }, [id]);

  // Setup book file + history
  useEffect(() => {
    if (id && book) {
      const offlineUrl = getOfflineBookUrl(id);
      if (offlineUrl) {
        setFileUrl(offlineUrl);
        setIsOfflineMode(true);
      } else {
        setFileUrl(book.file_url);
        setIsOfflineMode(false);
      }
      addToReadingHistory({
        bookId: book.id, title: book.title, author: book.author,
        coverUrl: book.cover_url || '/placeholder.svg', lastRead: new Date().toISOString(),
      });
    }
  }, [book, id, getOfflineBookUrl]);

  // Restore last bookmark position after pages render
  useEffect(() => {
    if (!shouldRestoreRef.current || numPages === 0 || !id) return;
    const last = getLastBookmark(id);
    if (last) {
      shouldRestoreRef.current = false;
      // Delay to let pages mount
      setTimeout(() => navigateToPage(last.page, last.scrollOffset), 500);
    }
  }, [numPages, id]);

  const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setLoadedPages(new Set([1, 2, 3]));
    // Cache page count to DB if missing
    if (book && !(book as any).page_count) {
      supabase.from('books').update({ page_count: n }).eq('id', book.id);
    }
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  // Pinch-to-zoom handlers (touch)
  const getDist = (t1: React.Touch, t2: React.Touch) =>
    Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = {
        startDist: getDist(e.touches[0], e.touches[1]),
        startScale: scale,
      };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dist = getDist(e.touches[0], e.touches[1]);
      const ratio = dist / pinchRef.current.startDist;
      const next = Math.min(3, Math.max(0.5, pinchRef.current.startScale * ratio));
      setScale(next);
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
  };

  const navigateToPage = (page: number, _scrollOffset: number = 0) => {
    // Ensure page is loaded
    setLoadedPages((prev) => {
      const next = new Set(prev);
      for (let i = Math.max(1, page - 1); i <= Math.min(numPages, page + 2); i++) next.add(i);
      return next;
    });
    setTimeout(() => {
      const el = pageElementsRef.current.get(page);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleAddBookmark = () => {
    if (!id) return;
    const bm = addBookmark(id, currentPage, 0);
    setBookmarks(getBookmarks(id));
    toast.success(`تمت إضافة علامة: ${bm.name}`);
  };

  const handleRemoveBookmark = (bmId: string) => {
    if (!id) return;
    removeBookmark(bmId);
    setBookmarks(getBookmarks(id));
    toast.success('تم حذف العلامة');
  };

  const refreshBookmarks = () => {
    if (id) setBookmarks(getBookmarks(id));
  };

  // Track current page via IntersectionObserver
  const pageRef = useCallback((node: HTMLDivElement | null, pageNum: number) => {
    if (!node) return;
    pageElementsRef.current.set(pageNum, node);

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const pg = Number(entry.target.getAttribute('data-page'));
              if (pg) {
                setCurrentPage(pg);
                setLoadedPages((prev) => {
                  const next = new Set(prev);
                  for (let i = Math.max(1, pg - 1); i <= Math.min(numPages, pg + 2); i++) next.add(i);
                  return next;
                });
              }
            }
          });
        },
        { rootMargin: '600px 0px', threshold: 0.5 }
      );
    }
    observerRef.current.observe(node);
  }, [numPages]);

  useEffect(() => {
    return () => { observerRef.current?.disconnect(); };
  }, []);

  const currentPageBookmarked = bookmarks.some((b) => b.page === currentPage);

  // Track text selection for "Ask the book" + highlight save
  useEffect(() => {
    const onUp = () => {
      const sel = window.getSelection?.()?.toString().trim() || '';
      setSelection(sel);
    };
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
    };
  }, []);

  const saveHighlight = async () => {
    if (!user || !id || !selection) return;
    await supabase.from('book_highlights').insert({ book_id: id, user_id: user.id, page: currentPage, text: selection });
    toast.success('تم تمييز النص');
  };

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
          <h1 className="text-2xl font-bold text-foreground mb-4">الكتاب غير موجود</h1>
          <Link to="/"><Button variant="outline" className="gap-2"><ArrowRight className="h-4 w-4" />العودة للرئيسية</Button></Link>
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
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to={`/book/${book.id}`}>
                <Button variant="ghost" size="icon"><ArrowRight className="h-5 w-5" /></Button>
              </Link>
              <div className="hidden sm:block">
                <h1 className="font-bold text-foreground line-clamp-1">{book.title}</h1>
                <p className="text-xs text-muted-foreground">{book.author}</p>
              </div>
              {isOfflineMode && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs">
                  <WifiOff className="h-3 w-3" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Bookmark controls */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPanelOpen(!panelOpen)}
                className="relative"
                title="العلامات المرجعية"
              >
                <List className="h-4 w-4" />
                {bookmarks.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                    {bookmarks.length}
                  </span>
                )}
              </Button>
              <Button
                variant={currentPageBookmarked ? 'default' : 'ghost'}
                size="icon"
                onClick={handleAddBookmark}
                title={`إضافة علامة - صفحة ${currentPage}`}
              >
                {currentPageBookmarked ? <BookmarkIcon className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
              </Button>

              <div className="h-6 w-px bg-border mx-1" />
              <span className="text-xs text-muted-foreground">{currentPage}/{numPages}</span>
              <div className="h-6 w-px bg-border mx-1" />
              <Button variant="ghost" size="icon" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
              <span className="text-xs text-muted-foreground min-w-[2.5rem] text-center hidden sm:block">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
              <div className="h-6 w-px bg-border mx-1" />
              <a href={book.file_url} download target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" /><span className="hidden sm:inline">تحميل</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bookmark Panel */}
      <BookmarkPanel
        bookmarks={bookmarks}
        onNavigate={navigateToPage}
        onRemove={handleRemoveBookmark}
        onUpdate={refreshBookmarks}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
      />

      {/* PDF Viewer */}
      <div
        className="flex-1 overflow-auto p-4 touch-pan-y"
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'pan-x pan-y' }}
      >
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
                    <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />تحميل الملف مباشرة</Button>
                  </a>
                </div>
              }
              className="flex flex-col items-center gap-4"
            >
              {Array.from(new Array(numPages), (_, index) => {
                const pageNum = index + 1;
                const isLoaded = loadedPages.has(pageNum);
                const pageBookmarks = bookmarks.filter((b) => b.page === pageNum);
                return (
                  <div
                    key={`page_wrapper_${pageNum}`}
                    data-page={pageNum}
                    ref={(node) => pageRef(node, pageNum)}
                    className="relative"
                  >
                    {/* Bookmark indicators on the page */}
                    {pageBookmarks.length > 0 && (
                      <div className="absolute top-0 right-1 z-10 flex flex-col gap-0.5">
                        {pageBookmarks.map((bm) => (
                          <div
                            key={bm.id}
                            className="w-5 h-7 rounded-b-sm shadow-md cursor-pointer hover:h-9 transition-all"
                            style={{ backgroundColor: bm.color }}
                            title={bm.name}
                            onClick={() => setPanelOpen(true)}
                          />
                        ))}
                      </div>
                    )}
                    {isLoaded ? (
                      <Page
                        pageNumber={pageNum}
                        scale={scale}
                        className="shadow-xl rounded-lg overflow-hidden"
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    ) : (
                      <div
                        style={{ height: `${800 * scale}px`, width: `${600 * scale}px` }}
                        className="bg-card rounded-lg flex items-center justify-center"
                      >
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </Document>
          )}
        </div>
      </div>

      {/* Selection action bar */}
      {selection && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-card border border-border rounded-full shadow-2xl px-2 py-1 flex items-center gap-1 animate-fade-in">
          <Button size="sm" variant="ghost" onClick={saveHighlight}>تمييز</Button>
          <div className="h-5 w-px bg-border" />
          <Button size="sm" variant="gold" className="gap-1" onClick={() => setAskOpen(true)}>
            <Sparkles className="h-3 w-3" /> اسأل الكتاب
          </Button>
        </div>
      )}

      <AmbientPlayer />

      {askOpen && book && (
        <AskTheBook
          bookTitle={book.title}
          author={book.author}
          passage={selection}
          onClose={() => setAskOpen(false)}
        />
      )}
    </div>
  );
};

export default BookReader;
