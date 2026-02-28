import { prisma } from "../config/prisma.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { getIO } from "../config/socket.js";
import { updateAllChatNames } from "../utils/chatNameUpdater.js";

// Mark messages as read for a specific user
export const markChatAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId, userType } = req.body; // userType: 'tenant' or 'landlord'

    const updateField = userType === 'tenant' ? 'tenant_last_read' : 'landlord_last_read';

    const updatedChat = await prisma.chats.update({
      where: { id: chatId },
      data: {
        [updateField]: new Date(),
      },
    });

    res.json(successResponse(updatedChat, "Chat marked as read"));
  } catch (error) {
    console.error("Error marking chat as read:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get all chats for a user (tenant or landlord) - Updated to include unread counts
export const getUserChats = async (req, res) => {
  try {
    const { userId, userType } = req.params; // userType: 'tenant' or 'landlord'

    const where = userType === 'tenant' 
      ? { tenant_id: userId }
      : { landlord_id: userId };

    const chats = await prisma.chats.findMany({
      where,
      include: {
        messages: {
          orderBy: { created_at: "desc" },
          take: 1, // Get only the latest message
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Manually fetch current names from related tables and calculate unread counts
    const chatsWithCurrentNames = await Promise.all(
      chats.map(async (chat, index) => {
        // Helper function to validate UUIDs
        const isValidUUID = (uuid) => {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(uuid);
        };

        // Fetch tenant profile (only if valid UUID)
        let tenantProfile = null;
        if (isValidUUID(chat.tenant_id)) {
          try {
            tenantProfile = await prisma.tenant_profiles.findUnique({
              where: { id: chat.tenant_id },
              select: { full_name: true, email: true }
            });
          } catch (error) {
            console.error(`Error fetching tenant profile for ${chat.tenant_id}:`, error.message);
          }
        } else {
          console.error(`Skipping tenant profile fetch - invalid UUID: ${chat.tenant_id}`);
        }

        // Fetch landlord profile (only if valid UUID)
        let landlordProfile = null;
        if (isValidUUID(chat.landlord_id)) {
          try {
            landlordProfile = await prisma.landlord_profiles.findUnique({
              where: { id: chat.landlord_id },
              select: { full_name: true, email: true }
            });
          } catch (error) {
            console.error(`Error fetching landlord profile for ${chat.landlord_id}:`, error.message);
          }
        } else {
          console.error(`Skipping landlord profile fetch - invalid UUID: ${chat.landlord_id}`);
        }

        // Fetch listing details
        let listing = null;
        if (chat.property_id && !isNaN(chat.property_id)) {
          try {
            listing = await prisma.listings.findUnique({
              where: { id: BigInt(chat.property_id) },
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                state: true,
                price: true,
                images: true
              }
            });
          } catch (error) {
            console.error(`Could not find listing with ID: ${chat.property_id}`);
          }
        }

        // Calculate unread message count
        const lastReadTime = userType === 'tenant' ? chat.tenant_last_read : chat.landlord_last_read;
        let unreadCount = 0;
        
        if (lastReadTime) {
          // Count messages after the last read time
          const unreadMessages = await prisma.messages.count({
            where: {
              chat_id: chat.id,
              created_at: {
                gt: lastReadTime
              },
              sender_id: {
                not: userId // Don't count user's own messages
              }
            }
          });
          unreadCount = unreadMessages;
        } else {
          // If never read, count all messages from the other user
          const totalMessages = await prisma.messages.count({
            where: {
              chat_id: chat.id,
              sender_id: {
                not: userId
              }
            }
          });
          unreadCount = totalMessages;
        }

        return {
          ...chat,
          tenantName: tenantProfile?.full_name || chat.tenant_name || 'Unknown Tenant',
          propertyTitle: listing?.title || chat.property_name || 'Unknown Property',
          landlord_name: landlordProfile?.full_name || chat.landlord_name || 'Unknown Landlord',
          unreadCount,
          unread: unreadCount > 0, // Add boolean unread property for frontend
          property_details: listing ? {
            address: listing.address,
            city: listing.city,
            state: listing.state,
            price: listing.price,
            images: listing.images
          } : null
        };
      })
    );

    res.json(successResponse(chatsWithCurrentNames, "Chats retrieved successfully"));
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get a specific chat with all messages
export const getChatById = async (req, res) => {
  try {
    const { id } = req.params;

    const chat = await prisma.chats.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!chat) {
      return res
        .status(404)
        .json(errorResponse(new Error("Chat not found"), 404));
    }

    // Manually fetch current names from related tables
    const tenantProfile = await prisma.tenant_profiles.findUnique({
      where: { id: chat.tenant_id },
      select: { full_name: true, email: true }
    });

    const landlordProfile = await prisma.landlord_profiles.findUnique({
      where: { id: chat.landlord_id },
      select: { full_name: true, email: true }
    });

    // Fetch listing details
    let listing = null;
    if (chat.property_id && !isNaN(chat.property_id)) {
      try {
        listing = await prisma.listings.findUnique({
          where: { id: BigInt(chat.property_id) },
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true,
            price: true,
            images: true
          }
        });
      } catch (error) {
        console.error(`Could not find listing with ID: ${chat.property_id}`);
      }
    }

    // Transform the response to include current names
    const chatWithCurrentNames = {
      ...chat,
      tenantName: tenantProfile?.full_name || chat.tenant_name || 'Unknown Tenant',
      landlordName: landlordProfile?.full_name || chat.landlord_name || 'Unknown Landlord',
      propertyTitle: listing?.title || chat.property_name || 'Unknown Property',
      property_details: listing ? {
        address: listing.address,
        city: listing.city,
        state: listing.state,
        price: listing.price,
        images: listing.images
      } : null
    };

    res.json(successResponse(chatWithCurrentNames, "Chat retrieved successfully"));
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Create a new chat
export const createChat = async (req, res) => {
  try {
    const { tenant_id, landlord_id, property_id } = req.body;

    // Check if chat already exists for this combination
    const existingChat = await prisma.chats.findFirst({
      where: {
        tenant_id,
        landlord_id,
        property_id,
      },
    });

    if (existingChat) {
      return res.json(successResponse(existingChat, "Chat already exists"));
    }

    // Fetch names from related tables and property info
    const tenantProfile = await prisma.tenant_profiles.findUnique({
      where: { id: tenant_id },
      select: { full_name: true }
    });

    const landlordProfile = await prisma.landlord_profiles.findUnique({
      where: { id: landlord_id },
      select: { full_name: true }
    });

    let listing = null;
    if (property_id && !isNaN(property_id)) {
      try {
        listing = await prisma.listings.findUnique({
          where: { id: BigInt(property_id) },
          select: { title: true }
        });
      } catch (error) {
        console.error(`Could not find listing with ID: ${property_id}`, error);
      }
    }

    // Create chat with current names
    const chat = await prisma.chats.create({
      data: {
        tenant_id,
        landlord_id,
        property_id,
        tenant_name: tenantProfile?.full_name || null,
        landlord_name: landlordProfile?.full_name || null,
        property_name: listing?.title || null,
      },
    });

    res.status(201).json(successResponse(chat, "Chat created successfully"));
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Send a message in a chat
export const sendMessage = async (req, res) => {
  try {
    const { chat_id, sender_id, content, sender_type, reply_to_id } = req.body;

    // Validate sender_type
    if (!['tenant', 'landlord'].includes(sender_type)) {
      return res.status(400).json(errorResponse(new Error("Invalid sender type"), 400));
    }

    // Verify chat exists
    const chat = await prisma.chats.findUnique({
      where: { id: chat_id },
    });

    if (!chat) {
      return res.status(404).json(errorResponse(new Error("Chat not found"), 404));
    }

    const message = await prisma.messages.create({
      data: {
        chat_id,
        sender_id,
        content,
        sender_type,
        reply_to_id: reply_to_id || null,
      },
    });

    // Emit the message via WebSocket to all users in the chat room
    try {
      const io = getIO();
      io.to(`chat-${chat_id}`).emit('new-message', {
        id: message.id,
        chat_id: message.chat_id,
        sender_id: message.sender_id,
        content: message.content,
        sender_type: message.sender_type,
        created_at: message.created_at,
        reply_to_id: message.reply_to_id,
      });
    } catch (socketError) {
      console.error("WebSocket error:", socketError);
      // Don't fail the request if WebSocket fails
    }

    res.status(201).json(successResponse(message, "Message sent successfully"));
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get messages for a specific chat
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page);
    const take = parseInt(limit);
    const skip = (pageNum - 1) * take;

    const messages = await prisma.messages.findMany({
      where: { chat_id: chatId },
      orderBy: { created_at: "desc" },
      skip,
      take,
    });

    // Reverse to show oldest first
    messages.reverse();

    res.json(successResponse(messages, "Messages retrieved successfully"));
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Delete a chat
export const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete all messages first (due to foreign key constraint)
    await prisma.messages.deleteMany({
      where: { chat_id: id },
    });

    // Delete the chat
    await prisma.chats.delete({
      where: { id },
    });

    // Notify users via WebSocket that chat was deleted
    try {
      const io = getIO();
      io.to(`chat-${id}`).emit('chat-deleted', { chatId: id });
    } catch (socketError) {
      console.error("WebSocket error:", socketError);
    }

    res.json(successResponse(null, "Chat deleted successfully"));
  } catch (error) {
    console.error("Error deleting chat:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json(errorResponse(new Error("Chat not found"), 404));
    }
    
    res.status(500).json(errorResponse(error));
  }
};

// Delete a single message by ID
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.messages.delete({
      where: { id },
    });
    res.json(successResponse(deleted, "Message deleted successfully"));
  } catch (error) {
    console.error("Error deleting message:", error);
    if (error.code === "P2025") {
      return res.status(404).json(errorResponse(new Error("Message not found"), 404));
    }
    res.status(500).json(errorResponse(error));
  }
};

// Manual endpoint to update all chat names (for maintenance)
export const updateAllChatNamesEndpoint = async (req, res) => {
  try {
    console.log('🔄 Manual chat names update requested');
    
    const result = await updateAllChatNames();
    
    res.json(successResponse(result, "Chat names updated successfully"));
  } catch (error) {
    console.error("Error updating chat names:", error);
    res.status(500).json(errorResponse(error));
  }
};
