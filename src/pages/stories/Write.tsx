import { Layout } from '@/components/layout/Layout';
import { useMyStories, useCreateStory } from '@/hooks/useStories';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, PenSquare, BookText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export default function Write() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { data: stories = [], isLoading } = useMyStories();
  const create = useCreateStory();

  if (!user) {
    return (
      <Layout>
        <div className="container-library py-16 text-center space-y-4">
          <p className="text-muted-foreground">سجّل دخولك لتبدأ في كتابة قصصك.</p>
          <Button asChild><Link to="/auth">تسجيل الدخول</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-library py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <PenSquare className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">قصصي</h1>
          </div>
          <Button
            onClick={async () => {
              const s = await create.mutateAsync({ title: 'قصة جديدة' });
              nav(`/write/${s.id}`);
            }}
            disabled={create.isPending}
          >
            <Plus className="h-4 w-4" /> قصة جديدة
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">جاري التحميل...</p>
        ) : stories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookText className="h-12 w-12 mx-auto mb-3" />
            <p>لم تكتب أي قصة بعد. ابدأ قصتك الأولى الآن.</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map(s => (
              <li key={s.id}>
                <Link to={`/write/${s.id}`} className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                  <div className="w-16 h-24 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                    {s.cover_url ? <img src={s.cover_url} alt="" className="w-full h-full object-cover" /> : <BookText className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{s.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{s.description || 'بدون وصف'}</p>
                    <Badge variant={s.status === 'published' ? 'default' : 'secondary'} className="mt-2">
                      {s.status === 'published' ? 'منشورة' : 'مسودة'}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}