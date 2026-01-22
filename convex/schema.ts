import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    rooms: defineTable({
        name: v.string(),
        code: v.string(), // Unique room code generated on create
        creatorName: v.string(), // Name of the person who created it
        lastActivityAt: v.number(), // Used for the 24h cleanup cron
    }).index("by_code", ["code"]),

    messages: defineTable({
        roomId: v.id("rooms"),
        senderName: v.string(),
        sessionId: v.string(), // UUID stored in localStorage
        content: v.string(),
    }).index("by_room", ["roomId"]),
});
