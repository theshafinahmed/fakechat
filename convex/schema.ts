import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    rooms: defineTable({
        name: v.string(),
        code: v.string(),
        creatorName: v.string(),
    }).index("by_code", ["code"]),

    messages: defineTable({
        roomId: v.id("rooms"),
        senderName: v.string(),
        content: v.string(),
    }).index("by_room", ["roomId"]),
});
