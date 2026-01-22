import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
    args: {
        roomId: v.id("rooms"),
        senderName: v.string(),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("messages", {
            roomId: args.roomId,
            senderName: args.senderName,
            content: args.content,
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
