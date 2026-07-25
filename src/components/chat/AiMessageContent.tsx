import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useBooks } from '@/hooks/useBooks';

const BOOK_TOKEN = /\[\[BOOK:([0-9a-fA-F-]{6,})\]\]/g;

export const AiMessageContent = ({ content }: { content: string }) => {
  const { data: books } = useBooks();
  const bookMap = new Map((books ?? []).map((b) => [b.id, b]));

  const parts: Array<{ type: 'text' | 'book'; value: string }> = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  BOOK_TOKEN.lastIndex = 0;
  while ((m = BOOK_TOKEN.exec(content)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, m.index) });
    }
    parts.push({ type: 'book', value: m[1] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>;
  }

  return (
    <div className="space-y-2">
      {parts.map((p, i) => {
        if (p.type === 'text') {
          if (!p.value.trim()) return null;
          return (
            <p key={i} className="text-sm whitespace-pre-wrap leading-relaxed">
              {p.value}
            </p>
          );
        }
        const book = bookMap.get(p.value);
        if (!book) return null;
        return (
          <Link
            key={i}
            to={`/book/${book.id}`}
            className="flex gap-3 items-center p-3 rounded-xl border bg-card hover:bg-accent transition-colors"
          >
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="h-16 w-12 rounded object-cover shrink-0"
              />
            ) : (
              <div className="h-16 w-12 rounded bg-secondary flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{book.title}</div>
              <div className="text-xs text-muted-foreground truncate">{book.author}</div>
              <div className="text-xs text-primary mt-1">اضغط لفتح الكتاب →</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};