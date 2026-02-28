import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageCircle, Home, Calendar, User, X, Trash2 } from 'lucide-react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { apiFetch, getApiBaseUrl } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';
import { chatApi } from '@/api/chat';

interface Match {
  id: string;
  propertyId: string;
  landlordId: string;
  propertyTitle: string;
  landlordName: string;
  landlordImage?: string;
  landlord_name: string;
  message: string;
  time: string;
  unread: boolean;
  propertyImage: string;
  timestamp: number; // Added timestamp for sorting
}

interface LeaseInfo {
  exists: boolean;
  leaseId?: string;
  signed?: boolean;
}

const TenantMatches = () => {
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
    landlordName: string;
    landlordImage?: string;
    landlordId: string;
    propertyId: string;
    chatRoomId: string;
  } | null>(null);
  const [leaseInfo, setLeaseInfo] = useState<{ [matchId: string]: LeaseInfo }>({});

  // Fetch matches from API
  const fetchMatches = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // Use the backend API endpoint that includes unread counts
      const response = await apiFetch(`${getApiBaseUrl()}/api/chats/user/${user.id}/tenant`);
      
      const chatArray = response?.data;
      if (chatArray && Array.isArray(chatArray)) {
        
        // Transform the API response to match our Match interface
        const transformedMatches: Match[] = chatArray.map((chat: any, index: number) => {
          
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

          const transformedMatch = {
            id: chat.id,
            propertyId: chat.property_id || '',
            landlordId: chat.landlord_id,
            propertyTitle: chat.propertyTitle || 'Unknown Property',
            landlordName: chat.landlord_name || 'Unknown Landlord',
            landlordImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.landlord_name || 'L')}&background=E0E7FF&color=3730A3`,
            landlord_name: chat.landlord_name || 'Unknown Landlord',
            message: message,
            time: time,
            unread: chat.unreadCount > 0, // Use the unread count from backend
            propertyImage: propertyImage,
            timestamp: timestamp
          };
          
          return transformedMatch;
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
    console.log('🔌 TenantMatches socket effect - socket:', socket, 'isConnected:', socket?.connected);
    if (!socket || !socket.connected) return;

    const handleNewMessage = (message: any) => {
      console.log('🔔 TenantMatches received new-message:', message);
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
              unread: message.sender_type === 'landlord' ? true : match.unread
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

  // Fetch lease information for each match
  useEffect(() => {
    const fetchLeaseInfo = async () => {
      if (!matches.length || !user?.id) return;
      
      const leaseData: { [matchId: string]: LeaseInfo } = {};
      
      for (const match of matches) {
        try {
          const response = await fetch(`${getApiBaseUrl()}/api/leases/${match.propertyId}/${user.id}`);
          const data = await response.json();
          leaseData[match.id] = data;
        } catch (error) {
          console.error('Error fetching lease info for match:', match.id, error);
          leaseData[match.id] = { exists: false };
        }
      }
      
      setLeaseInfo(leaseData);
    };

    fetchLeaseInfo();
  }, [matches, user?.id]);

  // Refresh lease info when component comes into focus (e.g., when returning from lease signing)
  useEffect(() => {
    const handleFocus = () => {
      if (matches.length && user?.id) {
        const fetchLeaseInfo = async () => {
          const leaseData: { [matchId: string]: LeaseInfo } = {};
          
          for (const match of matches) {
            try {
              const response = await fetch(`${getApiBaseUrl()}/api/leases/${match.propertyId}/${user.id}`);
              const data = await response.json();
              leaseData[match.id] = data;
            } catch (error) {
              console.error('Error fetching lease info for match:', match.id, error);
              leaseData[match.id] = { exists: false };
            }
          }
          
          setLeaseInfo(leaseData);
        };
        fetchLeaseInfo();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [matches, user?.id]);

  const handleReply = async (match: Match) => {
    
    // Mark this chat as read using WebSocket
    try {
      markChatAsRead({
        chatId: match.id,
        userId: user?.id || '',
        userType: 'tenant'
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
      landlordName: match.landlordName,
      landlordImage: match.landlordImage,
      landlordId: match.landlordId,
      propertyId: match.propertyId,
      chatRoomId: match.id,
    });
  };

  const handleViewProperty = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  const handleLeaseAction = (matchId: string, leaseId?: string) => {
    if (leaseId) {
      navigate(`/tenant/lease/${leaseId}`);
    }
  };

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
                onClick={() => navigate(-1)}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-roomzi-blue">Matches</h1>
            </div>
            <div className="flex space-x-2">
              <Badge variant="secondary">{matches.filter(m => m.unread).length} New</Badge>
              {Object.values(leaseInfo).some(lease => lease.exists && lease.signed === false) && (
                <Badge className="bg-yellow-500 text-white animate-pulse">📄 Lease</Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lease Notifications */}
        {Object.values(leaseInfo).some(lease => lease.exists && lease.signed === false) && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📄</span>
                <div>
                  <h3 className="font-semibold text-yellow-800">New Lease Available</h3>
                  <p className="text-sm text-yellow-700">
                    You have unsigned lease(s) waiting for your review. Check your matches below.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}


        
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
                          {leaseInfo[match.id] && leaseInfo[match.id].exists && (
                            leaseInfo[match.id].signed === true ? (
                              <Badge className="bg-green-600 hover:bg-green-500">Lease Signed</Badge>
                            ) : leaseInfo[match.id].signed === false ? (
                              <Badge className="bg-yellow-500 hover:bg-yellow-400 animate-pulse">📄 New Lease</Badge>
                            ) : null
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        {match.landlordName}
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
                    {leaseInfo[match.id] && leaseInfo[match.id].exists && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={leaseInfo[match.id].signed === true
                          ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100" 
                          : "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                        }
                        onClick={() => handleLeaseAction(match.id, leaseInfo[match.id].leaseId)}
                      >
                        📄 Review Lease
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
            <p className="text-gray-400 mb-4">Start browsing properties to connect with landlords</p>
            <Button onClick={() => navigate('/tenant')} className="roomzi-gradient">
              Browse Properties
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
                          {leaseInfo[match.id] && leaseInfo[match.id].exists && (
                            leaseInfo[match.id].signed === true ? (
                              <Badge className="bg-green-600 hover:bg-green-500">Lease Signed</Badge>
                            ) : leaseInfo[match.id].signed === false ? (
                              <Badge className="bg-yellow-500 hover:bg-yellow-400 animate-pulse">📄 New Lease</Badge>
                            ) : null
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        {match.landlordName}
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
                    {leaseInfo[match.id] && leaseInfo[match.id].exists && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={leaseInfo[match.id].signed === true
                          ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100" 
                          : "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                        }
                        onClick={() => handleLeaseAction(match.id, leaseInfo[match.id].leaseId)}
                      >
                        📄 Review Lease
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
                <p className="text-gray-400 mb-4">Start browsing properties to connect with landlords</p>
                <Button onClick={() => navigate('/tenant')} className="roomzi-gradient">
                  Browse Properties
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
              landlordName={selectedChat.landlordName}
              landlordImage={selectedChat.landlordImage}
              landlordId={selectedChat.landlordId}
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
    </div>
  );
};

export default TenantMatches;
