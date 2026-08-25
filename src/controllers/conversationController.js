import { z } from 'zod';
import * as conversationService from '../services/conversationService.js';

const sendMessageSchema = z.object({
    content: z
        .string()
        .min(1, "Message cannot be empty")
        .max(2000, "Message is too long")
});


/**
 * ================================================================
 * GET USER CONVERSATIONS
 * ================================================================
 */

export const getConversations = async (
    req,
    res,
    next
) => {
    try {
        const conversations =
            await conversationService.getUserConversations(
                req.user.id
            );

        return res.status(200).json({
            success: true,
            count: conversations.length,
            data: conversations
        });

    } catch (error) {
        return next(error);
    }
};


/**
 * ================================================================
 * GET CONVERSATION MESSAGES
 * ================================================================
 */

export const getMessages = async (
    req,
    res,
    next
) => {
    try {
        const {
            id: conversationId
        } = req.params;

        const {
            limit,
            offset
        } = req.query;

        const result =
            await conversationService.getConversationMessages(
                conversationId,
                req.user.id,
                limit
                    ? parseInt(limit, 10)
                    : 100,
                offset
                    ? parseInt(offset, 10)
                    : 0
            );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        return next(error);
    }
};


/**
 * ================================================================
 * SEND MESSAGE
 * ================================================================
 */

export const sendMessage = async (
    req,
    res,
    next
) => {
    try {
        const {
            id: conversationId
        } = req.params;

        const validation =
            sendMessageSchema.safeParse(
                req.body
            );

        if (!validation.success) {
            const firstErrorMessage =
                validation.error.issues[0]?.message ||
                "Validation failed";

            return res.status(400).json({
                error: firstErrorMessage,
                issues:
                    validation.error.issues
            });
        }

        const message =
            await conversationService.sendMessage(
                conversationId,
                req.user.id,
                validation.data.content
            );

        return res.status(201).json({
            success: true,
            message:
                "Message sent successfully",
            data: message
        });

    } catch (error) {
        return next(error);
    }
};


/**
 * ================================================================
 * MARK CONVERSATION MESSAGES AS READ
 * ================================================================
 *
 * PUT /api/v1/conversations/:id/read
 *
 * When a user opens a conversation, all messages sent
 * by the other person are marked as read.
 */

export const markMessagesAsRead = async (
    req,
    res,
    next
) => {
    try {
        const {
            id: conversationId
        } = req.params;

        const result =
            await conversationService.markMessagesAsRead(
                conversationId,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Messages marked as read",
            data: result
        });

    } catch (error) {
        return next(error);
    }
};