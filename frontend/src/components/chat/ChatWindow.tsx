import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { 
  Image, 
  Send, 
  Paperclip, 
  Smile, 
  ChevronDown,
  Copy,
  Reply,
  MoreVertical,
  Clock,
  X,
  ThumbsUp,
  Heart,
  Laugh,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Bot
} from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { toast } from '@/hooks/use-toast';
import { useSocket } from '@/context/SocketContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAuth } from '@/context/AuthContext';
import { getCurrentUserRole } from '@/utils/auth';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, getApiBaseUrl } from '@/utils/api';
import { chatApi } from '@/api/chat';

interface ChatWindowProps {
  propertyTitle?: string;
  propertyImage?: string;
  landlordName?: string;
  landlordImage?: string;
  tenantName?: string;
  chatRoomId?: string;
  landlordId?: string;
  propertyId?: string;
  isFullPage?: boolean;
  onClose?: () => void;
  tenantLastRead?: string;
  landlordLastRead?: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'other';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  type: 'text' | 'image' | 'file';
  imageUrl?: string;
  replyTo?: Message;
  reactions: Record<string, string[]>;
  isDeleted?: boolean;
  isEditing?: boolean;
  isAiGenerated?: boolean;
}

const REACTIONS = [
  { emoji: '👍', icon: ThumbsUp },
  { emoji: '❤️', icon: Heart },
  { emoji: '😂', icon: Laugh },
];

const MAX_MESSAGE_LENGTH = 1000;

// Helper to check for real UUID
const isRealUuid = (id: string) => /^[0-9a-fA-F-]{36}$/.test(id);

