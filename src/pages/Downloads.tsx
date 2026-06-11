import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Trash2, BookOpen, WifiOff, HardDrive, Inbox, Lightbulb } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useOfflineBooks } from '@/hooks/useOfflineBooks';

const Downloads = () => {
  const { toast } = useToast();
  const { 
    offlineBooks, 
    isLoading, 
    removeOfflineBook, 
    getTotalStorageUsed, 
    formatFileSize 
  } = useOfflineBooks();

  const handleRemove = (bookId: string, title: string) => {
    removeOfflineBook(bookId);
    toast({
      title: 'تم الحذف',
      description: `تم حذف "${title}" من التحميلات`,
    });
  };

  const handleClearAll = () => {
    offlineBooks.forEach(book => removeOfflineBook(book.id));
    toast({
      title: 'تم المسح',
      description: 'تم مسح جميع التحميلات',
    });
  };

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gold-gradient">
                <Download className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  الكتب المحفوظة
                </h1>
                <p className="text-muted-foreground">
                  {offlineBooks.length} كتاب متاح للقراءة بدون إنترنت
                </p>
              </div>
            </div>
            {offlineBooks.length > 0 && (
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={handleClearAll}
              >
                <Trash2 className="h-4 w-4" />
                مسح الكل
              </Button>
            )}
          </div>

          {/* Storage Info */}
          {offlineBooks.length > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-secondary/50 flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground">
                المساحة المستخدمة: {formatFileSize(getTotalStorageUsed())}
              </span>
            </div>
          )}

          {/* Downloads List */}
          {isLoading ? (
            <div className="text-center py-16">
              <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : offlineBooks.length > 0 ? (
            <div className="space-y-4">
              {offlineBooks.map((book, index) => (
                <div
                  key={book.id}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Cover */}
                  <Link to={`/book/${book.id}`}>
                    <div className="w-16 h-24 rounded-lg overflow-hidden book-shadow bg-secondary flex-shrink-0">
                      {book.coverUrl && book.coverUrl !== '/placeholder.svg' ? (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/book/${book.id}`}>
                      <h3 className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1">
                        {book.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <WifiOff className="h-3 w-3" />
                        متاح بدون إنترنت
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(book.fileSize)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link to={`/book/${book.id}/read`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">قراءة</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(book.id, book.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Inbox className="h-16 w-16 mx-auto mb-6 text-muted-foreground/40" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                لا توجد كتب محفوظة
              </h2>
              <p className="text-muted-foreground mb-6">
                حمّل كتباً من المكتبة للقراءة بدون إنترنت
              </p>
              <Link to="/">
                <Button variant="gold">تصفح المكتبة</Button>
              </Link>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1 inline-flex items-center gap-1"><Lightbulb className="h-4 w-4" /> نصيحة:</p>
            <p>
              الكتب المحفوظة تُخزّن على جهازك ويمكنك قراءتها في أي وقت بدون اتصال بالإنترنت.
              تأكد من وجود مساحة كافية على جهازك قبل التحميل.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Downloads;
