import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  sendChatMessage,
  getChatHistory,
  startRainEvent,
  addRainParticipant,
  completeRainEvent,
  getRainHistory,
  getUserRainRewards,
  deleteChatMessage,
  filterProfanity,
} from "./liveFeatures";

/**
 * Live Chat & Rain System Router
 * Handles real-time messaging and reward distribution
 */
export const liveRouter = router({
  /**
   * Chat System Endpoints
   */
  chat: router({
    sendMessage: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1).max(500),
          mentions: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          // Filter profanity
          if (!filterProfanity(input.message)) {
            return {
              success: false,
              error: "Message contains prohibited content",
            };
          }

          // Send message
          const result = await sendChatMessage(
            ctx.user.id,
            ctx.user.username || "Anonymous",
            input.message,
            input.mentions
          );

          return {
            success: true,
            message: result,
          };
        } catch (error) {
          console.error("[Live Chat] Send message error:", error);
          return {
            success: false,
            error: "Failed to send message",
          };
        }
      }),

    getHistory: publicProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(100).optional(),
        })
      )
      .query(async ({ input }) => {
        try {
          const messages = await getChatHistory(input.limit || 50);
          return {
            success: true,
            messages,
          };
        } catch (error) {
          console.error("[Live Chat] Get history error:", error);
          return {
            success: false,
            error: "Failed to fetch chat history",
            messages: [],
          };
        }
      }),

    deleteMessage: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Only admins can delete messages
          if (ctx.user.role !== "admin") {
            return {
              success: false,
              error: "Only admins can delete messages",
            };
          }

          await deleteChatMessage(input.messageId);
          return { success: true };
        } catch (error) {
          console.error("[Live Chat] Delete message error:", error);
          return {
            success: false,
            error: "Failed to delete message",
          };
        }
      }),
  }),

  /**
   * Rain System Endpoints
   */
  rain: router({
    startEvent: protectedProcedure
      .input(
        z.object({
          totalAmount: z.number().positive(),
          participantCount: z.number().int().positive(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          // Only admins can start rain events
          if (ctx.user.role !== "admin") {
            return {
              success: false,
              error: "Only admins can start rain events",
            };
          }

          const rainEvent = await startRainEvent(input.totalAmount, input.participantCount);
          return {
            success: true,
            rainEvent,
          };
        } catch (error) {
          console.error("[Rain System] Start event error:", error);
          return {
            success: false,
            error: "Failed to start rain event",
          };
        }
      }),

    addParticipant: protectedProcedure
      .input(
        z.object({
          rainEventId: z.number(),
          amountReceived: z.number().positive(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          await addRainParticipant(input.rainEventId, ctx.user.id, input.amountReceived);
          return { success: true };
        } catch (error) {
          console.error("[Rain System] Add participant error:", error);
          return {
            success: false,
            error: "Failed to add participant",
          };
        }
      }),

    completeEvent: protectedProcedure
      .input(z.object({ rainEventId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Only admins can complete rain events
          if (ctx.user.role !== "admin") {
            return {
              success: false,
              error: "Only admins can complete rain events",
            };
          }

          await completeRainEvent(input.rainEventId);
          return { success: true };
        } catch (error) {
          console.error("[Rain System] Complete event error:", error);
          return {
            success: false,
            error: "Failed to complete rain event",
          };
        }
      }),

    getHistory: publicProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(100).optional(),
        })
      )
      .query(async ({ input }) => {
        try {
          const events = await getRainHistory(input.limit || 10);
          return {
            success: true,
            events,
          };
        } catch (error) {
          console.error("[Rain System] Get history error:", error);
          return {
            success: false,
            error: "Failed to fetch rain history",
            events: [],
          };
        }
      }),

    getUserRewards: protectedProcedure.query(async ({ ctx }) => {
      try {
        const totalRewards = await getUserRainRewards(ctx.user.id);
        return {
          success: true,
          totalRewards,
        };
      } catch (error) {
        console.error("[Rain System] Get user rewards error:", error);
        return {
          success: false,
          error: "Failed to fetch user rewards",
          totalRewards: 0,
        };
      }
    }),
  }),
});

export type LiveRouter = typeof liveRouter;
