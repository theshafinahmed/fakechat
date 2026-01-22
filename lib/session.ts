"use client";

import { v4 as uuidv4 } from "uuid";

const FAKECHAT_SESSION_KEY = "fakechat_session_id";

export function getSessionId() {
    if (typeof window === "undefined") return "";

    let sessionId = localStorage.getItem(FAKECHAT_SESSION_KEY);
    if (!sessionId) {
        sessionId = uuidv4();
        localStorage.getItem(FAKECHAT_SESSION_KEY);
        localStorage.setItem(FAKECHAT_SESSION_KEY, sessionId);
    }
    return sessionId;
}
