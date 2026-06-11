import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Heart, Lock, Mail, LogOut, BookOpen, StickyNote, Plus, Pencil, Trash2, MoreVertical, Camera, Save, X, Loader2, BookText } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useNotes, useAddNote, useUpdateNote, useDeleteNote, Note } from '@/hooks/useNotes';
import { useUserProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useUserProfile';
import { useMyStories } from '@/hooks/useStories';
import { Badge } from '@/components/ui/badge';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  
  // Notes state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const { data: profile } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const { data: notes = [] } = useNotes();
  const { data: myStories = [] } = useMyStories();
  const addNote = useAddNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  // Fetch user's favorite books
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ['user-favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('book_likes')
        .select(`
          id,
          created_at,
          books:book_id (
            id,
            title,
            author,
            cover_url,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Initialize profile form when profile loads
  useState(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setPhone(profile.phone || '');
    }
  });

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({ title: t('error'), description: 'الرجاء إدخال البريد الإلكتروني', variant: 'destructive' });
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/profile?tab=security`,
      });

      if (error) throw error;

      toast({ title: t('success'), description: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' });
      setResetEmail('');
    } catch (error: any) {
      toast({ title: t('error'), description: error.message || 'حدث خطأ أثناء إرسال الرابط', variant: 'destructive' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: t('error'), description: 'الرجاء إدخال كلمة المرور الجديدة', variant: 'destructive' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: t('error'), description: 'كلمتا المرور غير متطابقتين', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: t('error'), description: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: t('success'), description: 'تم تغيير كلمة المرور بنجاح' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: t('error'), description: error.message || 'حدث خطأ أثناء تغيير كلمة المرور', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const avatarUrl = await uploadAvatar.mutateAsync(file);
      await updateProfile.mutateAsync({ avatar_url: avatarUrl });
      toast({ title: t('success'), description: 'تم تحديث الصورة الشخصية' });
    } catch (error: any) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ display_name: displayName, bio, phone });
      toast({ title: t('success'), description: 'تم حفظ الملف الشخصي' });
      setIsEditingProfile(false);
    } catch (error: any) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;

    try {
      await addNote.mutateAsync({ title: noteTitle || undefined, content: noteContent });
      toast({ title: t('success'), description: 'تمت إضافة الملاحظة' });
      setNoteTitle('');
      setNoteContent('');
      setIsAddingNote(false);
    } catch (error: any) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !noteContent.trim()) return;

    try {
      await updateNote.mutateAsync({ id: editingNote.id, title: noteTitle || undefined, content: noteContent });
      toast({ title: t('success'), description: 'تم تحديث الملاحظة' });
      setEditingNote(null);
      setNoteTitle('');
      setNoteContent('');
    } catch (error: any) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote.mutateAsync(noteId);
      toast({ title: t('success'), description: 'تم حذف الملاحظة' });
    } catch (error: any) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative group">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="gold-gradient text-primary-foreground text-xl">
                  {profile?.display_name?.slice(0, 2).toUpperCase() || userInitials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                {profile?.display_name || t('myProfile')}
              </h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (profile) {
                  setDisplayName(profile.display_name || '');
                  setBio(profile.bio || '');
                  setPhone(profile.phone || '');
                }
                setIsEditingProfile(true);
              }}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              {t('editProfile')}
            </Button>
          </div>

          {/* Edit Profile Dialog */}
          <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('editProfile')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('displayName')}</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="أدخل اسمك"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('bio')}</Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="اكتب نبذة عنك..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('phone')}</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="رقم الهاتف"
                    type="tel"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setIsEditingProfile(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                    {t('saveChanges')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Tabs defaultValue="favorites" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="stories" className="gap-2">
                <BookText className="h-4 w-4" />
                قصصي
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="h-4 w-4" />
                {t('favorites')}
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <StickyNote className="h-4 w-4" />
                {t('notes')}
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Lock className="h-4 w-4" />
                {t('security')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stories" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookText className="h-5 w-5 text-primary" />
                    قصصي
                  </CardTitle>
                  <Button asChild size="sm"><Link to="/write"><Plus className="h-4 w-4" /> جديدة</Link></Button>
                </CardHeader>
                <CardContent>
                  {myStories.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>لم تكتب أي قصة بعد.</p>
                    </div>
                  ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {myStories.map(s => (
                        <li key={s.id}>
                          <Link to={`/write/${s.id}`} className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                            <div className="w-14 h-20 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                              {s.cover_url ? <img src={s.cover_url} alt="" className="w-full h-full object-cover" /> : <BookText className="h-5 w-5 text-muted-foreground" />}
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    {t('favorites')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {favoritesLoading ? (
                    <div className="text-center py-8">
                      <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                    </div>
                  ) : favorites.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {favorites.map((fav: any) => (
                        <Link key={fav.id} to={`/book/${fav.books.id}`} className="group">
                          <div className="aspect-[3/4] rounded-lg overflow-hidden book-shadow mb-2 bg-secondary">
                            {fav.books.cover_url ? (
                              <img
                                src={fav.books.cover_url}
                                alt={fav.books.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {fav.books.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">{fav.books.author}</p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">{t('noFavorites')}</p>
                      <Link to="/">
                        <Button variant="outline">{t('browseLibrary')}</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <StickyNote className="h-5 w-5 text-primary" />
                    {t('notes')}
                  </CardTitle>
                  <Button size="sm" onClick={() => { setIsAddingNote(true); setNoteTitle(''); setNoteContent(''); }} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('addNote')}
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Add/Edit Note Form */}
                  {(isAddingNote || editingNote) && (
                    <div className="mb-6 p-4 border rounded-lg space-y-4 bg-secondary/30">
                      <Input
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder={t('noteTitle')}
                      />
                      <Textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder={t('noteContent')}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={editingNote ? handleUpdateNote : handleAddNote}
                          disabled={!noteContent.trim() || addNote.isPending || updateNote.isPending}
                          size="sm"
                        >
                          {(addNote.isPending || updateNote.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setIsAddingNote(false); setEditingNote(null); setNoteTitle(''); setNoteContent(''); }}
                        >
                          {t('cancel')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Notes List */}
                  {notes.length > 0 ? (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div key={note.id} className="p-4 border rounded-lg bg-card">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {note.title && <h4 className="font-semibold text-foreground mb-1">{note.title}</h4>}
                              <p className="text-foreground/80 whitespace-pre-wrap">{note.content}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(note.updated_at).toLocaleDateString('ar-MR')}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setEditingNote(note);
                                  setNoteTitle(note.title || '');
                                  setNoteContent(note.content);
                                  setIsAddingNote(false);
                                }}>
                                  <Pencil className="h-4 w-4 ml-2" />
                                  {t('edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 ml-2" />
                                  {t('delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !isAddingNote && (
                    <div className="text-center py-12">
                      <StickyNote className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">{t('noNotes')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    {t('changePassword')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{t('newPassword')}</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button variant="gold" onClick={handleChangePassword} disabled={isChangingPassword}>
                    {isChangingPassword ? t('loading') : t('changePassword')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    {t('forgotPassword')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">{t('email')}</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder={user?.email || ''}
                    />
                  </div>
                  <Button variant="outline" onClick={handlePasswordReset} disabled={isResetting}>
                    {isResetting ? t('loading') : t('sendResetLink')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <LogOut className="h-5 w-5" />
                    {t('logout')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={handleSignOut} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    {t('logout')}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
