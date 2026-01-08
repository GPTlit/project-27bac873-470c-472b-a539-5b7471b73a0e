import { useState, useEffect, useRef, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, Send, Mic, MicOff, Image, FileUp, Book, Users, 
  Settings, Search, Check, X, Loader2, Sparkles, Trash2, Square
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useBooks } from '@/hooks/useBooks';

interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
}

interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string | null;
  message_type: string;
  media_url: string | null;
  book_id: string | null;
  is_ai_mention: boolean;
  ai_response: string | null;
  created_at: string;
  user_profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  book?: {
    title: string;
    author: string;
    cover_url: string | null;
  };
}

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const Eterke = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const booksQuery = useBooks();
  const books = booksQuery.data || [];
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showBookShare, setShowBookShare] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [memberUsername, setMemberUsername] = useState('');
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileDisplayName, setProfileDisplayName] = useState('');
  
  // Voice recording states
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load user profile
  useEffect(() => {
    if (user) {
      loadMyProfile();
      loadGroups();
    }
  }, [user]);

  // Load messages when group selected
  useEffect(() => {
    if (selectedGroup) {
      loadMessages(selectedGroup.id);
      subscribeToMessages(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadMyProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setMyProfile(data);
    } else {
      setShowProfileSetup(true);
    }
  };

  const createProfile = async () => {
    if (!user || !profileUsername.trim()) return;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        username: profileUsername.toLowerCase().trim(),
        display_name: profileDisplayName.trim() || profileUsername.trim()
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "خطأ",
        description: error.message.includes('duplicate') ? "اسم المستخدم مستخدم بالفعل" : error.message,
        variant: "destructive"
      });
      return;
    }

    setMyProfile(data);
    setShowProfileSetup(false);
    toast({ title: "تم إنشاء الملف الشخصي بنجاح!" });
  };

  const loadGroups = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('groups')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (data) setGroups(data);
  };

  const loadMessages = async (groupId: string) => {
    const { data } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      // Load user profiles for messages
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', userIds);
      
      if (profiles) {
        const profileMap = new Map(profiles.map(p => [p.user_id, p]));
        setUserProfiles(profileMap);
      }

      // Load book info for book shares
      const bookIds = data.filter(m => m.book_id).map(m => m.book_id);
      if (bookIds.length > 0) {
        const { data: booksData } = await supabase
          .from('books')
          .select('id, title, author, cover_url')
          .in('id', bookIds);
        
        const bookMap = new Map(booksData?.map(b => [b.id, b]) || []);
        setMessages(data.map(m => ({
          ...m,
          book: m.book_id ? bookMap.get(m.book_id) : undefined
        })));
      } else {
        setMessages(data);
      }
    }
  };

  const subscribeToMessages = (groupId: string) => {
    const channel = supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`
      }, async (payload) => {
        const newMsg = payload.new as GroupMessage;
        
        // Get user profile
        if (!userProfiles.has(newMsg.user_id)) {
          const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', newMsg.user_id)
            .single();
          if (data) {
            setUserProfiles(prev => new Map(prev).set(newMsg.user_id, data));
          }
        }

        setMessages(prev => [...prev, newMsg]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createGroup = async () => {
    if (!user || !newGroupName.trim()) return;
    
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || null,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      return;
    }

    // Add creator as member
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin'
    });

    setGroups(prev => [group, ...prev]);
    setSelectedGroup(group);
    setShowCreateGroup(false);
    setNewGroupName('');
    setNewGroupDesc('');
    toast({ title: "تم إنشاء المجموعة بنجاح!" });
  };

  const addMember = async () => {
    if (!selectedGroup || !memberUsername.trim()) return;
    
    // Find user by username
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('username', memberUsername.toLowerCase().trim())
      .single();

    if (!profile) {
      toast({ title: "خطأ", description: "لم يتم العثور على المستخدم", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('group_members').insert({
      group_id: selectedGroup.id,
      user_id: profile.user_id
    });

    if (error) {
      toast({ title: "خطأ", description: "المستخدم عضو بالفعل أو حدث خطأ", variant: "destructive" });
      return;
    }

    setShowAddMember(false);
    setMemberUsername('');
    toast({ title: "تمت إضافة العضو بنجاح!" });
  };

  const sendMessage = async (type: string = 'text', mediaUrl?: string, bookId?: string) => {
    if (!user || !selectedGroup || (!newMessage.trim() && type === 'text')) return;
    
    const content = newMessage.trim();
    const isAiMention = content.includes('@author') || content.includes('@المؤلف');
    
    setIsLoading(true);
    setNewMessage('');

    const { error } = await supabase.from('group_messages').insert({
      group_id: selectedGroup.id,
      user_id: user.id,
      content: type === 'text' ? content : null,
      message_type: type,
      media_url: mediaUrl || null,
      book_id: bookId || null,
      is_ai_mention: isAiMention
    });

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      setNewMessage(content);
    }

    // If AI is mentioned, get response
    if (isAiMention) {
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/author-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: [{ role: 'user', content: content.replace(/@(author|المؤلف)/gi, '').trim() }]
          }),
        });

        if (resp.ok && resp.body) {
          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let aiResponse = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const json = JSON.parse(line.slice(6));
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) aiResponse += content;
                } catch {}
              }
            }
          }

          if (aiResponse) {
            await supabase.from('group_messages').insert({
              group_id: selectedGroup.id,
              user_id: user.id, // AI uses system but we track who triggered it
              content: aiResponse,
              message_type: 'ai_response',
              is_ai_mention: false,
              ai_response: aiResponse
            });
          }
        }
      } catch (e) {
        console.error('AI response error:', e);
      }
    }

    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedGroup) return;

    const ext = file.name.split('.').pop();
    const path = `${selectedGroup.id}/${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('chat-media').upload(path, file);
    if (error) {
      toast({ title: "خطأ", description: "فشل رفع الملف", variant: "destructive" });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);
    sendMessage(type, publicUrl);
  };

  const shareBook = async (bookId: string) => {
    await sendMessage('book_share', undefined, bookId);
    setShowBookShare(false);
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
    } catch (e) {
      toast({ title: "خطأ", description: "لا يمكن الوصول للميكروفون", variant: "destructive" });
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
    if (!audioBlob || !user || !selectedGroup) return;
    
    setIsTranscribing(true);
    
    try {
      // Upload audio
      const path = `${selectedGroup.id}/${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, audioBlob);
      
      if (uploadError) {
        toast({ title: "خطأ", description: "فشل رفع الملف الصوتي", variant: "destructive" });
        setIsTranscribing(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);

      // Transcribe audio using OpenAI
      let transcribedText = '';
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64Audio = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const transcribeResp = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (transcribeResp.data?.text) {
          transcribedText = transcribeResp.data.text;
        }
      } catch (transcribeError) {
        console.error('Transcription error:', transcribeError);
      }

      // Send as voice message with transcription
      const { error } = await supabase.from('group_messages').insert({
        group_id: selectedGroup.id,
        user_id: user.id,
        content: transcribedText || null,
        message_type: 'voice',
        media_url: publicUrl,
        is_ai_mention: false
      });

      if (error) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      }
    } catch (e) {
      console.error('Send voice error:', e);
      toast({ title: "خطأ", description: "فشل إرسال الرسالة الصوتية", variant: "destructive" });
    }

    setAudioBlob(null);
    setRecordingDuration(0);
    setIsTranscribing(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Profile setup dialog
  if (showProfileSetup) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4 max-w-md" dir="rtl">
          <div className="bg-card rounded-2xl border p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">إعداد الملف الشخصي</h2>
            <p className="text-muted-foreground mb-6">لاستخدام ETERKE، يرجى إنشاء اسم مستخدم</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">اسم المستخدم *</label>
                <Input 
                  value={profileUsername}
                  onChange={(e) => setProfileUsername(e.target.value)}
                  placeholder="username"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">الاسم الظاهر</label>
                <Input 
                  value={profileDisplayName}
                  onChange={(e) => setProfileDisplayName(e.target.value)}
                  placeholder="اسمك"
                  className="mt-1"
                />
              </div>
              <Button onClick={createProfile} className="w-full gold-gradient">
                إنشاء الملف الشخصي
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-4 px-4" dir="rtl">
        <div className="bg-card rounded-2xl border shadow-lg overflow-hidden h-[calc(100vh-200px)] flex">
          {/* Sidebar - Groups */}
          <div className="w-80 border-l flex flex-col">
            <div className="p-4 border-b gold-gradient">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-primary-foreground">ETERKE</h2>
                <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20">
                      <Plus className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إنشاء مجموعة جديدة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Input 
                        placeholder="اسم المجموعة"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                      <Input 
                        placeholder="وصف المجموعة (اختياري)"
                        value={newGroupDesc}
                        onChange={(e) => setNewGroupDesc(e.target.value)}
                      />
                      <Button onClick={createGroup} className="w-full gold-gradient">
                        إنشاء المجموعة
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {myProfile && (
                <p className="text-xs text-primary-foreground/70 mt-1">@{myProfile.username}</p>
              )}
            </div>

            <ScrollArea className="flex-1">
              {groups.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد مجموعات بعد</p>
                  <p className="text-sm">ابدأ بإنشاء مجموعة جديدة!</p>
                </div>
              ) : (
                groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={cn(
                      "w-full p-4 flex items-center gap-3 hover:bg-muted transition-colors text-right",
                      selectedGroup?.id === group.id && "bg-muted"
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={group.avatar_url || undefined} />
                      <AvatarFallback className="gold-gradient text-primary-foreground">
                        {group.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{group.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          {selectedGroup ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between bg-background">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedGroup.avatar_url || undefined} />
                    <AvatarFallback className="gold-gradient text-primary-foreground">
                      {selectedGroup.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedGroup.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedGroup.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Users className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl">
                      <DialogHeader>
                        <DialogTitle>إضافة عضو</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <Input 
                          placeholder="اسم المستخدم"
                          value={memberUsername}
                          onChange={(e) => setMemberUsername(e.target.value)}
                        />
                        <Button onClick={addMember} className="w-full gold-gradient">
                          إضافة
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const profile = userProfiles.get(msg.user_id);
                    const isMe = msg.user_id === user?.id;
                    const isAI = msg.message_type === 'ai_response';

                    return (
                      <div
                        key={msg.id}
                        className={cn("flex gap-2", isMe ? "flex-row" : "flex-row-reverse")}
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          {isAI ? (
                            <AvatarFallback className="gold-gradient">
                              <Sparkles className="h-4 w-4 text-primary-foreground" />
                            </AvatarFallback>
                          ) : (
                            <>
                              <AvatarImage src={profile?.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {profile?.display_name?.slice(0, 2) || '??'}
                              </AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        <div className={cn("max-w-[70%]", isMe ? "" : "items-end")}>
                          <p className={cn("text-xs text-muted-foreground mb-1", isMe ? "text-right" : "text-left")}>
                            {isAI ? 'المؤلف أحمد سالم' : (profile?.display_name || profile?.username || 'مجهول')}
                          </p>
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2",
                              isAI ? "bg-amber-100 dark:bg-amber-900/30" :
                              isMe ? "bg-primary text-primary-foreground rounded-tr-none" : 
                              "bg-muted rounded-tl-none"
                            )}
                          >
                            {msg.message_type === 'text' || msg.message_type === 'ai_response' ? (
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            ) : msg.message_type === 'voice' ? (
                              <div className="space-y-2">
                                <audio src={msg.media_url || ''} controls className="max-w-[200px]" />
                                {msg.content && (
                                  <p className="text-xs opacity-80 italic">"{msg.content}"</p>
                                )}
                              </div>
                            ) : msg.message_type === 'image' ? (
                              <img src={msg.media_url || ''} alt="" className="max-w-[200px] rounded-lg" />
                            ) : msg.message_type === 'video' ? (
                              <video src={msg.media_url || ''} controls className="max-w-[200px] rounded-lg" />
                            ) : msg.message_type === 'file' ? (
                              <a href={msg.media_url || ''} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm underline">
                                <FileUp className="h-4 w-4" /> ملف
                              </a>
                            ) : msg.message_type === 'book_share' && msg.book ? (
                              <div className="flex items-center gap-3 p-2 bg-background/50 rounded-lg">
                                <img src={msg.book.cover_url || '/placeholder.svg'} alt="" className="w-12 h-16 object-cover rounded" />
                                <div>
                                  <p className="font-medium text-sm">{msg.book.title}</p>
                                  <p className="text-xs text-muted-foreground">{msg.book.author}</p>
                                </div>
                              </div>
                            ) : null}
                          </div>
                          <p className={cn("text-xs text-muted-foreground mt-1", isMe ? "text-right" : "text-left")}>
                            {new Date(msg.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t bg-background/50">
                {/* Recording UI */}
                {(isRecording || audioBlob) && (
                  <div className="mb-3 flex items-center gap-3 p-3 bg-destructive/10 rounded-xl border border-destructive/20">
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

                <div className="flex gap-2 items-center">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'image')}
                    accept="image/*,video/*"
                  />
                  <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isRecording || !!audioBlob}>
                    <Image className="h-5 w-5" />
                  </Button>
                  <Dialog open={showBookShare} onOpenChange={setShowBookShare}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isRecording || !!audioBlob}>
                        <Book className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl" className="max-w-lg max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>مشاركة كتاب</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[400px] mt-4">
                        <div className="grid grid-cols-2 gap-3">
                          {books.map((book) => (
                            <button
                              key={book.id}
                              onClick={() => shareBook(book.id)}
                              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors text-right"
                            >
                              <img src={book.cover_url || '/placeholder.svg'} alt="" className="w-10 h-14 object-cover rounded" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{book.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  
                  {!audioBlob && (
                    <Button 
                      variant={isRecording ? "destructive" : "ghost"} 
                      size="icon"
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
                    </Button>
                  )}
                  
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="اكتب رسالة... (@المؤلف للتحدث مع الذكاء الاصطناعي)"
                    className="flex-1"
                    disabled={isRecording || !!audioBlob}
                  />
                  <Button 
                    onClick={() => sendMessage()}
                    disabled={isLoading || !newMessage.trim() || isRecording || !!audioBlob}
                    size="icon"
                    className="gold-gradient"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">مرحباً بك في ETERKE</h3>
                <p className="text-muted-foreground mb-4">اختر مجموعة للبدء أو أنشئ مجموعة جديدة</p>
                <Button onClick={() => setShowCreateGroup(true)} className="gold-gradient">
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء مجموعة
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Eterke;
