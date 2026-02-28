import express from "express";
import {
  getUserChats,
  getChatById,
  createChat,
  sendMessage,
  getChatMessages,
  deleteChat,
  deleteMessage,
  markChatAsRead,
  updateAllChatNamesEndpoint,
} from "../controllers/chatController.js";

const router = express.Router();

// GET /api/chats/user/:userId/:userType - Get all chats for a user
router.get("/user/:userId/:userType", getUserChats);

// GET /api/chats/:id - Get chat by ID with all messages
router.get("/:id", getChatById);

// POST /api/chats - Create new chat
router.post("/", createChat);

// DELETE /api/chats/:id - Delete chat
router.delete("/:id", deleteChat);

// PATCH /api/chats/:chatId/read - Mark chat as read
router.patch("/:chatId/read", markChatAsRead);

// GET /api/chats/:chatId/messages - Get messages for a chat
router.get("/:chatId/messages", getChatMessages);

// POST /api/chats/messages - Send a message
router.post("/messages", sendMessage);

// DELETE /api/chats/messages/:id - Delete a single message
router.delete("/messages/:id", deleteMessage);

// POST /api/chats/update-names - Update all chat names (maintenance endpoint)
router.post("/update-names", updateAllChatNamesEndpoint);

export default router;
