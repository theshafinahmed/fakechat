import { v } from "convex/values";
import { internalQuery, mutation } from "./_generated/server";

export const getSubscriptions = internalQuery({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("subscriptions")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();
    },
});

export const subscribe = mutation({
    args: {
        roomId: v.id("rooms"),
        sessionId: v.string(),
        subscription: v.string(), // Pass as JSON string
    },
    handler: async (ctx, args) => {
        // Check if subscription already exists for this room/session
        const existing = await ctx.db
            .query("subscriptions")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                subscription: args.subscription,
            });
        } else {
            await ctx.db.insert("subscriptions", {
                roomId: args.roomId,
                sessionId: args.sessionId,
                subscription: args.subscription,
            });
        }
    },
});
