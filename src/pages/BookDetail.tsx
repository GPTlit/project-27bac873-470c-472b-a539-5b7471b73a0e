import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Download, Share2, WifiOff, Check, Loader2, FileText } from 'lucide-react';
import { BookLoader } from '@/components/ui/BookLoader';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { categories } from '@/lib/mockData';
import { addToReadingHistory } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useBook } from '@/hooks/useBooks';
import { useState, useEffect } from 'react';
import { CommentsSection } from '@/components/books/CommentsSection';
import { LikeButton } from '@/components/books/LikeButton';
import { BookRatingSection } from '@/components/books/BookRatingSection';
import { BookRecommendations } from '@/components/books/BookRecommendations';
import { useOfflineBooks } from '@/hooks/useOfflineBooks';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: book, isLoading } = useBook(id || '');
  const { isBookOffline, saveBookOffline } = useOfflineBooks();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  
  const category = book ? categories.find((c) => c.name === book.category) : null;

  useEffect(() => {
    if (id) {
      setIsOffline(isBookOffline(id));
    }
  }, [id, isBookOffline]);

  // Helper function to require authentication
  const requireAuth = (callback: () => void, actionDescription: string) => {
    if (!user) {
      toast({
        title: t('loginRequired'),
        description: actionDescription,
        action: (
          <Button size="sm" onClick={() => navigate('/auth')}>
            {t('login')}
          </Button>
        ),
      });
      return;
    }
    callback();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="section-padding">
          <div className="container-library flex justify-center py-20">
            <BookLoader size="lg" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="section-padding">
          <div className="container-library text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {t('bookNotFound')}
            </h1>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="h-4 w-4" />
                {t('backToHome')}
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleRead = () => {
    requireAuth(() => {
      addToReadingHistory({
        bookId: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.cover_url || '/placeholder.svg',
        lastRead: new Date().toISOString(),
      });
      navigate(`/book/${book.id}/read`);
    }, t('loginToRead'));
  };

  const handleDownload = async () => {
    if (!user) {
      toast({
        title: t('loginRequired'),
        description: t('loginToDownload'),
        action: (
          <Button size="sm" onClick={() => navigate('/auth')}>
            {t('login')}
          </Button>
        ),
      });
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      const success = await saveBookOffline(
        {
          id: book.id,
          title: book.title,
          author: book.author,
          coverUrl: book.cover_url || '/placeholder.svg',
          fileUrl: book.file_url,
          fileType: book.file_type || 'pdf',
        },
        (progress) => setDownloadProgress(progress)
      );

      if (success) {
        setIsOffline(true);
        toast({
          title: t('success') + ' ✓',
          description: 'تم حفظ الكتاب على جهازك للقراءة بدون إنترنت',
        });
      } else {
        toast({
          title: t('error'),
          description: 'مساحة التخزين غير كافية أو حدث خطأ',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: t('error'),
        description: 'تعذر تحميل الكتاب',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `اقرأ كتاب "${book.title}" على مكتبة موريتانيا`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: t('success'),
        description: 'تم نسخ رابط الكتاب',
      });
    }
  };

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">
              {t('home')}
            </Link>
            <span>/</span>
            {category && (
              <>
                <Link
                  to={`/category/${category.name}`}
                  className="hover:text-primary transition-colors"
                >
                  {(() => { const key = `category_${category.name}`; const translated = t(key); return translated !== key ? translated : category.nameAr; })()}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-foreground">{book.title}</span>
          </div>

          {/* Book Details */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Cover */}
            <div className="md:col-span-1">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden book-shadow sticky top-24 bg-secondary">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="md:col-span-2">
              {/* Category Badge */}
              {category && (
                <Link
                  to={`/category/${category.name}`}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-sm text-secondary-foreground hover:bg-secondary/80 transition-colors mb-4"
                >
                  <span>{category.icon}</span>
                  {(() => { const key = `category_${category.name}`; const translated = t(key); return translated !== key ? translated : category.nameAr; })()}
                </Link>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {book.title}
              </h1>

              {/* Author */}
              <p className="text-xl text-muted-foreground mb-6">
                {t('author')}: {book.author}
              </p>

              {/* Description */}
              {book.description && (
                <div className="prose prose-lg max-w-none mb-8">
                  <p className="text-foreground/80 leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}

              {/* Rating Section */}
              <div className="mb-6">
                <BookRatingSection bookId={book.id} authorName={book.author} />
              </div>

              {/* Offline Badge */}
              {isOffline && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent mb-6">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('savedOnDevice')}</span>
                </div>
              )}

              {/* Download Progress */}
              {isDownloading && (
                <div className="mb-6 p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-foreground">{t('loading')}</span>
                    <span className="text-sm text-muted-foreground mr-auto">{Math.round(downloadProgress)}%</span>
                  </div>
                  <Progress value={downloadProgress} className="h-2" />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-4">
                <Button variant="gold" size="xl" className="gap-3" onClick={handleRead}>
                  <BookOpen className="h-5 w-5" />
                  {t('readNow')}
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  className="gap-3"
                  onClick={handleDownload}
                  disabled={isDownloading || isOffline}
                >
                  {isDownloading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isOffline ? (
                    <Check className="h-5 w-5 text-accent" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                  {isOffline ? t('savedOnDevice') : t('saveOffline')}
                </Button>
                <LikeButton bookId={book.id} size="lg" />
                <Button
                  variant="ghost"
                  size="xl"
                  className="gap-3"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                  {t('share')}
                </Button>
              </div>

              {/* Meta Info */}
              <div className="mt-8 pt-8 border-t border-border">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('dateAdded')}</p>
                    <p className="font-medium text-foreground">
                      {new Date(book.created_at).toLocaleDateString('ar-MR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('category')}</p>
                    <p className="font-medium text-foreground">
                      {category ? (() => { const key = `category_${category.name}`; const translated = t(key); return translated !== key ? translated : category.nameAr; })() : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {t('pages')}
                    </p>
                    <p className="font-medium text-foreground">
                      {(book as any).page_count || '—'} {t('pages')}
                    </p>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mt-12 pt-8 border-t border-border">
                  <CommentsSection bookId={book.id} />
                </div>

                {/* Recommendations */}
                <div className="mt-12 pt-8 border-t border-border">
                  <BookRecommendations currentBook={book} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookDetail;
