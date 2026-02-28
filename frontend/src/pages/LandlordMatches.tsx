import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageCircle, Home, User, X, FilePen, SquareArrowOutUpRight, Trash2 } from 'lucide-react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { apiFetch, getApiBaseUrl } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { chatApi } from '@/api/chat';

interface Match {
  id: string;
  propertyId: string;
  tenantId: string;
  propertyTitle: string;
  tenantName: string;
  tenantImage?: string;
  tenant_name: string;
  message: string;
  time: string;
  unread: boolean;
  propertyImage: string;
  timestamp: number;
}

const LandlordMatches = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { socket, markChatAsRead } = useSocket();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [readChats, setReadChats] = useState<Set<string>>(new Set());
  const [selectedChat, setSelectedChat] = useState<{
    propertyTitle: string;
    propertyImage: string;
    tenantName: string;
    tenantImage?: string;
    tenantId: string;
    propertyId: string;
    chatRoomId: string;
  } | null>(null);
  const [createLease, setCreateLease] = useState<Match>();
  const [formData, setFormData] = useState({
    listingId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    rent: '',
    document: null as File | null,
    signed: false,
  });
  const [hasLease, setHasLease] = useState<{ [matchId: string] : { exists: boolean, leaseId?: string, signed?: boolean } }>();

  // Fetch matches from API
  const fetchMatches = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // Use the backend API endpoint that includes unread counts
      const response = await apiFetch(`${getApiBaseUrl()}/api/chats/user/${user.id}/landlord`);
      
      const chatArray = response?.data;
      if (chatArray && Array.isArray(chatArray)) {
        // Transform the API response to match our Match interface
        const transformedMatches: Match[] = chatArray.map((chat: any) => {
          // Get the latest message info
          let message = "Click to start chatting";
          let time = new Date(chat.created_at).toLocaleDateString();
          let timestamp = new Date(chat.created_at).getTime();
          
          if (chat.messages && chat.messages.length > 0) {
            const latestMessage = chat.messages[0]; // Already sorted desc, so first is latest
            
            // Parse message content to determine type and display appropriate preview
            let messageContent = latestMessage.content;
            try {
              const parsed = JSON.parse(latestMessage.content);
              if (parsed && typeof parsed === 'object') {
                if (parsed.url && parsed.name) {
                  // This is a file or image message
                  if (parsed.type && parsed.type.startsWith('image/')) {
                    messageContent = "📷 Image";
                  } else {
                    messageContent = "📎 File";
                  }
                }
              }
            } catch (e) {
              // If parsing fails, it's a regular text message
              messageContent = latestMessage.content;
            }
            
            message = messageContent;
            time = new Date(latestMessage.created_at).toLocaleDateString();
            timestamp = new Date(latestMessage.created_at).getTime();
          }

          // Parse images from the property details
          let propertyImage = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop"; // default
          
          if (chat.property_details?.images) {
            try {
              const images = JSON.parse(chat.property_details.images);
              if (Array.isArray(images) && images.length > 0) {
                propertyImage = images[0];
              }
            } catch (e) {
              // Use default image if parsing fails
            }
          }

          return {
            id: chat.id,
            propertyId: chat.property_id || '',
            tenantId: chat.tenant_id,
            propertyTitle: chat.propertyTitle || 'Unknown Property',
            tenantName: chat.tenant_name || 'Unknown Tenant',
            tenantImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.tenant_name || 'T')}&background=E0E7FF&color=3730A3`,
            tenant_name: chat.tenant_name || 'Unknown Tenant',
            message: message,
            time: time,
            unread: chat.unreadCount > 0, // Use the unread count from backend
            propertyImage: propertyImage,
            timestamp: timestamp
          };
        });
        
        // Sort matches by timestamp (most recent first)
        transformedMatches.sort((a, b) => {
          return b.timestamp - a.timestamp; // Most recent first
        });
        
        setMatches(transformedMatches);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch matches. Please try again.",
        variant: "destructive",
      });
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [user?.id]);

  // Listen for new messages to update matches list in real-time
  useEffect(() => {
    console.log('🔌 LandlordMatches socket effect - socket:', socket, 'isConnected:', socket?.connected);
    if (!socket || !socket.connected) return;

    const handleNewMessage = (message: any) => {
      console.log('🔔 LandlordMatches received new-message:', message);
      setMatches(prevMatches => {
        return prevMatches.map(match => {
          if (match.id === message.chat_id) {
            console.log('🔔 Updating match:', match.id, 'with message:', message.content);
            // Parse message content to determine type and display appropriate preview
            let messageContent = message.content;
            try {
              const parsed = JSON.parse(message.content);
              if (parsed && typeof parsed === 'object') {
                if (parsed.url && parsed.name) {
                  // This is a file or image message
                  if (parsed.type && parsed.type.startsWith('image/')) {
                    messageContent = "📷 Image";
                  } else {
                    messageContent = "📎 File";
                  }
                }
              }
            } catch (e) {
              // If parsing fails, it's a regular text message
              messageContent = message.content;
            }

            return {
              ...match,
              message: messageContent,
              time: new Date(message.created_at).toLocaleDateString(),
              timestamp: new Date(message.created_at).getTime(),
              unread: message.sender_type === 'tenant' ? true : match.unread
            };
          }
          return match;
        }).sort((a, b) => b.timestamp - a.timestamp); // Re-sort by timestamp
      });
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, socket?.connected]);

  // Join/leave chat rooms when matches change
  useEffect(() => {
    if (!socket || !socket.connected || !matches.length) return;

    // Join all chat rooms for real-time updates
    matches.forEach(match => {
      console.log('🔌 Joining chat room:', match.id);
      socket.emit('join-chat', match.id);
    });

    return () => {
      // Leave all chat rooms when component unmounts or matches change
      matches.forEach(match => {
        console.log('🔌 Leaving chat room:', match.id);
        socket.emit('leave-chat', match.id);
      });
    };
  }, [socket, socket?.connected, matches]);



  // Refresh when returning from lease signing
  useEffect(() => {
    if (location.state && location.state.leaseSigned) {
      fetchMatches();
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleReply = async (match: Match) => {
    
    // Mark this chat as read using WebSocket
    try {
      markChatAsRead({
        chatId: match.id,
        userId: user?.id || '',
        userType: 'landlord'
      });
      
      // Update local state to reflect the read status
      setMatches(prevMatches => 
        prevMatches.map(m => 
          m.id === match.id 
            ? { ...m, unread: false }
            : m
        )
      );
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
    
    setSelectedChat({
      propertyTitle: match.propertyTitle,
      propertyImage: match.propertyImage,
      tenantName: match.tenantName,
      tenantImage: match.tenantImage,
      tenantId: match.tenantId,
      propertyId: match.propertyId,
      chatRoomId: match.id,
    });
  };

  const handleViewProperty = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  useEffect(() => {
    const checkHasLease = async () => {
      const statuses: { [matchId: string] : { exists: boolean, leaseId?: string, signed?: boolean } } = {};
      for (const match of matches) {
        try {
          const response = await fetch(`http://localhost:3001/api/leases/${match.propertyId}/${match.tenantId}`);
          const data = await response.json();
          console.log(`Lease data for match ${match.id}:`, data);
          statuses[match.id] = data;
        } catch (error) {
          console.error('Error fetching lease info:', error);
          statuses[match.id] = { exists: false };
        }
      }
      console.log('All lease statuses:', statuses);
      setHasLease(statuses);
    }

    checkHasLease();
  }, [matches]);

  // Refresh lease info when component comes into focus (e.g., when returning from lease signing)
  useEffect(() => {
    const handleFocus = () => {
      if (matches.length && user?.id) {
        const checkHasLease = async () => {
          const statuses: { [matchId: string] : { exists: boolean, leaseId?: string, signed?: boolean } } = {};
          
          for (const match of matches) {
            try {
              const response = await fetch(`http://localhost:3001/api/leases/${match.propertyId}/${match.tenantId}`);
              const data = await response.json();
              statuses[match.id] = data;
            } catch (error) {
              console.error('Error fetching lease info for match:', match.id, error);
              statuses[match.id] = { exists: false };
            }
          }
          
          setHasLease(statuses);
        };
        checkHasLease();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [matches, user?.id]);

  const handleCreateLease = (match: Match) => {
    setCreateLease(match);
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        document: file,
      }));
    }
  }

  const handleSubmitLease = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const file = formData.document;
      const filePath = `documents/${Date.now()}_${file.name}`;

      // Upload document to Supabase Storage
      const { error } = await supabase.storage
        .from('leases')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error("Error uploading lease agreemeent:", error);
        return;
      }

      const payload = {
        ...formData,
        tenantId: createLease.tenantId,
        listingId: createLease.propertyId,
        document: filePath,
      };

      console.log('Creating listing:', payload);

      const response = await fetch('http://localhost:3001/api/leases/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create lease.');
      }

      const result = await response.json();
      console.log('Lease created successfully:', result);
      
      // Show success toast
      toast({
        title: "Success!",
        description: "Lease has been created and sent to the tenant.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error creating lease:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: error.message || "Failed to create lease. Please try again.",
        variant: "destructive",
      });
    }

    setCreateLease(null);
  }

  const handleViewLease = async (leaseId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/leases/${leaseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.document) {
          window.open(data.data.document, '_blank');
        } else {
          toast({
            title: "Error",
            description: "No document URL found.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Could not fetch lease document.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching lease document:", error);
      toast({
        title: "Error",
        description: "Could not fetch lease document.",
        variant: "destructive",
      });
    }
  }

  const handleDeleteMatch = async (match: Match) => {
    if (!window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete the chat
      await chatApi.deleteChatRoom(match.id, user?.id || '');
      
      // Remove the match from the local state
      setMatches(prev => prev.filter(m => m.id !== match.id));
      
      // Close the chat window if it's open for this match
      if (selectedChat?.chatRoomId === match.id) {
        setSelectedChat(null);
      }
      
      toast({
        title: "Chat Deleted",
        description: "The chat has been successfully deleted.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete the chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/landlord')}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-roomzi-blue">Matches</h1>
            </div>
            <Badge variant="secondary">{matches.filter(m => m.unread).length} New</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="messages">Viewings</TabsTrigger>
          </TabsList>

                    {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roomzi-blue mx-auto mb-4"></div>
                <p className="text-gray-500">Loading matches...</p>
              </div>
            )}
            
            {!loading && matches.map((match) => (
              <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={match.propertyImage}
                      alt={match.propertyTitle}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {match.propertyTitle}
                        </h3>
                        <div className="flex space-x-2">
                          {match.unread && (
                            <Badge className="bg-roomzi-blue text-white">New</Badge>
                          )}
                          {hasLease[match.id] && hasLease[match.id].exists && (
                            hasLease[match.id].signed === true ? (
                              <Badge className="bg-green-600 hover:bg-green-500">Lease Signed</Badge>
                            ) : hasLease[match.id].signed === false ? (
                              <Badge className="bg-yellow-500 hover:bg-yellow-400">Lease Not Signed</Badge>
                            ) : (
                              <Badge className="bg-gray-500 hover:bg-gray-400">Lease Status Unknown</Badge>
                            )
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        {match.tenantName}
                      </p>
                      <p className="text-gray-700 mb-2 line-clamp-2">{match.message}</p>
                      <p className="text-xs text-gray-500">{match.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      className="roomzi-gradient flex-1"
                      onClick={() => handleReply(match)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewProperty(match.propertyId)}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      View Property
                    </Button>
                    {hasLease[match.id] && hasLease[match.id].exists ? (
                      <Button
                        size="sm"
                        className="roomzi-gradient-inverted"
                        onClick={() => handleViewLease(hasLease[match.id].leaseId)}
                      >
                        <SquareArrowOutUpRight className="w-4 h-4 mr-2" />
                        View Lease
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        className="roomzi-gradient-inverted"
                        onClick={() => handleCreateLease(match)}
                      >
                        <FilePen className="w-4 h-4 mr-2" />
                        Create Lease
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                      onClick={() => handleDeleteMatch(match)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {!loading && matches.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No matches yet</h3>
                <p className="text-gray-400 mb-4">Start browsing properties to connect with tenants</p>
                <Button onClick={() => navigate('/landlord')} className="roomzi-gradient">
                  Back to Dashboard
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roomzi-blue mx-auto mb-4"></div>
                <p className="text-gray-500">Loading matches...</p>
              </div>
            )}
            
            {!loading && matches.map((match) => (
              <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={match.propertyImage}
                      alt={match.propertyTitle}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {match.propertyTitle}
                        </h3>
                        <div className="flex space-x-2">
                          {match.unread && (
                            <Badge className="bg-roomzi-blue text-white">New</Badge>
                          )}
                          {hasLease[match.id] && hasLease[match.id].exists && (
                            hasLease[match.id].signed === true ? (
                              <Badge className="bg-green-600 hover:bg-green-500">Lease Signed</Badge>
                            ) : hasLease[match.id].signed === false ? (
                              <Badge className="bg-yellow-500 hover:bg-yellow-400">Lease Not Signed</Badge>
                            ) : (
                              <Badge className="bg-gray-500 hover:bg-gray-400">Lease Status Unknown</Badge>
                            )
                          )} 
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        {match.tenantName}
                      </p>
                      <p className="text-gray-700 mb-2 line-clamp-2">{match.message}</p>
                      <p className="text-xs text-gray-500">{match.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      className="roomzi-gradient flex-1"
                      onClick={() => handleReply(match)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewProperty(match.propertyId)}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      View Property
                    </Button>
                    {hasLease[match.id] && hasLease[match.id].exists ? (
                      <Button
                        size="sm"
                        className="roomzi-gradient-inverted"
                        onClick={() => handleViewLease(hasLease[match.id].leaseId)}
                      >
                        <SquareArrowOutUpRight className="w-4 h-4 mr-2" />
                        View Lease
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        className="roomzi-gradient-inverted"
                        onClick={() => handleCreateLease(match)}
                      >
                        <FilePen className="w-4 h-4 mr-2" />
                        Create Lease
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                      onClick={() => handleDeleteMatch(match)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {!loading && matches.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No messages yet</h3>
                <p className="text-gray-400 mb-4">Start browsing properties to connect with tenants</p>
                <Button onClick={() => navigate('/landlord')} className="roomzi-gradient">
                  Back to Dashboard
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Blur Overlay */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      )}

      {/* Chat Window */}
      {selectedChat && (
        <div className="fixed bottom-4 right-4 z-50 w-[350px] h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]">
          <div className="relative h-full flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-white rounded-full shadow-md hover:bg-gray-100"
              onClick={() => {
                setSelectedChat(null);
                // Refresh matches data instead of reloading the entire page
                fetchMatches();
              }}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex-1 min-h-0">
              <ChatWindow
                propertyTitle={selectedChat.propertyTitle}
                propertyImage={selectedChat.propertyImage}
                landlordName={user?.email || 'You'}
                tenantName={selectedChat.tenantName}
                landlordId={user?.id || ''}
                propertyId={selectedChat.propertyId}
                chatRoomId={selectedChat.chatRoomId}
                isFullPage={false}
                onClose={() => {
                  setSelectedChat(null);
                  // Refresh matches data instead of reloading the entire page
                  fetchMatches();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Lease Window */}
      {createLease && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="fixed w-full max-w-md bg-white flex justify-self-center items-center justify-center shadow-2xl">
            <div className="grid sm-grid-rows-2 w-full h-full p-6 justify-center content-center">
              <div className="text-center mb-8">
                <h3 className="font-semibold text-lg text-gray-900">
                  Create Lease
                </h3>
              </div>

              <form onSubmit={handleSubmitLease} className="grid space-y-8 content-center">
                <div className="flex space-x-4 items-center">
                  <Label>Property: </Label>
                  <h2 className="text-sm">{createLease.propertyTitle}</h2>
                </div>

                <div className="flex space-x-4 items-center">
                  <Label>Tenant: </Label>
                  <h2 className="text-sm">{createLease.tenantName}</h2>
                </div>

                <div className="flex space-x-4 items-center">
                  <Label htmlFor="startDate" className="whitespace-nowrap">
                    Start Date:
                  </Label>
                  <Input
                    id="startDate"
                    value={formData.startDate}
                    type='date'
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    required
                  >
                  </Input>
                </div>

                <div className="flex space-x-4 items-center">
                  <Label htmlFor="endDate" className="whitespace-nowrap">
                    End Date:
                  </Label>
                  <Input
                    id="endDate"
                    value={formData.endDate}
                    type='date'
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    required
                  >
                  </Input>
                </div>

                <div className="flex space-x-4 items-center">
                  <Label htmlFor="rent" className="whitespace-nowrap">
                    Rent (monthly):
                  </Label>
                  <Input
                    id="rent"
                    value={formData.rent}
                    type='number'
                    onChange={(e) => handleInputChange('rent', e.target.value)}
                    required
                  >
                  </Input>
                </div>

                <div className="flex space-x-4 items-center">
                  <Label htmlFor="startDate" className="whitespace-nowrap">
                    Lease Agreement:
                  </Label>
                  <Input
                    type="file"
                    accept="pdf/*"
                    onChange={handleUploadFile}
                    required
                  ></Input>
                </div>
                
                <div className="space-y-2 items-center pt-2">
                  <p className="text-xs text-gray-600">
                    Clicking this button will send the lease to tenant {createLease.tenantName}.
                    <br />
                    You will be notified if the tenant accepts or rejects the lease.
                  </p>
                  <Button type='submit' className="roomzi-gradient-inverted w-[100%]">
                    Create Lease
                  </Button>
                </div>
              </form>
            </div>

            <div className="absolute top-0 right-0">
              <Button 
                variant='ghost' 
                size='icon' 
                onClick={() => setCreateLease(null)}
              >
                <X />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LandlordMatches; 