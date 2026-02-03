import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Heart, Lock, Mail, LogOut, BookOpen } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال البريد الإلكتروني',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/profile?tab=security`,
      });

      if (error) throw error;

      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
      });
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إرسال الرابط',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال كلمة المرور الجديدة',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'كلمتا المرور غير متطابقتين',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'خطأ',
        description: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: 'تم تغيير كلمة المرور بنجاح',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تغيير كلمة المرور',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full gold-gradient">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                الملف الشخصي
              </h1>
              <p className="text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          <Tabs defaultValue="favorites" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="h-4 w-4" />
                الكتب المفضلة
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Lock className="h-4 w-4" />
                الأمان
              </TabsTrigger>
            </TabsList>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    الكتب المفضلة
                  </CardTitle>
                  <CardDescription>
                    الكتب التي أعجبتك وحفظتها للقراءة لاحقاً
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {favoritesLoading ? (
                    <div className="text-center py-8">
                      <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                    </div>
                  ) : favorites.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {favorites.map((fav: any) => (
                        <Link
                          key={fav.id}
                          to={`/book/${fav.books.id}`}
                          className="group"
                        >
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
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {fav.books.author}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        لم تضف أي كتب للمفضلة بعد
                      </p>
                      <Link to="/">
                        <Button variant="outline">تصفح المكتبة</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    تغيير كلمة المرور
                  </CardTitle>
                  <CardDescription>
                    قم بتحديث كلمة المرور الخاصة بك
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور الجديدة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="أعد إدخال كلمة المرور"
                    />
                  </div>
                  <Button
                    variant="gold"
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? 'جاري التحديث...' : 'تغيير كلمة المرور'}
                  </Button>
                </CardContent>
              </Card>

              {/* Reset Password by Email */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    نسيت كلمة المرور؟
                  </CardTitle>
                  <CardDescription>
                    أرسل رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder={user?.email || 'أدخل بريدك الإلكتروني'}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handlePasswordReset}
                    disabled={isResetting}
                  >
                    {isResetting ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
                  </Button>
                </CardContent>
              </Card>

              {/* Sign Out */}
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <LogOut className="h-5 w-5" />
                    تسجيل الخروج
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={handleSignOut}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج من الحساب
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
