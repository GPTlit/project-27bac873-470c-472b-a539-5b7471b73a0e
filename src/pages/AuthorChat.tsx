import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Sparkles, Mic, Volume2, Trash2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layout } from '@/components/layout/Layout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
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

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
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
      audioChunksRef.current = [];

      // Setup audio analyzer for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Animate audio level
      const updateLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioLevel(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
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
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    
    const stream = mediaRecorderRef.current?.stream;
    stream?.getTracks().forEach(t => t.stop());
    
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingDuration(0);
    setAudioLevel(0);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    
    try {
      // Transcribe audio using OpenAI
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const transcribeResp = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (transcribeResp.error) {
        throw new Error(transcribeResp.error.message);
      }

      if (transcribeResp.data?.text) {
        // Send the transcribed text as a message
        setAudioBlob(null);
        setRecordingDuration(0);
        setIsTranscribing(false);
        await sendMessage(transcribeResp.data.text);
      } else {
        throw new Error('لم يتم التعرف على الكلام');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "خطأ في التحويل",
        description: error instanceof Error ? error.message : "فشل تحويل الصوت إلى نص",
        variant: "destructive"
      });
      setIsTranscribing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            {/* Recording UI */}
            {(isRecording || audioBlob) && (
              <div className="mb-4 flex items-center gap-3 p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                {isRecording ? (
                  <>
                    {/* Recording animation */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                        <div 
                          className="absolute inset-0 bg-destructive rounded-full animate-ping opacity-75"
                          style={{ transform: `scale(${1 + audioLevel * 2})` }}
                        />
                      </div>
                      {/* Audio wave animation */}
                      <div className="flex items-center gap-0.5 h-8">
                        {[...Array(12)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-destructive rounded-full transition-all duration-100"
                            style={{ 
                              height: `${Math.max(4, (Math.sin(Date.now() / 100 + i) * 0.5 + 0.5) * audioLevel * 32)}px`,
                              opacity: 0.5 + audioLevel * 0.5
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-destructive font-mono text-sm min-w-[50px]">
                      {formatDuration(recordingDuration)}
                    </span>
                    <span className="text-destructive/70 text-sm flex-1">جاري التسجيل...</span>
                    <Button variant="ghost" size="icon" onClick={cancelRecording} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                    <Button size="icon" onClick={stopRecording} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      <Square className="h-4 w-4" />
                    </Button>
                  </>
                ) : audioBlob && (
                  <>
                    <Mic className="h-5 w-5 text-primary" />
                    <span className="font-mono text-sm">{formatDuration(recordingDuration)}</span>
                    <audio src={URL.createObjectURL(audioBlob)} controls className="flex-1 h-8" />
                    <Button variant="ghost" size="icon" onClick={cancelRecording} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                    <Button 
                      size="icon" 
                      onClick={sendVoiceMessage} 
                      disabled={isTranscribing}
                      className="gold-gradient"
                    >
                      {isTranscribing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-3">
              {!audioBlob && (
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  className="shrink-0"
                >
                  {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
                </Button>
              )}
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="اكتب رسالتك هنا..."
                disabled={isLoading || isRecording || !!audioBlob}
                className="flex-1 text-base"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim() || isRecording || !!audioBlob}
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
