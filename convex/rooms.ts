import { v } from "convex/values";
import { generateRoomCode } from "../lib/utils";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        name: v.string(),
        creatorName: v.string(),
    },
    handler: async (ctx, args) => {
        const code = generateRoomCode();
        const roomId = await ctx.db.insert("rooms", {
            name: args.name,
            code: code,
            creatorName: args.creatorName,
            lastActivityAt: Date.now(),
        });
        return { roomId, code };
    },
});

export const getByCode = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("rooms")
            .withIndex("by_code", (q) => q.eq("code", args.code))
            .unique();
    },
});
