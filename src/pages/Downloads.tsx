import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Trash2, ExternalLink } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { getDownloads, removeFromDownloads, clearDownloads } from '@/lib/storage';
import { DownloadedBook } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const Downloads = () => {
  const [downloads, setDownloads] = useState<DownloadedBook[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setDownloads(getDownloads());
  }, []);

  const handleRemove = (bookId: string) => {
    removeFromDownloads(bookId);
    setDownloads(getDownloads());
    toast({
      title: 'تم الحذف',
      description: 'تم إزالة الكتاب من التحميلات',
    });
  };

  const handleClearAll = () => {
    clearDownloads();
    setDownloads([]);
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
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gold-gradient">
                <Download className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  التحميلات
                </h1>
                <p className="text-muted-foreground">
                  {downloads.length} كتاب تم تحميله
                </p>
              </div>
            </div>
            {downloads.length > 0 && (
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

          {/* Downloads List */}
          {downloads.length > 0 ? (
            <div className="space-y-4">
              {downloads.map((download, index) => (
                <div
                  key={download.bookId}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Cover */}
                  <Link to={`/book/${download.bookId}`}>
                    <img
                      src={download.coverUrl}
                      alt={download.title}
                      className="w-16 h-24 object-cover rounded-lg book-shadow"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/book/${download.bookId}`}>
                      <h3 className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1">
                        {download.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">{download.author}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      تم التحميل: {new Date(download.downloadedAt).toLocaleDateString('ar-MR')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(download.pdfUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="hidden sm:inline">فتح</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(download.bookId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📥</div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                لا توجد تحميلات
              </h2>
              <p className="text-muted-foreground mb-6">
                حمّل كتباً من المكتبة وستظهر هنا
              </p>
              <Link to="/">
                <Button variant="gold">تصفح المكتبة</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Downloads;
