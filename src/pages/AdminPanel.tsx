import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useFeatureToggles, useActiveTheme, useInvalidateConfig } from '@/hooks/useAppConfig';
import { Bot, Send, Loader2, Settings, Palette, ToggleLeft, MessageSquare, Sparkles } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AdminPanel = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const invalidateConfig = useInvalidateConfig();

  const { data: features, refetch: refetchFeatures } = useFeatureToggles();
  const { data: theme, refetch: refetchTheme } = useActiveTheme();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const parseAndExecuteActions = async (aiMessage: string) => {
    const actionRegex = /```action\n([\s\S]*?)\n```/g;
    let match;
    const actions: any[] = [];

    while ((match = actionRegex.exec(aiMessage)) !== null) {
      try {
        const action = JSON.parse(match[1]);
        actions.push(action);
      } catch (e) {
        console.error('Failed to parse action:', e);
      }
    }

    for (const action of actions) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ executeAction: action }),
          }
        );

        const result = await response.json();
        
        if (result.success) {
          toast({
            title: 'تم التنفيذ',
            description: result.message,
          });
          invalidateConfig();
          refetchFeatures();
          refetchTheme();
        } else {
          toast({
            title: 'خطأ',
            description: result.message,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Action execution failed:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: ChatMessage = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, aiMessage]);

      // Parse and execute any actions in the response
      await parseAndExecuteActions(data.message);

    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء التواصل مع المساعد',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeature = async (featureKey: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('feature_toggles')
        .update({ enabled })
        .eq('feature_key', featureKey);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: `تم ${enabled ? 'تفعيل' : 'تعطيل'} الميزة`,
      });

      refetchFeatures();
      invalidateConfig();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatMessage = (content: string) => {
    // Remove action blocks from display
    return content.replace(/```action\n[\s\S]*?\n```/g, '').trim();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">لوحة التحكم الذكية</h1>
            <p className="text-muted-foreground">إدارة التطبيق بمساعدة الذكاء الاصطناعي</p>
          </div>
        </div>

        <Tabs defaultValue="ai" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              المساعد الذكي
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <ToggleLeft className="h-4 w-4" />
              الميزات
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              المظهر
            </TabsTrigger>
          </TabsList>

          {/* AI Assistant Tab */}
          <TabsContent value="ai">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  مساعد الإدارة الذكي
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea ref={scrollRef} className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <Bot className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">مرحباً بك في لوحة التحكم الذكية</h3>
                      <p className="text-muted-foreground max-w-md">
                        يمكنني مساعدتك في تعديل التطبيق. جرّب أن تقول:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        <Badge variant="secondary" className="cursor-pointer" onClick={() => setInput('فعّل ميزة التعليقات')}>
                          فعّل ميزة التعليقات
                        </Badge>
                        <Badge variant="secondary" className="cursor-pointer" onClick={() => setInput('غيّر اللون الرئيسي إلى أزرق داكن')}>
                          غيّر اللون الرئيسي
                        </Badge>
                        <Badge variant="secondary" className="cursor-pointer" onClick={() => setInput('أضف قسم التقييمات لصفحة الكتاب')}>
                          أضف قسم التقييمات
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{formatMessage(msg.content)}</p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-end">
                          <div className="bg-muted rounded-2xl px-4 py-3">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="اكتب أمراً للمساعد الذكي..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>الميزات المتاحة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {features?.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{getFeatureLabel(feature.feature_key)}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={(checked) => toggleFeature(feature.feature_key, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات المظهر</CardTitle>
              </CardHeader>
              <CardContent>
                {theme && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-4">الألوان الحالية</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(theme.colors || {}).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div
                              className="w-10 h-10 rounded-lg border"
                              style={{ backgroundColor: `hsl(${value})` }}
                            />
                            <div>
                              <p className="font-medium">{getColorLabel(key)}</p>
                              <p className="text-xs text-muted-foreground">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-4">الخطوط</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(theme.fonts || {}).map(([key, value]) => (
                          <div key={key} className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground">{key === 'heading' ? 'العناوين' : 'النص'}</p>
                            <p className="font-medium" style={{ fontFamily: value }}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      استخدم المساعد الذكي لتغيير الألوان والخطوط. مثال: "غيّر اللون الرئيسي إلى أخضر"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

function getFeatureLabel(key: string): string {
  const labels: Record<string, string> = {
    comments: 'التعليقات',
    book_likes: 'الإعجاب بالكتب',
    comment_likes: 'الإعجاب بالتعليقات',
    premium_content: 'المحتوى المميز',
    audiobooks: 'الكتب الصوتية',
    ratings: 'التقييمات',
    related_books: 'الكتب ذات الصلة',
  };
  return labels[key] || key;
}

function getColorLabel(key: string): string {
  const labels: Record<string, string> = {
    primary: 'الرئيسي',
    secondary: 'الثانوي',
    accent: 'اللون المميز',
    background: 'الخلفية',
    foreground: 'النص',
  };
  return labels[key] || key;
}

export default AdminPanel;
