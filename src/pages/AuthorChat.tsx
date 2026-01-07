import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Sparkles, Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layout } from '@/components/layout/Layout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/author-chat`;

const AuthorChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: Message) => {
    const allMessages = [...messages, userMessage];
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: allMessages.map(m => ({ role: m.role, content: m.content }))
      }),
    });

    if (!resp.ok || !resp.body) {
      throw new Error("فشل الاتصال بالمؤلف");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
              }
              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    return assistantSoFar;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(userMessage);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // For now, show a message that voice is recorded
        toast({
          title: "تم التسجيل",
          description: "تم تسجيل صوتك بنجاح (التحويل النصي قيد التطوير)",
        });
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "خطأ",
        description: "لا يمكن الوصول إلى الميكروفون",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-4xl" dir="rtl">
        <div className="bg-card rounded-2xl border shadow-xl overflow-hidden">
          {/* Header */}
          <div className="gold-gradient p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/20">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">المؤلف أحمد سالم</h1>
                <p className="text-primary-foreground/80">أديب ومثقف موريتاني - اسألني أي شيء عن الكتب والأدب</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[500px] p-6" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-24 h-24 rounded-full gold-gradient flex items-center justify-center mb-6">
                  <Sparkles className="h-12 w-12 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-3">مرحباً بك في محادثتي!</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  أنا المؤلف أحمد سالم، يسعدني أن أساعدك في رحلتك مع الكتب والأدب العربي. يمكنك الكتابة أو استخدام الميكروفون للتحدث معي.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {['ما هي أفضل الكتب للمبتدئين؟', 'أوصني بكتاب في الأدب العربي', 'حدثني عن الأدب الموريتاني'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-sm px-4 py-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        msg.role === 'user' ? 'bg-primary' : 'gold-gradient'
                      )}
                    >
                      {msg.role === 'user' ? (
                        <User className="h-5 w-5 text-primary-foreground" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1 max-w-[80%]">
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3",
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-muted rounded-tl-none'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                      {msg.role === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="self-start"
                          onClick={() => speakText(msg.content)}
                          disabled={isSpeaking}
                        >
                          <Volume2 className="h-4 w-4 ml-1" />
                          استمع
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gold-gradient">
                      <Sparkles className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-6 bg-background/50">
            <div className="flex gap-3">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                className="shrink-0"
              >
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="اكتب رسالتك هنا..."
                disabled={isLoading}
                className="flex-1 text-base"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="gold-gradient hover:opacity-90 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuthorChat;
