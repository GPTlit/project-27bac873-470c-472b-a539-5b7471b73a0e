import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Trash2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/books/BookCard';
import { getReadingHistory, clearReadingHistory } from '@/lib/storage';
import { ReadingHistoryItem } from '@/lib/types';
import { mockBooks } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

const History = () => {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setHistory(getReadingHistory());
  }, []);

  const handleClearHistory = () => {
    clearReadingHistory();
    setHistory([]);
    toast({
      title: 'تم المسح',
      description: 'تم مسح تاريخ القراءة',
    });
  };

  const historyBooks = history
    .map((item) => mockBooks.find((book) => book.id === item.bookId))
    .filter(Boolean);

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <HistoryIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  تاريخ القراءة
                </h1>
                <p className="text-muted-foreground">
                  {history.length} كتاب تمت قراءته
                </p>
              </div>
            </div>
            {history.length > 0 && (
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={handleClearHistory}
              >
                <Trash2 className="h-4 w-4" />
                مسح الكل
              </Button>
            )}
          </div>

          {/* History Grid */}
          {historyBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {historyBooks.map((book, index) => (
                book && <BookCard key={book.id} book={book} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📚</div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                لا يوجد تاريخ قراءة
              </h2>
              <p className="text-muted-foreground mb-6">
                ابدأ بقراءة كتاب وسيظهر هنا
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

export default History;
