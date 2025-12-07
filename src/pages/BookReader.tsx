import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { mockBooks } from '@/lib/mockData';
import { addToReadingHistory } from '@/lib/storage';

const BookReader = () => {
  const { id } = useParams<{ id: string }>();
  const book = mockBooks.find((b) => b.id === id);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (book) {
      addToReadingHistory({
        bookId: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        lastRead: new Date().toISOString(),
      });
    }
  }, [book]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

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
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                {zoom}%
              </span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="h-6 w-px bg-border mx-2" />
              <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(book.pdfUrl, '_blank')}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">تحميل</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 p-4">
        <div
          className="w-full h-full min-h-[80vh] bg-card rounded-xl border border-border shadow-sm overflow-hidden"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          {/* Placeholder for PDF viewer - In production, use react-pdf or similar */}
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-8">
            <div className="text-6xl mb-6">📖</div>
            <h2 className="text-xl font-bold text-foreground mb-2">{book.title}</h2>
            <p className="text-muted-foreground mb-6">{book.author}</p>
            <p className="text-sm text-center max-w-md mb-6">
              لعرض ملف PDF، قم بتوصيل المكتبة بخدمة التخزين السحابي
            </p>
            <Button
              variant="gold"
              onClick={() => window.open(book.pdfUrl, '_blank')}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              فتح في نافذة جديدة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookReader;
