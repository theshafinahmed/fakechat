import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

// Send a message to a room
export const send = mutation({
    args: {
        roomId: v.id("rooms"),
        senderName: v.string(),
        sessionId: v.string(),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        // Get the room details first
        const room = await ctx.db.get(args.roomId);
        if (!room) throw new Error("Room not found");

        // Insert the message
        await ctx.db.insert("messages", {
            roomId: args.roomId,
            senderName: args.senderName,
            sessionId: args.sessionId,
            content: args.content,
        });

        // Update room's last activity timestamp
        await ctx.db.patch(args.roomId, {
            lastActivityAt: Date.now(),
        });

        // Schedule the notification action
        await ctx.scheduler.runAfter(0, internal.actions.sendNotification, {
            roomId: args.roomId,
            roomName: room.name,
            senderName: args.senderName,
            content: args.content,
            excludeSessionId: args.sessionId,
            roomCode: room.code,
        });
    },
});

export const list = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();
    },
});
