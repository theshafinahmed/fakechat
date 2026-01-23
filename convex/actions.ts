import { v } from "convex/values";
import * as webpush from "web-push";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

export const sendNotification = action({
    args: {
        roomId: v.id("rooms"),
        roomName: v.string(),
        roomCode: v.string(),
        senderName: v.string(),
        content: v.string(),
        excludeSessionId: v.string(),
    },
    handler: async (ctx, args) => {
        const subscriptions = await ctx.runQuery(
            internal.notifications.getSubscriptions,
            {
                roomId: args.roomId,
            },
        );

        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const privateKey = process.env.VAPID_PRIVATE_KEY;

        if (!publicKey || !privateKey) {
            console.warn(
                "VAPID keys not set in Convex environment. Notifications will fail.",
            );
            return;
        }

        webpush.setVapidDetails(
            "mailto:hello@fakechat.app", // Change to your contact email
            publicKey,
            privateKey,
        );

        const payload = JSON.stringify({
            title: `${args.senderName} @ ${args.roomName}`,
            body: args.content.substring(0, 100),
            url: `/room/${args.roomCode}`,
        });

        for (const sub of subscriptions) {
            // Don't notify the sender
            if (sub.sessionId === args.excludeSessionId) continue;

            try {
                await webpush.sendNotification(
                    JSON.parse(sub.subscription),
                    payload,
                );
            } catch (error) {
                console.error("Error sending push notification:", error);
            }
        }
    },
});
