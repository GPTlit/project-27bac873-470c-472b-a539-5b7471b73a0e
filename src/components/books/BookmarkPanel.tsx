import { useState } from 'react';
import { Bookmark as BookmarkIcon, X, Trash2, Edit2, Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark, getBookmarkColors, removeBookmark, updateBookmark } from '@/lib/bookmarks';

interface BookmarkPanelProps {
  bookmarks: Bookmark[];
  onNavigate: (page: number, scrollOffset: number) => void;
  onRemove: (id: string) => void;
  onUpdate: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const BookmarkPanel = ({ bookmarks, onNavigate, onRemove, onUpdate, isOpen, onClose }: BookmarkPanelProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const colors = getBookmarkColors();

  if (!isOpen) return null;

  const handleEdit = (b: Bookmark) => {
    setEditingId(b.id);
    setEditName(b.name);
    setShowColorPicker(null);
  };

  const handleSave = (id: string) => {
    updateBookmark(id, { name: editName });
    setEditingId(null);
    onUpdate();
  };

  const handleColorChange = (id: string, color: string) => {
    updateBookmark(id, { color });
    setShowColorPicker(null);
    onUpdate();
  };

  const handleDelete = (id: string) => {
    removeBookmark(id);
    onRemove(id);
  };

  return (
    <div className="fixed left-0 top-14 bottom-0 w-72 bg-card border-l border-border shadow-xl z-40 flex flex-col animate-in slide-in-from-left-full duration-200">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
          <BookmarkIcon className="h-4 w-4 text-primary" />
          العلامات المرجعية ({bookmarks.length})
        </h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-1">
        {bookmarks.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center py-8">
            لا توجد علامات مرجعية بعد.<br />اضغط على أيقونة العلامة بجانب أي صفحة لإضافتها.
          </p>
        ) : (
          bookmarks.map((b) => (
            <div
              key={b.id}
              className="rounded-lg border border-border bg-background p-2 group hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0 cursor-pointer ring-1 ring-border"
                  style={{ backgroundColor: b.color }}
                  onClick={() => setShowColorPicker(showColorPicker === b.id ? null : b.id)}
                />
                {editingId === b.id ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-6 text-xs px-1"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSave(b.id)}
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleSave(b.id)}>
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    className="flex-1 text-right text-xs text-foreground truncate hover:text-primary transition-colors"
                    onClick={() => onNavigate(b.page, b.scrollOffset)}
                  >
                    {b.name}
                  </button>
                )}
                <span className="text-[10px] text-muted-foreground shrink-0">ص{b.page}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleEdit(b)}>
                    <Edit2 className="h-2.5 w-2.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => handleDelete(b.id)}>
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </div>

              {showColorPicker === b.id && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {colors.map((c) => (
                    <button
                      key={c}
                      className="w-5 h-5 rounded-full ring-1 ring-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                      onClick={() => handleColorChange(b.id, c)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookmarkPanel;
