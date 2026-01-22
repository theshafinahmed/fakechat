import { v } from "convex/values";
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