export function ChatWindow({ 
  propertyTitle,
  propertyImage = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
  landlordName,
  landlordImage,
  tenantName,
  chatRoomId: initialChatRoomId,
  landlordId,
  propertyId,
  isFullPage = false,
  onClose,
  tenantLastRead,
  landlordLastRead
}: ChatWindowProps) {
  // Log the current user ID at the very start of rendering
  const { user } = useAuth();
  console.log('[ChatWindow] Current user ID:', user?.id);
  const userRole = getCurrentUserRole(user);
  const { socket, isConnected, joinChat, leaveChat, sendMessage, sendTyping, sendStopTyping, markChatAsRead: socketMarkChatAsRead } = useSocket();
  const [chatRoomId, setChatRoomId] = useState<string | undefined>(initialChatRoomId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [currentLandlordName, setCurrentLandlordName] = useState(() => landlordName || 'Landlord');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  // Typing indicator state
  const [otherUserTyping, setOtherUserTyping] = useState<string | null>(null);

  // Helper function to get sender's name for avatar
  const getSenderName = (messageSender: 'user' | 'other') => {
    if (messageSender === 'user') {
      // Current user (tenant or landlord)
      return user?.user_metadata?.full_name || 'U';
    } else {
      // Other user (landlord if current user is tenant, tenant if current user is landlord)
      if (userRole === 'tenant') {
        return landlordName || 'L';
      } else {
        return tenantName || 'T';
      }
    }
  };

  // Function to mark chat as read
  const markChatAsRead = async () => {
    if (!chatRoomId || !user) return;
    
    try {
      socketMarkChatAsRead({
        chatId: chatRoomId,
        userId: user.id,
        userType: userRole as 'tenant' | 'landlord'
      });
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  // On mount, try to find an existing chat room and fetch messages
  useEffect(() => {
    const tryFindChatRoom = async () => {
      // Only create a new chat room if we don't have a chatRoomId AND we have all required IDs
      if (!chatRoomId && user && landlordId && propertyId) {
        const isTenant = userRole === 'tenant';
        const tenant_id = isTenant ? user.id : landlordId;
        const landlord_id = isTenant ? landlordId : user.id;
        const tenant_name = isTenant
          ? user.user_metadata?.full_name
          : undefined;
        // Log the IDs and names being sent to the backend
        console.log('[ChatWindow] Creating chat with:', {
          tenant_id,
          landlord_id,
          propertyId,
          tenantName: tenant_name,
          propertyTitle,
          landlordName
        });
        try {
          const chatRoom = await chatApi.createChatRoom(
            tenant_id,
            landlord_id,
            propertyId,
            tenant_name,
            propertyTitle,
            landlordName
          );
          if (chatRoom && chatRoom.data && chatRoom.data.id) {
            console.log('[ChatWindow] Setting chat room ID:', chatRoom.data.id);
            setChatRoomId(chatRoom.data.id);
          } else {
            console.error('[ChatWindow] Invalid chat room response:', chatRoom);
          }
        } catch (e) {
          console.error('[ChatWindow] Could not create chat room:', e);
          console.error('[ChatWindow] Error details:', {
            message: e.message,
            response: e.response?.data,
            status: e.response?.status
          });
          // Don't create chat room automatically - let user send first message
        }
      }
    };
    tryFindChatRoom();
    // eslint-disable-next-line
  }, [chatRoomId, user, landlordId, propertyId, userRole]);

  // Join/leave chat room when chatRoomId changes
  useEffect(() => {
    if (chatRoomId && isConnected) {
      joinChat(chatRoomId);
      
      // Mark chat as read when joining
      markChatAsRead();
      
      return () => {
        leaveChat(chatRoomId);
      };
    }
  }, [chatRoomId, isConnected, joinChat, leaveChat, markChatAsRead]);

  // WebSocket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for initial chat messages when joining
    socket.on('chat-messages', (data: { chatId: string; messages: any[] }) => {
      if (data.chatId === chatRoomId) {
        const formattedMessages = data.messages.map((msg: any) => {
          // Parse content to determine if it's a file/image
          let fileInfo: { name: string, url: string, type?: string } | null = null;
          let isImageFile = false;
          try {
            const parsed = JSON.parse(msg.content);
            if (parsed && typeof parsed === 'object' && parsed.url && parsed.name) {
              fileInfo = parsed;
              isImageFile = parsed.type?.startsWith('image/') || false;
            }
          } catch {}
          
          // Determine message type
          let messageType: 'text' | 'image' | 'file' = 'text';
          if (isImageFile) {
            messageType = 'image';
          } else if (fileInfo) {
            messageType = 'file';
          }
          
          // Reconstruct replyTo if reply_to_id is present
          let replyTo = undefined;
          if (msg.reply_to_id) {
            const referenced = data.messages.find(m => m.id === msg.reply_to_id);
            if (referenced) {
              replyTo = { id: referenced.id, content: referenced.content };
            }
          }
          
          return {
            id: msg.id,
            content: msg.content,
            sender: (msg.sender_id === user?.id ? 'user' : 'other') as 'user' | 'other',
            timestamp: new Date(msg.created_at),
            status: 'sent' as const,
            type: messageType,
            imageUrl: isImageFile ? msg.content : undefined,
            reactions: {},
            replyTo,
            isAiGenerated: msg.isAiGenerated || false
          };
        });
        
        setMessages(formattedMessages);
      }
    });

    // Listen for chat messages error
    socket.on('chat-messages-error', (data: { chatId: string; error: string }) => {
      if (data.chatId === chatRoomId) {
        toast({
          title: "Error Loading Messages",
          description: data.error,
          variant: "destructive",
        });
      }
    });

    // Listen for new messages
    socket.on('new-message', (messageData: any) => {
      console.log('🔔 ChatWindow received new-message:', messageData);
      // Mark chat as read if the message is from the other user
      if (messageData.sender_id !== user?.id) {
        markChatAsRead();
      }
      
      setMessages(prev => {
        // Remove any optimistic message with same type, sender, and status 'sending'
        const filtered = prev.filter(
          m => !(
            m.status === 'sending' &&
            m.sender === (messageData.sender_id === user?.id ? 'user' : 'other')
          )
        );
        
        // If message with this id already exists, do not add
        if (filtered.some(m => m.id === messageData.id)) return filtered;
        
        // Parse content to determine if it's a file/image
        let fileInfo: { name: string, url: string, type?: string } | null = null;
        let isImageFile = false;
        try {
          const parsed = JSON.parse(messageData.content);
          if (parsed && typeof parsed === 'object' && parsed.url && parsed.name) {
            fileInfo = parsed;
            isImageFile = parsed.type?.startsWith('image/') || false;
          }
        } catch {}
        
        // Determine message type
        let messageType: 'text' | 'image' | 'file' = 'text';
        if (isImageFile) {
          messageType = 'image';
        } else if (fileInfo) {
          messageType = 'file';
        }
        
        // Reconstruct replyTo if reply_to_id is present
        let replyTo = undefined;
        if (messageData.reply_to_id) {
          const referenced = filtered.find(msg => msg.id === messageData.reply_to_id);
          if (referenced) {
            replyTo = { id: referenced.id, content: referenced.content };
          }
        }
        
        const newMessage: Message = {
          id: messageData.id,
          content: messageData.content,
          sender: messageData.sender_id === user?.id ? 'user' : 'other',
          timestamp: new Date(messageData.created_at),
          status: 'sent',
          type: messageType,
          imageUrl: isImageFile ? fileInfo?.url : undefined,
          reactions: {},
          replyTo,
          isAiGenerated: messageData.isAiGenerated || false
        };
        
        return [...filtered, newMessage];
      });
    });

    // Listen for typing indicators
    socket.on('user-typing', (data: any) => {
      if (data.userId !== user?.id) {
        setIsTyping(true);
      }
    });

    // Listen for stop typing
    socket.on('user-stop-typing', (data: any) => {
      if (data.userId !== user?.id) {
        setIsTyping(false);
      }
    });

    // Listen for chat deletion
    socket.on('chat-deleted', (data: any) => {
      if (data.chatId === chatRoomId) {
        toast({
          title: "Chat Deleted",
          description: "This chat has been deleted.",
          variant: "destructive",
        });
      }
    });

    // Listen for message sent confirmation
    socket.on('message-sent', (data: { tempId: string; messageId: string }) => {
      setMessages(prev => prev.map(m => 
        m.id === data.tempId 
          ? { ...m, id: data.messageId, status: 'sent' }
          : m
      ));
    });

    // Listen for message errors
    socket.on('message-error', (data: { error: string; tempId?: string }) => {
      if (data.tempId) {
        setMessages(prev => prev.map(m => 
          m.id === data.tempId 
            ? { ...m, status: 'error' }
            : m
        ));
      }
      toast({
        title: "Error Sending Message",
        description: data.error,
        variant: "destructive",
      });
    });

    return () => {
      socket.off('chat-messages');
      socket.off('chat-messages-error');
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('chat-deleted');
      socket.off('message-sent');
      socket.off('message-error');
    };
  }, [socket, user, chatRoomId, markChatAsRead]);

  // Listen for typing events from the socket
  useEffect(() => {
    if (!socket || !chatRoomId) return;

    const handleUserTyping = (data: { userId: string; userName: string }) => {
      if (data.userId !== user?.id) {
        setOtherUserTyping(data.userName || 'Someone');
      }
    };
    const handleUserStopTyping = (data: { userId: string }) => {
      if (data.userId !== user?.id) {
        setOtherUserTyping(null);
      }
    };
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);
    return () => {
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
    };
  }, [socket, chatRoomId, user?.id]);



  const handleSendMessage = async () => {
    console.log('Send button clicked', { chatRoomId, newMessage, user });
    if (!newMessage.trim() || !user || !chatRoomId) {
      console.log('Early return in handleSendMessage', { newMessage, user, chatRoomId });
      return;
    }

    const content = newMessage.trim();
    setNewMessage('');

    // Create temporary message for optimistic UI
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      type: 'text',
      reactions: {},
      replyTo: replyTo || undefined
    };

    setMessages(prev => [...prev, tempMessage]);
    setReplyTo(null);

    const replyToId = replyTo && isRealUuid(replyTo.id) ? replyTo.id : null;

    try {
      // Send via WebSocket only
      sendMessage({
        chatId: chatRoomId,
        senderId: user.id,
        content,
        senderType: userRole as 'tenant' | 'landlord',
        tempId: tempMessage.id,
        replyToId
      });
    } catch (error: any) {
      setMessages(prev => prev.map(m => 
        m.id === tempMessage.id 
          ? { ...m, status: 'error' }
          : m
      ));
      toast({
        title: "Error Sending Message",
        description: error.response?.data?.message || error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleTyping = () => {
    if (!chatRoomId || !user) return;

    // Send typing indicator
    sendTyping({
      chatId: chatRoomId,
      userId: user.id,
      userName: user.user_metadata?.full_name || user.email || 'User'
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping({
        chatId: chatRoomId,
        userId: user.id
      });
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll events to show/hide scroll button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
  };

  const handleSaveEdit = () => {
    if (editingMessage && newMessage.trim()) {
      setMessages(prev => prev.map(m => 
        m.id === editingMessage.id 
          ? { ...m, content: newMessage.trim(), isEditing: false }
          : m
      ));
      setNewMessage('');
      setEditingMessage(null);
    }
  };

  const handleReplySnippetClick = (originalMessageId: string) => {
    setHighlightedMessageId(originalMessageId);
    // Scroll to the original message
    const el = document.getElementById(`message-${originalMessageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Remove highlight after 2 seconds
    setTimeout(() => setHighlightedMessageId(null), 2000);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await chatApi.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setActiveMenuId(null);
      toast({ title: 'Message deleted', variant: 'default' });
    } catch (error) {
      toast({ title: 'Error deleting message', description: error?.message || 'Failed to delete message', variant: 'destructive' });
    }
  };

  const handleMessageClick = (messageId: string) => {
    setActiveMenuId(activeMenuId === messageId ? null : messageId);
  };

  const handleMessageMouseEnter = (messageId: string) => {
    setHoveredMessageId(messageId);
  };

  const handleMessageMouseLeave = () => {
    setHoveredMessageId(null);
  };

  const handleReaction = (messageId: string, reaction: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = { ...m.reactions };
        const userId = 'user'; // In a real app, this would be the actual user ID

        // If user already reacted with this emoji, remove it
        if (reactions[reaction]?.includes(userId)) {
          if (reactions[reaction].length === 1) {
            delete reactions[reaction];
          } else {
            reactions[reaction] = reactions[reaction].filter(id => id !== userId);
          }
        } else {
          // Remove user's previous reaction if any
          Object.keys(reactions).forEach(key => {
            reactions[key] = reactions[key].filter(id => id !== userId);
          });
          // Add new reaction
          reactions[reaction] = [...(reactions[reaction] || []), userId];
        }

        return { ...m, reactions };
      }
      return m;
    }));
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3" />;
      case 'sent':
        return <Check className="h-3 w-3" />;
      case 'delivered':
        return <Check className="h-3 w-3" />;
      case 'read':
        return <Check className="h-3 w-3" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB for all files)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Show optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: JSON.stringify({ name: file.name, url: '', type: file.type }),
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      type: file.type.startsWith('image/') ? 'image' : 'file',
      imageUrl: '',
      reactions: {}
    };
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    // Upload to Supabase Storage
    const filePath = `chat/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('chat-files').upload(filePath, file, { upsert: false });
    if (error) {
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    // Get public URL
    const { publicUrl } = supabase.storage.from('chat-files').getPublicUrl(filePath).data;
    if (!publicUrl) {
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      toast({
        title: "URL error",
        description: "Could not get file URL.",
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Send the message with file info as JSON via WebSocket
    if (chatRoomId && user) {
      const userRole = getCurrentUserRole(user);
      const senderType = userRole === 'tenant' ? 'tenant' : 'landlord';
      const fileInfo = JSON.stringify({ name: file.name, url: publicUrl, type: file.type });
      
      try {
        sendMessage({
          chatId: chatRoomId,
          senderId: user.id,
          content: fileInfo,
          senderType: senderType as 'tenant' | 'landlord',
          tempId: optimisticMessage.id
        });
      } catch (error) {
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        toast({
          title: "Send failed",
          description: "Could not send file message.",
          variant: "destructive",
        });
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: Record<string, Message[]> = {};
    messages.forEach(message => {
      const date = message.timestamp.toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  // When rendering messages, filter out 'other' messages that are in 'sending' status
  const displayedMessages = messages.filter(msg => !(msg.status === 'sending' && msg.sender !== 'user'));

  const messageGroups = groupMessagesByDate(displayedMessages);

  // Determine last seen for the other user
  const lastSeen = userRole === 'tenant' ? landlordLastRead : tenantLastRead;
  const lastSeenLabel = lastSeen ? `Last seen: ${new Date(lastSeen).toLocaleString()}` : '';

  return (
    <div className={`flex flex-col h-full ${isFullPage ? 'h-screen' : 'h-[600px]'} bg-white overflow-hidden`}>
      {lastSeenLabel && (
        <div className="text-xs text-gray-500 text-center py-1">{lastSeenLabel}</div>
      )}
      {/* Header */}
      <div className="relative flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <img
            src={propertyImage}
            alt={propertyTitle}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-gray-900">{propertyTitle}</h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-6 w-6">
                <div className="h-full w-full bg-primary/10 flex items-center justify-center text-xs">
                  {getSenderName('other').charAt(0).toUpperCase()}
                </div>
              </Avatar>
              <span className="text-xs text-gray-600 font-semibold">
                {userRole === 'landlord' ? tenantName : landlordName}
              </span>
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 px-6 py-4 bg-white overflow-y-auto overflow-x-hidden" ref={scrollAreaRef}>
        <div className="space-y-4">
          {Object.entries(messageGroups).map(([date, messages]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center justify-center">
                <Badge variant="secondary" className="text-xs">
                  {date === new Date().toLocaleDateString() ? 'Today' : date}
                </Badge>
              </div>
              {messages.map((message) => (
                <div
                  key={message.id}
                  id={`message-${message.id}`}
                  className={`flex items-center mb-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'} group`}
                  style={{ width: '100%' }}
                  onMouseEnter={() => handleMessageMouseEnter(message.id)}
                  onMouseLeave={handleMessageMouseLeave}
                >
                  <div className={`flex items-end gap-2 min-w-0 flex-row`}>
                    {message.sender === 'user' ? (
                      <>
                        {/* Options menu on the outside left */}
                        <div className="flex items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 transition-opacity duration-200 ${hoveredMessageId === message.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                tabIndex={0}
                                aria-label="Message options"
                                onClick={e => { e.stopPropagation(); }}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setReplyTo(message)}>
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditMessage(message)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteMessage(message.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {/* Message bubble */}
                        <div
                          className={`rounded-2xl p-2 px-4 py-2 pb-1 pr-2 relative max-w-full min-w-0 break-words whitespace-pre-line overflow-x-hidden bg-blue-500 text-white ${highlightedMessageId === message.id ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}
                          style={{ wordBreak: 'break-word', overflowY: 'visible' }}
                          onClick={() => handleMessageClick(message.id)}
                        >
                          {message.replyTo && (
                            <div
                              className="text-xs opacity-70 mb-1 border-l-2 pl-2 border-current text-blue-700 bg-blue-50 rounded cursor-pointer hover:bg-blue-100 flex items-center gap-2"
                              onClick={e => {
                                e.stopPropagation();
                                handleReplySnippetClick(message.replyTo.id);
                              }}
                            >
                              {"Replying to: "}
                              {(() => {
                                try {
                                  const parsed = JSON.parse(message.replyTo.content);
                                  if (parsed && typeof parsed === 'object' && parsed.url && parsed.name) {
                                    if (parsed.type && parsed.type.startsWith('image/')) {
                                      return (
                                        <>
                                          <img
                                            src={parsed.url}
                                            alt={parsed.name}
                                            className="inline-block w-8 h-8 object-cover rounded mr-1"
                                            style={{ verticalAlign: 'middle' }}
                                          />
                                          <span>{parsed.name}</span>
                                        </>
                                      );
                                    }
                                    return (
                                      <>
                                        <span role="img" aria-label="File">📎</span> {parsed.name}
                                      </>
                                    );
                                  }
                                } catch {}
                                // fallback to text
                                return message.replyTo.content.length > 40
                                  ? message.replyTo.content.slice(0, 40) + '...'
                                  : message.replyTo.content;
                              })()}
                            </div>
                          )}
                          {(() => {
                            // Try to parse content as file info
                            let fileInfo: { name: string, url: string, type?: string } | null = null;
                            try {
                              const parsed = JSON.parse(message.content);
                              if (parsed && typeof parsed === 'object' && parsed.url && parsed.name) {
                                fileInfo = parsed;
                              }
                            } catch {}
                            
                            if (fileInfo && fileInfo.type?.startsWith('image/')) {
                              // Render as image
                              return (
                                <div className="relative pb-4">
                                  <img 
                                    src={fileInfo.url} 
                                    alt="Shared image" 
                                    className="max-w-full h-auto rounded-2xl mb-1"
                                    style={{ display: 'block', margin: 0 }}
                                  />
                                  <div className="absolute bottom-0 right-1 flex flex-row items-center gap-1">
                                    <span className="text-[10px] opacity-70 align-baseline">
                                      {getStatusIcon(message.status)}
                                    </span>
                                    <span className="text-[10px] opacity-70 whitespace-nowrap align-baseline">
                                      {formatTimestamp(message.timestamp)}
                                    </span>
                                  </div>
                                </div>
                              );
                            } else if (fileInfo) {
                              // Render as file message
                              return (
                                <div
                                  className="relative pb-4 flex items-center gap-2 min-w-0"
                                  style={{ overflowY: 'visible', overflow: 'visible', height: 'auto', maxHeight: 'none' }}
                                >
                                  <Paperclip className="w-5 h-5 text-blue-500" />
                                  <a
                                    href={fileInfo.url}
                                    download={fileInfo.name}
                                    className="underline text-blue-600 break-all"
                                    style={{ overflow: 'visible', overflowY: 'visible', whiteSpace: 'normal', height: 'auto', maxHeight: 'none' }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {fileInfo.name}
                                  </a>
                                  <div className="absolute bottom-0 right-1 flex flex-row items-center gap-1">
                                    <span className="text-[10px] opacity-70 align-baseline">
                                      {getStatusIcon(message.status)}
                                    </span>
                                    <span className="text-[10px] opacity-70 whitespace-nowrap align-baseline">
                                      {formatTimestamp(message.timestamp)}
                                    </span>
                                  </div>
                                </div>
                              );
                            } else if (message.type === 'image' && message.imageUrl) {
                              // Fallback for legacy image messages
                              return (
                                <div className="relative pb-4">
                                  <img 
                                    src={message.imageUrl} 
                                    alt="Shared image" 
                                    className="max-w-full h-auto rounded-2xl mb-1"
                                    style={{ display: 'block', margin: 0 }}
                                  />
                                  <div className="absolute bottom-0 right-1 flex flex-row items-center gap-1">
                                    <span className="text-[10px] opacity-70 align-baseline">
                                      {getStatusIcon(message.status)}
                                    </span>
                                    <span className="text-[10px] opacity-70 whitespace-nowrap align-baseline">
                                      {formatTimestamp(message.timestamp)}
                                    </span>
                                  </div>
                                </div>
                              );
                            } else if (!message.isDeleted && message.type === 'text') {
                              // Render as text message
                              return (
                                <div className="relative pb-4">
                                  <span className="text-sm m-0 break-words whitespace-pre-line block">
                                    {message.content}
                                  </span>
                                  <div className="absolute bottom-0 right-1 flex flex-row items-center gap-1">
                                    <span className="text-[10px] opacity-70 align-baseline">
                                      {getStatusIcon(message.status)}
                                    </span>
                                    <span className="text-[10px] opacity-70 whitespace-nowrap align-baseline">
                                      {formatTimestamp(message.timestamp)}
                                    </span>
                                  </div>
                                </div>
                              );
                            } else {
                              return null;
                            }
                          })()}
                        </div>
                        <Avatar className="h-6 w-6">
                          <div className="h-full w-full bg-primary/10 flex items-center justify-center text-xs">
                            {getSenderName('user').charAt(0).toUpperCase()}
                          </div>
                        </Avatar>
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <Avatar className="h-6 w-6">
                            <div className="h-full w-full bg-primary/10 flex items-center justify-center text-xs">
                              {getSenderName('other').charAt(0).toUpperCase()}
                            </div>
                          </Avatar>
                          {message.isAiGenerated && (
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full opacity-75">
                            </div>
                          )}
                        </div>
                        {/* Message bubble */}
                        <div
                          className={`rounded-2xl p-2 px-4 py-2 pb-1 pr-2 relative max-w-full min-w-0 break-words whitespace-pre-line overflow-x-hidden ${message.isAiGenerated ? 'bg-gray-50 border border-gray-150 text-gray-900' : 'bg-gray-100 text-gray-900'} ${highlightedMessageId === message.id ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}
                          style={{ wordBreak: 'break-word', overflowY: 'visible' }}
                          onClick={() => handleMessageClick(message.id)}
                        >
                          {message.replyTo && (
                            <div
                              className="text-xs opacity-70 mb-1 border-l-2 pl-2 border-current text-blue-700 bg-blue-50 rounded cursor-pointer hover:bg-blue-100 flex items-center gap-2"
                              onClick={e => {
                                e.stopPropagation();
                                handleReplySnippetClick(message.replyTo.id);
                              }}
                            >
                              {"Replying to: "}
                              {(() => {
                                try {
                                  const parsed = JSON.parse(message.replyTo.content);
                                  if (parsed && typeof parsed === 'object' && parsed.url && parsed.name) {
                                    if (parsed.type && parsed.type.startsWith('image/')) {
                                      return (
                                        <>
                                          <img
                                            src={parsed.url}
                                            alt={parsed.name}
                                            className="inline-block w-8 h-8 object-cover rounded mr-1"
                                            style={{ verticalAlign: 'middle' }}
                                          />
                                          <span>{parsed.name}</span>
                                        </>
                                      );
                                    }
                                    return (
                                      <>
                                        <span role="img" aria-label="File">📎</span> {parsed.name}
                                      </>
                                    );
                                  }
                                } catch {}
                                // fallback to text
                                return message.replyTo.content.length > 40
                                  ? message.replyTo.content.slice(0, 40) + '...'
                                  : message.replyTo.content;
                              })()}
                            </div>
                          )}
                          {(() => {
                            // Try to parse content as file info
                            let fileInfo: { name: string, url: string, type?: string } | null = null;
                            try {
                              const parsed = JSON.parse(message.content);
                              if (parsed && typeof parsed === 'object' && parsed.url && parsed.name) {
                                fileInfo = parsed;
                              }
                            } catch {}
                            
                            if (fileInfo && fileInfo.type?.startsWith('image/')) {
                              // Render as image
                              return (
                                <div className="relative pb-4">
                                  <img 
                                    src={fileInfo.url} 
                                    alt="Shared image" 
                                    className="max-w-full h-auto rounded-2xl mb-1"
                                    style={{ display: 'block', margin: 0 }}
                                  />
                                  <div className="absolute bottom-0 right-1 flex flex-row items-center gap-1">
                                    <span className="text-[10px] opacity-70 align-baseline">
                                      {getStatusIcon(message.status)}
                                    </span>
                                    <span className="text-[10px] opacity-70 whitespace-nowrap align-baseline">
                                      {formatTimestamp(message.timestamp)}
                                    </span>
                                  </div>
                                </div>
                              );
                            } else if (fileInfo) {
                              // Render as file message
                              return (
                                <div
                                  className="relative pb-4 flex items-center gap-2 min-w-0"
                                  style={{ overflowY: 'visible', overflow: 'visible', height: 'auto', maxHeight: 'none' }}
                                >
                                  <Paperclip className="w-5 h-5 text-blue-500" />
                                  <a
                                    href={fileInfo.url}
                                    download={fileInfo.name}
                                    className="underline text-blue-600 break-all"
                                    style={{ overflow: 'visible', overflowY: 'visible', whiteSpace: 'normal', height: 'auto', maxHeight: 'none' }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {fileInfo.name}
                                  </a>
                                  <div className="absolute bottom-0 right-1 flex flex-row items-center gap-1">
                                    <span className="text-[10px] opacity-70 align-baseline">
                                      {getStatusIcon(message.status)}
                                    </span>
                                    <span className="text-[10px] opacity-70 whitespace-nowrap align-baseline">
                                      {formatTimestamp(message.timestamp)}
                                    </span>
                                  </div>
                                </div>
                              );
                            } else if (message.type === 'image' && message.imageUrl) {
                              // Fallback for legacy image messages
                              return (
                                <div className="relative pb-4">
                                  <img 
                                    src={message.imageUrl} 
                                    alt="Shared image" 
                                    className="max-w-full h-auto rounded-2xl mb-1"
                                    style={{ display: 'block', margin: 0 }}
                                  />
                                  <div className="absolute bottom-0 right-1 flex flex-row items-center gap-1">
                                    <span className="text-[10px] opacity-70 align-baseline">
                                      {getStatusIcon(message.status)}
                                    </span>
                                    <span className="text-[10px] opacity-70 whitespace-nowrap align-baseline">
                                      {formatTimestamp(message.timestamp)}
                                    </span>
                                  </div>
                                </div>
                              );
                            } else if (!message.isDeleted && message.type === 'text') {
                              // Render as text message
                              return (
                                <div className="relative pb-4">
                                  <span className="text-sm m-0 break-words whitespace-pre-line block">
                                    {message.content}
                                  </span>
                                  <div className="absolute bottom-0 right-1 flex flex-row items-center gap-1">
                                    <span className="text-[10px] opacity-70 align-baseline">
                                      {getStatusIcon(message.status)}
                                    </span>
                                    <span className="text-[10px] opacity-70 whitespace-nowrap align-baseline">
                                      {formatTimestamp(message.timestamp)}
                                    </span>
                                  </div>
                                </div>
                              );
                            } else {
                              return null;
                            }
                          })()}
                        </div>
                        {/* Options menu on the outside right */}
                        <div className="flex items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 transition-opacity duration-200 ${hoveredMessageId === message.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                tabIndex={0}
                                aria-label="Message options"
                                onClick={e => { e.stopPropagation(); }}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setReplyTo(message)}>
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {/* Typing Indicator */}
          {otherUserTyping && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
              <span>{otherUserTyping} is typing...</span>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>
      {/* Input Area */}
      <div className="px-6 py-4 border-t bg-white">
        <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-2 shadow-sm">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border-0 bg-transparent focus:ring-0 focus:outline-none px-2"
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <Button
            onClick={() => {
              console.log('Send button onClick triggered');
              handleSendMessage();
            }}
            disabled={!newMessage.trim() || !isConnected}
            className="ml-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {/* Add reply UI above the input area */}
      {replyTo && (
        <div className="flex items-center mb-2 px-6 py-2 bg-blue-50 border-l-4 border-blue-400 rounded">
          <span className="font-medium text-blue-700 mr-2">Replying to:</span>
          <span className="truncate flex-1 text-gray-700">{replyTo.content.length > 60 ? replyTo.content.slice(0, 60) + '...' : replyTo.content}</span>
          <Button size="sm" variant="ghost" className="ml-2" onClick={() => setReplyTo(null)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}