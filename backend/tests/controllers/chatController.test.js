import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getUserChats, getChatById, createChat, sendMessage, getChatMessages, deleteChat, deleteMessage } from '../../src/controllers/chatController.js';

// Mock the response and request objects
const mockRes = {
  json: jest.fn().mockReturnThis(),
  status: jest.fn().mockReturnThis(),
};

const mockReq = {
  params: {},
  body: {},
  query: {},
};

describe('Chat Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRes.json.mockClear();
    mockRes.status.mockClear();
  });

  describe('getUserChats', () => {


    it('should handle database errors', async () => {
      mockReq.params = { userId: 'user-1', userType: 'tenant' };
      const error = new Error('Database connection failed');
      global.mockPrisma.chats.findMany.mockRejectedValue(error);

      await getUserChats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
        statusCode: 500,
      });
    });
  });

  describe('getChatById', () => {
    it('should return chat with messages successfully', async () => {
      const mockChat = {
        id: 'chat-1',
        tenant_id: 'tenant-1',
        landlord_id: 'landlord-1',
        property_id: '1',
        created_at: new Date(),
        messages: [
          {
            id: 'msg-1',
            content: 'Hello!',
            sender_type: 'tenant',
            created_at: new Date(),
          },
          {
            id: 'msg-2',
            content: 'Hi there!',
            sender_type: 'landlord',
            created_at: new Date(),
          },
        ],
      };

      mockReq.params.id = 'chat-1';
      global.mockPrisma.chats.findUnique.mockResolvedValue(mockChat);
      global.mockPrisma.tenant_profiles.findUnique.mockResolvedValue({
        id: 'tenant-1',
        full_name: 'Test Tenant',
      });
      global.mockPrisma.landlord_profiles.findUnique.mockResolvedValue({
        id: 'landlord-1',
        full_name: 'Test Landlord',
      });
      global.mockPrisma.listings.findUnique.mockResolvedValue({
        id: BigInt(1),
        title: 'Test Property',
      });

      await getChatById(mockReq, mockRes);

      expect(global.mockPrisma.chats.findUnique).toHaveBeenCalledWith({
        where: { id: 'chat-1' },
        include: {
          messages: {
            orderBy: { created_at: 'asc' },
          },
        },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'chat-1',
          tenantName: 'Test Tenant',
          landlordName: 'Test Landlord',
          propertyTitle: 'Test Property',
          messages: expect.arrayContaining([
            expect.objectContaining({
              id: 'msg-1',
              content: 'Hello!',
              sender_type: 'tenant',
            }),
            expect.objectContaining({
              id: 'msg-2',
              content: 'Hi there!',
              sender_type: 'landlord',
            }),
          ]),
        }),
        message: 'Chat retrieved successfully',
      });
    });

    it('should return 404 when chat not found', async () => {
      mockReq.params.id = 'non-existent-chat';
      global.mockPrisma.chats.findUnique.mockResolvedValue(null);

      await getChatById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Chat not found',
        statusCode: 404,
      });
    });
  });

  describe('createChat', () => {
    it('should create new chat successfully', async () => {
      const chatData = {
        tenant_id: 'tenant-1',
        landlord_id: 'landlord-1',
        property_id: '1',
      };

      const createdChat = {
        id: 'chat-1',
        ...chatData,
        tenant_name: 'Test Tenant',
        landlord_name: 'Test Landlord',
        property_name: 'Test Property',
        created_at: new Date(),
      };

      mockReq.body = chatData;
      global.mockPrisma.chats.findFirst.mockResolvedValue(null);
      global.mockPrisma.tenant_profiles.findUnique.mockResolvedValue({
        id: 'tenant-1',
        full_name: 'Test Tenant',
      });
      global.mockPrisma.landlord_profiles.findUnique.mockResolvedValue({
        id: 'landlord-1',
        full_name: 'Test Landlord',
      });
      global.mockPrisma.listings.findUnique.mockResolvedValue({
        id: BigInt(1),
        title: 'Test Property',
      });
      global.mockPrisma.chats.create.mockResolvedValue(createdChat);

      await createChat(mockReq, mockRes);

      expect(global.mockPrisma.chats.findFirst).toHaveBeenCalledWith({
        where: {
          tenant_id: 'tenant-1',
          landlord_id: 'landlord-1',
          property_id: '1',
        },
      });
      expect(global.mockPrisma.chats.create).toHaveBeenCalledWith({
        data: {
          tenant_id: 'tenant-1',
          landlord_id: 'landlord-1',
          property_id: '1',
          tenant_name: 'Test Tenant',
          landlord_name: 'Test Landlord',
          property_name: 'Test Property',
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: createdChat,
        message: 'Chat created successfully',
      });
    });

    it('should return existing chat if already exists', async () => {
      const chatData = {
        tenant_id: 'tenant-1',
        landlord_id: 'landlord-1',
        property_id: '1',
      };

      const existingChat = {
        id: 'existing-chat',
        ...chatData,
        created_at: new Date(),
      };

      mockReq.body = chatData;
      global.mockPrisma.chats.findFirst.mockResolvedValue(existingChat);

      await createChat(mockReq, mockRes);

      expect(global.mockPrisma.chats.create).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: existingChat,
        message: 'Chat already exists',
      });
    });

    it('should handle invalid property_id', async () => {
      const chatData = {
        tenant_id: 'tenant-1',
        landlord_id: 'landlord-1',
        property_id: 'invalid-id',
      };

      mockReq.body = chatData;
      global.mockPrisma.chats.findFirst.mockResolvedValue(null);
      global.mockPrisma.tenant_profiles.findUnique.mockResolvedValue({
        id: 'tenant-1',
        full_name: 'Test Tenant',
      });
      global.mockPrisma.landlord_profiles.findUnique.mockResolvedValue({
        id: 'landlord-1',
        full_name: 'Test Landlord',
      });
      global.mockPrisma.listings.findUnique.mockRejectedValue(new Error('Invalid ID'));

      const createdChat = {
        id: 'chat-1',
        ...chatData,
        tenant_name: 'Test Tenant',
        landlord_name: 'Test Landlord',
        property_name: null,
        created_at: new Date(),
      };

      global.mockPrisma.chats.create.mockResolvedValue(createdChat);

      await createChat(mockReq, mockRes);

      expect(global.mockPrisma.chats.create).toHaveBeenCalledWith({
        data: {
          tenant_id: 'tenant-1',
          landlord_id: 'landlord-1',
          property_id: 'invalid-id',
          tenant_name: 'Test Tenant',
          landlord_name: 'Test Landlord',
          property_name: null,
        },
      });
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const messageData = {
        chat_id: 'chat-1',
        sender_id: 'tenant-1',
        content: 'Hello!',
        sender_type: 'tenant',
      };

      const createdMessage = {
        id: 'msg-1',
        ...messageData,
        created_at: new Date(),
        reply_to_id: null,
      };

      mockReq.body = messageData;
      global.mockPrisma.chats.findUnique.mockResolvedValue({ id: 'chat-1' });
      global.mockPrisma.messages.create.mockResolvedValue(createdMessage);

      await sendMessage(mockReq, mockRes);

      expect(global.mockPrisma.chats.findUnique).toHaveBeenCalledWith({
        where: { id: 'chat-1' },
      });
      expect(global.mockPrisma.messages.create).toHaveBeenCalledWith({
        data: {
          chat_id: 'chat-1',
          sender_id: 'tenant-1',
          content: 'Hello!',
          sender_type: 'tenant',
          reply_to_id: null,
        },
      });
      expect(global.mockIO.to).toHaveBeenCalledWith('chat-chat-1');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: createdMessage,
        message: 'Message sent successfully',
      });
    });

    it('should handle reply messages', async () => {
      const messageData = {
        chat_id: 'chat-1',
        sender_id: 'landlord-1',
        content: 'Reply message',
        sender_type: 'landlord',
        reply_to_id: 'msg-1',
      };

      const createdMessage = {
        id: 'msg-2',
        ...messageData,
        created_at: new Date(),
      };

      mockReq.body = messageData;
      global.mockPrisma.chats.findUnique.mockResolvedValue({ id: 'chat-1' });
      global.mockPrisma.messages.create.mockResolvedValue(createdMessage);

      await sendMessage(mockReq, mockRes);

      expect(global.mockPrisma.messages.create).toHaveBeenCalledWith({
        data: {
          chat_id: 'chat-1',
          sender_id: 'landlord-1',
          content: 'Reply message',
          sender_type: 'landlord',
          reply_to_id: 'msg-1',
        },
      });
    });

    it('should return 400 for invalid sender_type', async () => {
      const messageData = {
        chat_id: 'chat-1',
        sender_id: 'user-1',
        content: 'Hello!',
        sender_type: 'invalid-type',
      };

      mockReq.body = messageData;

      await sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid sender type',
        statusCode: 400,
      });
    });

    it('should return 404 when chat not found', async () => {
      const messageData = {
        chat_id: 'non-existent-chat',
        sender_id: 'user-1',
        content: 'Hello!',
        sender_type: 'tenant',
      };

      mockReq.body = messageData;
      global.mockPrisma.chats.findUnique.mockResolvedValue(null);

      await sendMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Chat not found',
        statusCode: 404,
      });
    });

    it('should handle WebSocket errors gracefully', async () => {
      const messageData = {
        chat_id: 'chat-1',
        sender_id: 'tenant-1',
        content: 'Hello!',
        sender_type: 'tenant',
      };

      const createdMessage = {
        id: 'msg-1',
        ...messageData,
        created_at: new Date(),
        reply_to_id: null,
      };

      mockReq.body = messageData;
      global.mockPrisma.chats.findUnique.mockResolvedValue({ id: 'chat-1' });
      global.mockPrisma.messages.create.mockResolvedValue(createdMessage);
      global.mockIO.to.mockImplementation(() => {
        throw new Error('WebSocket error');
      });

      await sendMessage(mockReq, mockRes);

      // Should still respond successfully even if WebSocket fails
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: createdMessage,
        message: 'Message sent successfully',
      });
    });
  });

  describe('getChatMessages', () => {
    it('should return paginated messages successfully', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          chat_id: 'chat-1',
          sender_id: 'tenant-1',
          content: 'First message',
          sender_type: 'tenant',
          created_at: new Date('2024-01-01'),
        },
        {
          id: 'msg-2',
          chat_id: 'chat-1',
          sender_id: 'landlord-1',
          content: 'Second message',
          sender_type: 'landlord',
          created_at: new Date('2024-01-02'),
        },
      ];

      mockReq.params.chatId = 'chat-1';
      mockReq.query = { page: '1', limit: '50' };
      global.mockPrisma.messages.findMany.mockResolvedValue(mockMessages);

      await getChatMessages(mockReq, mockRes);

      expect(global.mockPrisma.messages.findMany).toHaveBeenCalledWith({
        where: { chat_id: 'chat-1' },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 50,
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockMessages.reverse(), // Should be reversed to show oldest first
        message: 'Messages retrieved successfully',
      });
    });

    it('should handle custom pagination parameters', async () => {
      mockReq.params.chatId = 'chat-1';
      mockReq.query = { page: '2', limit: '10' };
      global.mockPrisma.messages.findMany.mockResolvedValue([]);

      await getChatMessages(mockReq, mockRes);

      expect(global.mockPrisma.messages.findMany).toHaveBeenCalledWith({
        where: { chat_id: 'chat-1' },
        orderBy: { created_at: 'desc' },
        skip: 10, // (page - 1) * limit
        take: 10,
      });
    });
  });

  describe('deleteChat', () => {
    it('should delete chat and messages successfully', async () => {
      mockReq.params.id = 'chat-1';
      global.mockPrisma.messages.deleteMany.mockResolvedValue({ count: 2 });
      global.mockPrisma.chats.delete.mockResolvedValue({ id: 'chat-1' });

      await deleteChat(mockReq, mockRes);

      expect(global.mockPrisma.messages.deleteMany).toHaveBeenCalledWith({
        where: { chat_id: 'chat-1' },
      });
      expect(global.mockPrisma.chats.delete).toHaveBeenCalledWith({
        where: { id: 'chat-1' },
      });
      expect(global.mockIO.to).toHaveBeenCalledWith('chat-chat-1');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Chat deleted successfully',
      });
    });

    it('should return 404 when chat not found', async () => {
      mockReq.params.id = 'non-existent-chat';
      global.mockPrisma.messages.deleteMany.mockResolvedValue({ count: 0 });
      global.mockPrisma.chats.delete.mockRejectedValue({ code: 'P2025' });

      await deleteChat(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Chat not found',
        statusCode: 404,
      });
    });
  });

  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      const deletedMessage = {
        id: 'msg-1',
        chat_id: 'chat-1',
        content: 'Deleted message',
      };

      mockReq.params.id = 'msg-1';
      global.mockPrisma.messages.delete.mockResolvedValue(deletedMessage);

      await deleteMessage(mockReq, mockRes);

      expect(global.mockPrisma.messages.delete).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: deletedMessage,
        message: 'Message deleted successfully',
      });
    });

    it('should return 404 when message not found', async () => {
      mockReq.params.id = 'non-existent-message';
      global.mockPrisma.messages.delete.mockRejectedValue({ code: 'P2025' });

      await deleteMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Message not found',
        statusCode: 404,
      });
    });
  });
}); 