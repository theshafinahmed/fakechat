import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const crons = cronJobs();

crons.interval("cleanup old data", { minutes: 30 }, internal.crons.cleanup);

export default crons;

export const cleanup = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        // Delete old messages (1 hour)
        const oldMessages = await ctx.db
            .query("messages")
            .filter((q) => q.lt(q.field("_creationTime"), oneHourAgo))
            .collect();

        for (const msg of oldMessages) {
            await ctx.db.delete(msg._id);
        }

        // Delete inactive rooms (no messages for 24 hours)
        const oldRooms = await ctx.db
            .query("rooms")
            .filter((q) => q.lt(q.field("lastActivityAt"), oneDayAgo))
            .collect();

        for (const room of oldRooms) {
            // Also delete messages for these rooms
            const roomMsgs = await ctx.db
                .query("messages")
                .withIndex("by_room", (q) => q.eq("roomId", room._id))
                .collect();
            for (const rm of roomMsgs) {
                await ctx.db.delete(rm._id);
            }
            await ctx.db.delete(room._id);
        }
    },
});
