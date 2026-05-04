import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Send, Mic, Image, FileUp, Book, Users, 
  Loader2, Sparkles, Trash2, Square, Camera, UserPlus, X, MessageCircle, User
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

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  username?: string;
  display_name?: string;
}

interface Message {
  id: string;
  user_id: string;
  sender_id?: string;
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

interface PrivateConversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  other_user?: UserProfile;
}

type ChatType = 'groups' | 'private';
type SelectedChat = { type: 'group'; data: Group } | { type: 'private'; data: PrivateConversation } | null;

const Eterke = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const booksQuery = useBooks();
  const books = booksQuery.data || [];
  
  // Chat type toggle
  const [chatType, setChatType] = useState<ChatType>('groups');
  
  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedChat, setSelectedChat] = useState<SelectedChat>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  
  // Private conversations state
  const [privateConversations, setPrivateConversations] = useState<PrivateConversation[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  
  // Common state
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showBookShare, setShowBookShare] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [memberUsername, setMemberUsername] = useState('');
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  
  // Voice recording states
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      loadPrivateConversations();
      loadAllUsers();
    }
  }, [user]);

  // Load messages when chat selected
  useEffect(() => {
    if (selectedChat) {
      if (selectedChat.type === 'group') {
        loadGroupMessages(selectedChat.data.id);
        subscribeToGroupMessages(selectedChat.data.id);
        loadGroupMembers(selectedChat.data.id);
      } else {
        loadPrivateMessages(selectedChat.data.id);
        subscribeToPrivateMessages(selectedChat.data.id);
      }
    }
    return () => {
      // Cleanup subscriptions handled in subscribe functions
    };
  }, [selectedChat?.type, selectedChat?.data?.id]);

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
    
    const { data: memberGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);
    
    if (memberGroups && memberGroups.length > 0) {
      const groupIds = memberGroups.map(m => m.group_id);
      const { data } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('updated_at', { ascending: false });
      
      if (data) setGroups(data);
    } else {
      setGroups([]);
    }
  };

  const loadPrivateConversations = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('private_conversations')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });
    
    if (data) {
      // Get other user profiles
      const otherUserIds = data.map(c => c.user1_id === user.id ? c.user2_id : c.user1_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', otherUserIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const convsWithUsers = data.map(c => ({
        ...c,
        other_user: profileMap.get(c.user1_id === user.id ? c.user2_id : c.user1_id)
      }));
      setPrivateConversations(convsWithUsers);
    }
  };

  const loadAllUsers = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .neq('user_id', user.id)
      .limit(100);
    
    if (data) setAllUsers(data);
  };

  const loadGroupMembers = async (groupId: string) => {
    const { data } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId);
    
    if (data) {
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const membersWithNames = data.map(m => ({
        ...m,
        username: profileMap.get(m.user_id)?.username,
        display_name: profileMap.get(m.user_id)?.display_name
      }));
      setGroupMembers(membersWithNames);
    }
  };

  const getSignedMediaUrl = async (mediaRef: string): Promise<string | null> => {
    if (!mediaRef) return null;

    let filePath = mediaRef;
    const legacyMarker = '/storage/v1/object/public/chat-media/';
    if (mediaRef.includes(legacyMarker)) {
      const parts = mediaRef.split(legacyMarker);
      if (parts.length >= 2) filePath = parts[1];
    }

    const { data, error } = await supabase.storage
      .from('chat-media')
      .createSignedUrl(filePath, 60 * 60);

    if (error || !data?.signedUrl) {
      console.error('Failed to get signed URL:', error);
      return null;
    }

    return data.signedUrl;
  };

  const loadGroupMessages = async (groupId: string) => {
    const { data } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', userIds);
      
      if (profiles) {
        const profileMap = new Map(profiles.map(p => [p.user_id, p]));
        setUserProfiles(profileMap);
      }

      const messagesWithSignedUrls = await Promise.all(
        data.map(async (m) => {
          if (m.media_url && ['voice', 'image', 'video', 'file'].includes(m.message_type)) {
            const signedUrl = await getSignedMediaUrl(m.media_url);
            return { ...m, media_url: signedUrl };
          }
          return m;
        })
      );

      const bookIds = messagesWithSignedUrls.filter(m => m.book_id).map(m => m.book_id);
      if (bookIds.length > 0) {
        const { data: booksData } = await supabase
          .from('books')
          .select('id, title, author, cover_url')
          .in('id', bookIds);
        
        const bookMap = new Map(booksData?.map(b => [b.id, b]) || []);
        setMessages(messagesWithSignedUrls.map(m => ({
          ...m,
          book: m.book_id ? bookMap.get(m.book_id) : undefined
        })));
      } else {
        setMessages(messagesWithSignedUrls);
      }
    }
  };

  const loadPrivateMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('private_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      const userIds = [...new Set(data.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', userIds);
      
      if (profiles) {
        const profileMap = new Map(profiles.map(p => [p.user_id, p]));
        setUserProfiles(profileMap);
      }

      const messagesWithSignedUrls = await Promise.all(
        data.map(async (m) => {
          if (m.media_url && ['voice', 'image', 'video', 'file'].includes(m.message_type)) {
            const signedUrl = await getSignedMediaUrl(m.media_url);
            return { ...m, user_id: m.sender_id, media_url: signedUrl };
          }
          return { ...m, user_id: m.sender_id };
        })
      );

      const bookIds = messagesWithSignedUrls.filter(m => m.book_id).map(m => m.book_id);
      if (bookIds.length > 0) {
        const { data: booksData } = await supabase
          .from('books')
          .select('id, title, author, cover_url')
          .in('id', bookIds);
        
        const bookMap = new Map(booksData?.map(b => [b.id, b]) || []);
        setMessages(messagesWithSignedUrls.map(m => ({
          ...m,
          book: m.book_id ? bookMap.get(m.book_id) : undefined
        })));
      } else {
        setMessages(messagesWithSignedUrls);
      }
    }
  };

  const subscribeToGroupMessages = (groupId: string) => {
    const channel = supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`
      }, async (payload) => {
        const newMsg = payload.new as Message;
        
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

        let processedMsg = newMsg;
        if (newMsg.media_url && ['voice', 'image', 'video', 'file'].includes(newMsg.message_type)) {
          const signedUrl = await getSignedMediaUrl(newMsg.media_url);
          processedMsg = { ...newMsg, media_url: signedUrl };
        }

        setMessages(prev => [...prev, processedMsg]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToPrivateMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`private-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        const newMsg = payload.new as any;
        const msgWithUserId = { ...newMsg, user_id: newMsg.sender_id };
        
        if (!userProfiles.has(msgWithUserId.user_id)) {
          const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', msgWithUserId.user_id)
            .single();
          if (data) {
            setUserProfiles(prev => new Map(prev).set(msgWithUserId.user_id, data));
          }
        }

        let processedMsg = msgWithUserId;
        if (msgWithUserId.media_url && ['voice', 'image', 'video', 'file'].includes(msgWithUserId.message_type)) {
          const signedUrl = await getSignedMediaUrl(msgWithUserId.media_url);
          processedMsg = { ...msgWithUserId, media_url: signedUrl };
        }

        setMessages(prev => [...prev, processedMsg]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createGroup = async () => {
    if (!user || !newGroupName.trim()) {
      toast({ title: "أدخل اسم المجموعة", variant: "destructive" });
      return;
    }

    setIsCreatingGroup(true);

    try {
      // Use the secure RPC function for atomic group creation
      const { data: groupId, error } = await supabase
        .rpc('create_group_with_members', {
          _name: newGroupName.trim(),
          _description: null,
          _member_ids: []
        });

      if (error || !groupId) {
        throw new Error(error?.message || "فشل إنشاء المجموعة");
      }

      // Fetch the created group
      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (fetchError || !group) {
        throw new Error("فشل استرداد المجموعة");
      }

      setGroups(prev => [group, ...prev]);
      setSelectedChat({ type: 'group', data: group });
      setShowCreateGroup(false);
      setNewGroupName('');
      toast({ title: "تم إنشاء المجموعة! 🎉" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const startPrivateConversation = async (otherUser: UserProfile) => {
    if (!user) return;
    
    // Check if conversation already exists
    const existing = privateConversations.find(
      c => c.other_user?.user_id === otherUser.user_id
    );
    
    if (existing) {
      setSelectedChat({ type: 'private', data: existing });
      setChatType('private');
      setShowNewChat(false);
      return;
    }
    
    // Create new conversation
    const { data, error } = await supabase
      .from('private_conversations')
      .insert({
        user1_id: user.id,
        user2_id: otherUser.user_id
      })
      .select()
      .single();
    
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      return;
    }
    
    const newConv = { ...data, other_user: otherUser };
    setPrivateConversations(prev => [newConv, ...prev]);
    setSelectedChat({ type: 'private', data: newConv });
    setChatType('private');
    setShowNewChat(false);
    toast({ title: `بدأت محادثة مع ${otherUser.display_name || otherUser.username}` });
  };

  const addMember = async () => {
    if (!selectedChat || selectedChat.type !== 'group' || !memberUsername.trim()) return;
    
    setIsAddingMember(true);
    
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name')
        .eq('username', memberUsername.toLowerCase().trim())
        .single();

      if (!profile) {
        toast({ title: "لم يتم العثور على المستخدم", description: `@${memberUsername} غير موجود`, variant: "destructive" });
        return;
      }

      const existing = groupMembers.find(m => m.user_id === profile.user_id);
      if (existing) {
        toast({ title: "العضو موجود بالفعل", variant: "destructive" });
        return;
      }

      // Use the secure RPC function for inviting members
      const { error } = await supabase
        .rpc('invite_to_group', {
          _group_id: selectedChat.data.id,
          _user_id: profile.user_id
        });

      if (error) {
        throw new Error(error.message);
      }

      setGroupMembers(prev => [...prev, { 
        id: Date.now().toString(), 
        user_id: profile.user_id, 
        role: 'member',
        username: profile.username,
        display_name: profile.display_name
      }]);
      setMemberUsername('');
      toast({ title: `تمت إضافة @${profile.username}! ✓` });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setIsAddingMember(false);
    }
  };

  const uploadGroupAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat || selectedChat.type !== 'group' || !user) return;

    const ext = file.name.split('.').pop();
    const path = `group-avatars/${selectedChat.data.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "خطأ", description: "فشل رفع الصورة", variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path);

    const { error: updateError } = await supabase
      .from('groups')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', selectedChat.data.id);

    if (!updateError) {
      const updatedGroup = { ...selectedChat.data, avatar_url: urlData.publicUrl };
      setSelectedChat({ type: 'group', data: updatedGroup });
      setGroups(prev => prev.map(g => g.id === selectedChat.data.id ? updatedGroup : g));
      toast({ title: "تم تحديث صورة المجموعة!" });
    }
  };

  const removeMember = async (memberId: string, userId: string) => {
    if (!selectedChat || selectedChat.type !== 'group' || userId === user?.id) return;

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId);

    if (!error) {
      setGroupMembers(prev => prev.filter(m => m.id !== memberId));
      toast({ title: "تم إزالة العضو" });
    }
  };

  const sendMessage = async (type: string = 'text', mediaUrl?: string, bookId?: string) => {
    if (!user || !selectedChat || (!newMessage.trim() && type === 'text')) return;
    
    const content = newMessage.trim();
    const isAiMention = content.includes('@author') || content.includes('@المؤلف');
    
    setIsLoading(true);
    setNewMessage('');

    if (selectedChat.type === 'group') {
      const { error } = await supabase.from('group_messages').insert({
        group_id: selectedChat.data.id,
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
                group_id: selectedChat.data.id,
                user_id: user.id,
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
    } else {
      // Private message
      const { error } = await supabase.from('private_messages').insert({
        conversation_id: selectedChat.data.id,
        sender_id: user.id,
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
      
      // Update conversation timestamp
      await supabase.from('private_conversations').update({ updated_at: new Date().toISOString() }).eq('id', selectedChat.data.id);
    }

    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedChat) return;

    const chatId = selectedChat.data.id;
    const ext = file.name.split('.').pop();
    const path = `${chatId}/${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('chat-media').upload(path, file);
    if (error) {
      toast({ title: "خطأ", description: "فشل رفع الملف", variant: "destructive" });
      return;
    }

    sendMessage(type, path);
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

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

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

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !user || !selectedChat) return;

    setIsTranscribing(true);

    try {
      const chatId = selectedChat.data.id;
      const path = `${chatId}/${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, audioBlob);

      if (uploadError) {
        toast({ title: "خطأ", description: "فشل رفع الملف الصوتي", variant: "destructive" });
        setIsTranscribing(false);
        return;
      }

      let transcribedText = '';
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64Audio = arrayBufferToBase64(arrayBuffer);

        const transcribeResp = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio },
        });

        if (transcribeResp.data?.text) {
          transcribedText = transcribeResp.data.text;
        }
      } catch (transcribeError) {
        console.error('Transcription error:', transcribeError);
      }

      if (selectedChat.type === 'group') {
        const { error } = await supabase.from('group_messages').insert({
          group_id: chatId,
          user_id: user.id,
          content: transcribedText || null,
          message_type: 'voice',
          media_url: path,
          is_ai_mention: false,
        });

        if (error) {
          toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
      } else {
        const { error } = await supabase.from('private_messages').insert({
          conversation_id: chatId,
          sender_id: user.id,
          content: transcribedText || null,
          message_type: 'voice',
          media_url: path,
          is_ai_mention: false,
        });

        if (error) {
          toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
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

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.display_name?.toLowerCase() || '').includes(searchUser.toLowerCase())
  );

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

  const getChatName = () => {
    if (!selectedChat) return '';
    if (selectedChat.type === 'group') return selectedChat.data.name;
    return selectedChat.data.other_user?.display_name || selectedChat.data.other_user?.username || 'محادثة';
  };

  const getChatAvatar = () => {
    if (!selectedChat) return null;
    if (selectedChat.type === 'group') return selectedChat.data.avatar_url;
    return selectedChat.data.other_user?.avatar_url;
  };

  return (
    <Layout>
      <div className="container mx-auto py-2 sm:py-4 px-2 sm:px-4" dir="rtl">
        <div className="bg-card rounded-xl sm:rounded-2xl border shadow-lg overflow-hidden h-[calc(100vh-140px)] sm:h-[calc(100vh-200px)] flex flex-col md:flex-row">
          {/* Sidebar - Hidden on mobile when chat is selected */}
          <div className={cn(
            "border-l flex flex-col transition-all duration-300",
            selectedChat && !showSidebar ? "hidden md:flex md:w-80" : "w-full md:w-80",
            !selectedChat && "w-full md:w-80"
          )}>
            <div className="p-4 border-b gold-gradient">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-primary-foreground">ETERKE</h2>
                <div className="flex gap-1">
                  {/* New Private Chat */}
                  <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20">
                        <MessageCircle className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl" className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>محادثة جديدة</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <Input 
                          placeholder="ابحث عن مستخدم..."
                          value={searchUser}
                          onChange={(e) => setSearchUser(e.target.value)}
                        />
                        <ScrollArea className="h-64">
                          {filteredUsers.map(u => (
                            <button
                              key={u.id}
                              onClick={() => startPrivateConversation(u)}
                              className="w-full p-3 flex items-center gap-3 hover:bg-muted rounded-lg text-right"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={u.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {(u.display_name || u.username).slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{u.display_name || u.username}</p>
                                <p className="text-xs text-muted-foreground">@{u.username}</p>
                              </div>
                            </button>
                          ))}
                          {filteredUsers.length === 0 && (
                            <p className="text-center text-muted-foreground py-4">لا يوجد مستخدمين</p>
                          )}
                        </ScrollArea>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* New Group */}
                  <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20">
                        <Plus className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl" className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>مجموعة جديدة</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <Input 
                          placeholder="اسم المجموعة"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && createGroup()}
                          autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                          يمكنك إضافة الأعضاء والصورة بعد الإنشاء
                        </p>
                        <Button 
                          onClick={createGroup} 
                          className="w-full gold-gradient"
                          disabled={isCreatingGroup || !newGroupName.trim()}
                        >
                          {isCreatingGroup ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                          إنشاء
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              {myProfile && (
                <p className="text-xs text-primary-foreground/70 mt-1">@{myProfile.username}</p>
              )}
            </div>

            {/* Chat Type Tabs */}
            <Tabs value={chatType} onValueChange={(v) => setChatType(v as ChatType)} className="border-b">
              <TabsList className="w-full grid grid-cols-2 h-12 rounded-none bg-muted/50">
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  مجموعات
                </TabsTrigger>
                <TabsTrigger value="private" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  خاص
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <ScrollArea className="flex-1">
              {chatType === 'groups' ? (
                groups.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد مجموعات بعد</p>
                    <p className="text-sm">ابدأ بإنشاء مجموعة جديدة!</p>
                  </div>
                ) : (
                  groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setSelectedChat({ type: 'group', data: group });
                        setShowSidebar(false);
                      }}
                      className={cn(
                        "w-full p-4 flex items-center gap-3 hover:bg-muted transition-colors text-right",
                        selectedChat?.type === 'group' && selectedChat.data.id === group.id && "bg-muted"
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
                )
              ) : (
                privateConversations.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد محادثات بعد</p>
                    <p className="text-sm">ابدأ محادثة جديدة!</p>
                  </div>
                ) : (
                  privateConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedChat({ type: 'private', data: conv });
                        setShowSidebar(false);
                      }}
                      className={cn(
                        "w-full p-4 flex items-center gap-3 hover:bg-muted transition-colors text-right",
                        selectedChat?.type === 'private' && selectedChat.data.id === conv.id && "bg-muted"
                      )}
                    >
                      <Avatar>
                        <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {(conv.other_user?.display_name || conv.other_user?.username || '??').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conv.other_user?.display_name || conv.other_user?.username}</p>
                        <p className="text-xs text-muted-foreground truncate">@{conv.other_user?.username}</p>
                      </div>
                    </button>
                  ))
                )
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          {selectedChat ? (
            <div className={cn(
              "flex-1 flex flex-col",
              showSidebar ? "hidden md:flex" : "flex"
            )}>
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b flex items-center justify-between bg-background gap-2">
                {/* Back button for mobile */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden shrink-0"
                  onClick={() => setShowSidebar(true)}
                >
                  <X className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                    <AvatarImage src={getChatAvatar() || undefined} />
                    <AvatarFallback className={selectedChat.type === 'group' ? "gold-gradient text-primary-foreground" : "bg-primary text-primary-foreground"}>
                      {getChatName().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{getChatName()}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedChat.type === 'group' ? `${groupMembers.length} أعضاء` : 'محادثة خاصة'}
                    </p>
                  </div>
                </div>
                {selectedChat.type === 'group' && (
                  <Dialog open={showGroupSettings} onOpenChange={setShowGroupSettings}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Users className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl" className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>إعدادات المجموعة</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 mt-4">
                        {/* Group Avatar */}
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-20 w-20">
                              <AvatarImage src={selectedChat.data.avatar_url || undefined} />
                              <AvatarFallback className="gold-gradient text-primary-foreground text-2xl">
                                {selectedChat.data.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <input 
                              type="file" 
                              ref={groupAvatarInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={uploadGroupAvatar}
                            />
                            <Button 
                              size="icon" 
                              variant="secondary"
                              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                              onClick={() => groupAvatarInputRef.current?.click()}
                            >
                              <Camera className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">انقر لتغيير الصورة</p>
                        </div>

                        {/* Add Member */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            إضافة عضو
                          </label>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="اسم المستخدم"
                              value={memberUsername}
                              onChange={(e) => setMemberUsername(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addMember()}
                            />
                            <Button 
                              onClick={addMember} 
                              disabled={isAddingMember || !memberUsername.trim()}
                              className="gold-gradient"
                            >
                              {isAddingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إضافة'}
                            </Button>
                          </div>
                        </div>

                        {/* Members List */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">الأعضاء ({groupMembers.length})</label>
                          <ScrollArea className="h-48 border rounded-lg">
                            {groupMembers.map((member) => (
                              <div key={member.id} className="flex items-center justify-between p-3 hover:bg-muted">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {member.display_name?.slice(0, 2) || member.username?.slice(0, 2) || '??'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{member.display_name || member.username}</p>
                                    <p className="text-xs text-muted-foreground">@{member.username}</p>
                                  </div>
                                  {member.role === 'admin' && (
                                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded">
                                      مشرف
                                    </span>
                                  )}
                                </div>
                                {member.user_id !== user?.id && selectedChat.data.created_by === user?.id && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => removeMember(member.id, member.user_id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
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
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                            <div 
                              className="absolute inset-0 bg-destructive rounded-full animate-ping opacity-75"
                              style={{ transform: `scale(${1 + audioLevel * 2})` }}
                            />
                          </div>
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
                    placeholder={selectedChat.type === 'group' ? "اكتب رسالة... (@المؤلف للتحدث مع الذكاء الاصطناعي)" : "اكتب رسالة..."}
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
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">مرحباً بك في ETERKE</h3>
                <p className="text-muted-foreground mb-4">أنشئ مجموعة أو ابدأ محادثة خاصة</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setShowNewChat(true)} variant="outline">
                    <MessageCircle className="h-4 w-4 ml-2" />
                    محادثة جديدة
                  </Button>
                  <Button onClick={() => setShowCreateGroup(true)} className="gold-gradient">
                    <Plus className="h-4 w-4 ml-2" />
                    إنشاء مجموعة
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Eterke;
