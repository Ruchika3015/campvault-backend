import * as conversationRepository from '../repositories/conversationRepository.js';
import * as notificationService from './notificationService.js';

export const getUserConversations = async (userId) => {
    return await conversationRepository.findConversationsByUserId(userId);
};

export const getConversationMessages = async (conversationId, userId, limit = 100, offset = 0) => {
    const isUserParticipant = await conversationRepository.isParticipant(conversationId, userId);
    if (!isUserParticipant) {
        const error = new Error("Access denied: You are not a participant in this conversation.");
        error.statusCode = 403;
        throw error;
    }

    const conversation = await conversationRepository.findConversationById(conversationId);
    if (!conversation) {
        const error = new Error("Conversation not found.");
        error.statusCode = 404;
        throw error;
    }

    const messages = await conversationRepository.findMessagesByConversationId(conversationId, limit, offset);
    return {
        conversation,
        messages
    };
};

export const sendMessage = async (conversationId, userId, content) => {
    const isUserParticipant = await conversationRepository.isParticipant(conversationId, userId);
    if (!isUserParticipant) {
        const error = new Error("Access denied: You cannot send messages in this conversation.");
        error.statusCode = 403;
        throw error;
    }

    const message = await conversationRepository.createMessage({
        conversationId,
        senderId: userId,
        content
    });

    // Notify other participant asynchronously
    const otherParticipantId = await conversationRepository.findOtherParticipant(conversationId, userId);
    if (otherParticipantId) {
        notificationService.notifyUser({
            userId: otherParticipantId,
            type: 'NEW_MESSAGE',
            title: 'New Message',
            message: `You received a new message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
            referenceType: 'conversation',
            referenceId: conversationId
        }).catch(err => console.error("Notification trigger error:", err));
    }

    return message;
};
