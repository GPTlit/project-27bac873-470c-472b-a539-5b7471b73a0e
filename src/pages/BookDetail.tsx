import { useParams, Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Download, Share2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { mockBooks, categories } from '@/lib/mockData';
import { addToReadingHistory, addToDownloads } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const book = mockBooks.find((b) => b.id === id);
  const category = book ? categories.find((c) => c.name === book.category) : null;

  if (!book) {
    return (
      <Layout>
        <div className="section-padding">
          <div className="container-library text-center">
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
      </Layout>
    );
  }

  const handleRead = () => {
    addToReadingHistory({
      bookId: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      lastRead: new Date().toISOString(),
    });
    toast({
      title: 'تم الإضافة',
      description: 'تمت إضافة الكتاب لتاريخ القراءة',
    });
  };

  const handleDownload = () => {
    addToDownloads({
      bookId: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      pdfUrl: book.pdfUrl,
      downloadedAt: new Date().toISOString(),
    });
    toast({
      title: 'تم التحميل',
      description: 'تمت إضافة الكتاب للتحميلات',
    });
    // Trigger actual download
    window.open(book.pdfUrl, '_blank');
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
        title: 'تم النسخ',
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
              الرئيسية
            </Link>
            <span>/</span>
            {category && (
              <>
                <Link
                  to={`/category/${category.name}`}
                  className="hover:text-primary transition-colors"
                >
                  {category.nameAr}
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
              <div className="aspect-[3/4] rounded-2xl overflow-hidden book-shadow sticky top-24">
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
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
                  {category.nameAr}
                </Link>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {book.title}
              </h1>

              {/* Author */}
              <p className="text-xl text-muted-foreground mb-6">
                المؤلف: {book.author}
              </p>

              {/* Description */}
              <div className="prose prose-lg max-w-none mb-8">
                <p className="text-foreground/80 leading-relaxed">
                  {book.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-4">
                <Link to={`/book/${book.id}/read`} onClick={handleRead}>
                  <Button variant="gold" size="xl" className="gap-3">
                    <BookOpen className="h-5 w-5" />
                    اقرأ الآن
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="xl"
                  className="gap-3"
                  onClick={handleDownload}
                >
                  <Download className="h-5 w-5" />
                  تحميل PDF
                </Button>
                <Button
                  variant="ghost"
                  size="xl"
                  className="gap-3"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                  مشاركة
                </Button>
              </div>

              {/* Meta Info */}
              <div className="mt-8 pt-8 border-t border-border">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ الإضافة</p>
                    <p className="font-medium text-foreground">
                      {new Date(book.createdAt).toLocaleDateString('ar-MR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">التصنيف</p>
                    <p className="font-medium text-foreground">
                      {category?.nameAr}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الحالة</p>
                    <p className="font-medium text-foreground">متاح للقراءة</p>
                  </div>
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
