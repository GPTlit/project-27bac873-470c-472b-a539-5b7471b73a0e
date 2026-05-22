import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, ImagePlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Book as MockBook } from '@/lib/types';
import { Book as DbBook } from '@/hooks/useBooks';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Accept both the mock Book type and database Book type
type AnyBook = MockBook | DbBook | {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  cover_url?: string | null;
  featured?: boolean;
  category?: string;
};

interface BookCardProps {
  book: AnyBook;
  index?: number;
}

export const BookCard = ({ book, index = 0 }: BookCardProps) => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  // Handle both coverUrl (mock) and cover_url (database)
  const coverImage = ('coverUrl' in book && book.coverUrl) || 
                     ('cover_url' in book && book.cover_url) || 
                     '/placeholder.svg';

  const stop = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleEdit = (e: React.MouseEvent) => {
    stop(e);
    navigate(`/admin-panel?edit=${book.id}`);
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('books').delete().eq('id', book.id);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم الحذف', description: 'تم حذف الكتاب' });
    queryClient.invalidateQueries({ queryKey: ['books'] });
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `cover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('covers').upload(fileName, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('covers').getPublicUrl(fileName);
      const { error: updErr } = await supabase
        .from('books')
        .update({ cover_url: data.publicUrl })
        .eq('id', book.id);
      if (updErr) throw updErr;
      toast({ title: 'تم التحديث', description: 'تم تحديث صورة الغلاف' });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  return (
    <Link
      to={`/book/${book.id}`}
      className="group block animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="relative">
        {/* Book Cover */}
        <div className={cn(
          "relative aspect-[3/4] rounded-xl overflow-hidden",
          "book-shadow book-hover"
        )}>
          <img
            src={coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-background font-medium px-4 py-2 rounded-lg bg-primary/90">
              {t('readNowOverlay')}
            </span>
          </div>

          {/* Featured Badge */}
          {'featured' in book && book.featured && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-md gold-gradient text-xs font-medium text-primary-foreground">
              {t('featured')}
            </div>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <div
              className="absolute top-2 left-2 flex flex-col gap-1.5 z-10"
              onClick={stop}
            >
              <button
                type="button"
                onClick={handleEdit}
                className="h-8 w-8 rounded-full bg-background/90 backdrop-blur text-foreground shadow-md hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                aria-label="تعديل"
                title="تعديل"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  coverInputRef.current?.click();
                }}
                disabled={uploadingCover}
                className="h-8 w-8 rounded-full bg-background/90 backdrop-blur text-foreground shadow-md hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors disabled:opacity-60"
                aria-label="تغيير الغلاف"
                title="تغيير الغلاف"
              >
                {uploadingCover ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    onClick={stop}
                    className="h-8 w-8 rounded-full bg-background/90 backdrop-blur text-destructive shadow-md hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors"
                    aria-label="حذف"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={stop}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف الكتاب؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من حذف "{book.title}"؟ لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="mt-4">
          <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {book.author}
          </p>
        </div>
      </div>
    </Link>
  );
};
