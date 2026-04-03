import express from 'express';
import { 
  sendMessage,
  sendMessageValidation,
  getReceivedMessages,
  getSentMessages,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  getConversation
} from '../controllers/messageController';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limit: 150 requests per 15 minutes for messaging
const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { success: false, error: 'Trop de requêtes, réessayez plus tard' },
});

router.use(authenticate);
router.use(messageLimiter);

// Send a new message
router.post(
  '/send',
  sendMessageValidation,
  sendMessage
);

// Get received messages (inbox)
router.get('/received', getReceivedMessages);

// Get sent messages
router.get('/sent', getSentMessages);

// Get unread message count
router.get('/unread/count', getUnreadCount);

// Mark message as read
router.put('/:messageId/read', markAsRead);

// Get conversation with another user
router.get('/conversation/:otherUserId', getConversation);

// Delete a message
router.delete('/:messageId', deleteMessage);

export default router;
