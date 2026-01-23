"use client";

import { api } from "@/convex/_generated/api";
import { subscribeUserToPush } from "@/lib/notifications";
import { getSessionId } from "@/lib/session";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
    AnimatePresence,
    motion,
    PanInfo,
    useMotionValue,
    useTransform,
} from "framer-motion";
import {
    ArrowLeft,
    Bell,
    BellOff,
    Check,
    Copy,
    Info,
    Send,
    UserCircle,
    Users,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export default function ChatRoom() {
    const { code } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const room = useQuery(api.rooms.getByCode, { code: code as string });
    const messages = useQuery(
        api.messages.list,
        room ? { roomId: room._id } : "skip",
    );
    const sendMessage = useMutation(api.messages.send);
    const subscribeToNotifications = useMutation(api.notifications.subscribe);

    const sessionId = useMemo(() => getSessionId(), []);
    const [currentName, setCurrentName] = useState(
        searchParams.get("name") || "Anonymous",
    );

    const [inputText, setInputText] = useState("");
    const [showInfo, setShowInfo] = useState(false);
    const [showNameSwitcher, setShowNameSwitcher] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [replyTo, setReplyTo] = useState<{
        id: string;
        sender: string;
        content: string;
    } | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Auto-focus input when replying
    useEffect(() => {
        if (replyTo && inputRef.current) {
            inputRef.current.focus();
        }
    }, [replyTo]);

    // Check notification status on load
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
                reg.pushManager.getSubscription().then((sub) => {
                    setIsSubscribed(!!sub);
                });
            });
        }
    }, []);

    const handleNotificationToggle = async () => {
        try {
            if (isSubscribed) {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.getSubscription();
                await sub?.unsubscribe();
                setIsSubscribed(false);
            } else {
                const sub = await subscribeUserToPush();
                if (sub && room) {
                    await subscribeToNotifications({
                        roomId: room._id,
                        sessionId: sessionId,
                        subscription: JSON.stringify(sub),
                    });
                    setIsSubscribed(true);
                }
            }
        } catch (err: unknown) {
            console.error("Notification toggle failed:", err);
            if (
                err instanceof Error &&
                err.message === "VAPID Public Key not found"
            ) {
                alert("App configuration error: Push keys missing in Vercel.");
            } else {
                alert("Please allow notifications in your browser settings.");
            }
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !room) return;

        const content = replyTo
            ? `>> @${replyTo.sender}: ${replyTo.content}\n\n${inputText}`
            : inputText;

        await sendMessage({
            roomId: room._id,
            senderName: currentName,
            sessionId: sessionId,
            content: content,
        });

        setInputText("");
        setReplyTo(null);

        // Reset textarea height
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code as string);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (room === undefined)
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-primary">
                Loading...
            </div>
        );
    if (room === null)
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-red-500">
                Room not found.
            </div>
        );

    return (
        <div className="flex flex-col h-screen bg-chat-bg text-foreground relative overflow-hidden">
            {/* Top Navigation */}
            <header className="glass-effect fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4">
                <button
                    onClick={() => router.push("/")}
                    className="p-2 hover:bg-surface rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-secondary uppercase tracking-widest font-medium opacity-60">
                        Chatting as
                    </span>
                    <div className="flex items-center gap-1.5 leading-none">
                        <span className="font-semibold text-primary">
                            {currentName}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleNotificationToggle}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            isSubscribed
                                ? "text-primary hover:bg-primary/10"
                                : "text-secondary hover:bg-surface",
                        )}
                        title={
                            isSubscribed
                                ? "Disable Notifications"
                                : "Enable Notifications"
                        }
                    >
                        {isSubscribed ? (
                            <Bell size={22} />
                        ) : (
                            <BellOff size={22} />
                        )}
                    </button>

                    <button
                        onClick={() => setShowInfo(true)}
                        className="p-2 hover:bg-surface rounded-full transition-colors"
                    >
                        <Info size={24} />
                    </button>
                </div>
            </header>

            {/* Message List */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto pt-20 px-4 space-y-4 scroll-smooth"
            >
                <div className="h-4" /> {/* Top Spacer */}
                <div className="flex flex-col items-center py-8 opacity-40">
                    <Users size={32} />
                    <p className="text-xs mt-2 uppercase tracking-tighter">
                        You joined {room.name}
                    </p>
                </div>
                {messages?.map((msg) => (
                    <MessageBubble
                        key={msg._id}
                        message={msg}
                        isMe={msg.sessionId === sessionId}
                        onReply={(m) => {
                            const mainContent = m.content.startsWith(">> @")
                                ? m.content.split("\n\n").slice(1).join("\n\n")
                                : m.content;

                            setReplyTo({
                                id: m._id,
                                sender: m.senderName,
                                content: mainContent,
                            });
                        }}
                    />
                ))}
                <div className="h-32" /> {/* Bottom Spacer to prevent cutoff */}
            </div>

            {/* Input Section */}
            <footer className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-chat-bg/80 backdrop-blur-md">
                <div className="max-w-3xl mx-auto flex flex-col gap-2">
                    {/* Reply Preview */}
                    <AnimatePresence>
                        {replyTo && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="bg-surface border-l-4 border-primary p-2 rounded-lg flex items-center justify-between"
                            >
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-primary">
                                        Replying to {replyTo.sender}
                                    </p>
                                    <p className="text-xs text-secondary truncate">
                                        {replyTo.content}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setReplyTo(null)}
                                    className="text-secondary p-1"
                                >
                                    ×
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-end gap-2">
                        {/* Name Switcher */}
                        <div className="relative self-center mb-1">
                            <button
                                onClick={() =>
                                    setShowNameSwitcher(!showNameSwitcher)
                                }
                                className={cn(
                                    "flex items-center justify-center p-2 rounded-xl border transition-all",
                                    showNameSwitcher
                                        ? "bg-primary text-white border-primary"
                                        : "bg-surface border-border text-secondary hover:text-primary",
                                )}
                            >
                                <UserCircle size={24} />
                            </button>

                            <AnimatePresence>
                                {showNameSwitcher && (
                                    <>
                                        {/* Invisible backdrop to close on click outside */}
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() =>
                                                setShowNameSwitcher(false)
                                            }
                                        />
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                y: 10,
                                                scale: 0.95,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: 10,
                                                scale: 0.95,
                                            }}
                                            className="absolute bottom-full left-0 mb-2 p-3 bg-surface border border-border rounded-2xl premium-shadow min-w-50 z-50"
                                        >
                                            <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-2 ml-1">
                                                Change Identity
                                            </p>
                                            <input
                                                type="text"
                                                autoFocus
                                                value={currentName}
                                                onChange={(e) =>
                                                    setCurrentName(
                                                        e.target.value,
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter")
                                                        setShowNameSwitcher(
                                                            false,
                                                        );
                                                }}
                                                className="w-full bg-muted border border-border rounded-lg p-2 text-sm focus:border-primary outline-none"
                                                placeholder="New prank name..."
                                            />
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Text Area */}
                        <form
                            onSubmit={handleSend}
                            className="flex-1 flex bg-surface border border-border rounded-2xl items-end px-4 py-2"
                        >
                            <textarea
                                ref={inputRef}
                                rows={1}
                                placeholder="Message"
                                value={inputText}
                                onChange={(e) => {
                                    setInputText(e.target.value);
                                    e.target.style.height = "auto";
                                    e.target.style.height =
                                        e.target.scrollHeight + "px";
                                }}
                                onKeyDown={(e) => {
                                    // Ctrl+Enter or Cmd+Enter to send on desktop
                                    if (
                                        e.key === "Enter" &&
                                        (e.ctrlKey || e.metaKey)
                                    ) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                className="flex-1 bg-transparent border-none focus:ring-0 outline-none resize-none py-1.5 text-sm max-h-32"
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim()}
                                className={cn(
                                    "mb-0.5 ml-2 p-1.5 rounded-full transition-all",
                                    inputText.trim()
                                        ? "bg-primary text-white"
                                        : "text-secondary opacity-50",
                                )}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            </footer>

            {/* Info Modal */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setShowInfo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm bg-surface rounded-3xl border border-border p-8 relative flex flex-col items-center gap-6"
                        >
                            <div className="w-16 h-1 bg-border rounded-full mb-2" />
                            <div className="text-center">
                                <h2 className="text-2xl font-bold">
                                    {room.name}
                                </h2>
                                <p className="text-secondary text-sm">
                                    Created by {room.creatorName}
                                </p>
                                <p className="text-[10px] text-pink-500/60 uppercase tracking-tighter mt-1">
                                    Privacy Note: Messages are deleted every 1h,
                                    rooms every 24h.
                                </p>
                            </div>

                            <div className="w-full space-y-2">
                                <p className="text-[10px] uppercase tracking-widest text-secondary font-bold ml-1">
                                    Room Code
                                </p>
                                <div
                                    onClick={copyCode}
                                    className="w-full bg-muted border border-border rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-muted-foreground/10 transition-colors"
                                >
                                    <span className="text-2xl font-mono tracking-tight font-bold">
                                        {code}
                                    </span>
                                    {copied ? (
                                        <Check
                                            className="text-green-500"
                                            size={24}
                                        />
                                    ) : (
                                        <Copy
                                            className="text-secondary"
                                            size={24}
                                        />
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowInfo(false)}
                                className="w-full p-4 rounded-2xl bg-primary text-white font-bold"
                            >
                                Got it
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface Message {
    _id: string;
    _creationTime: number;
    senderName: string;
    content: string;
    sessionId: string;
}

function MessageBubble({
    message,
    isMe,
    onReply,
}: {
    message: Message;
    isMe: boolean;
    onReply: (m: Message) => void;
}) {
    const x = useMotionValue(0);
    const trigger = 60;

    // Deterministic color for names
    const getNameColor = (name: string) => {
        const colors = [
            "text-blue-400",
            "text-pink-400",
            "text-purple-400",
            "text-orange-400",
            "text-green-400",
            "text-cyan-400",
            "text-yellow-400",
            "text-indigo-400",
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // Smooth swiping effect
    const backgroundTransform = useTransform(
        x,
        [-trigger, 0, trigger],
        ["rgba(51, 144, 236, 0.2)", "rgba(0,0,0,0)", "rgba(51, 144, 236, 0.2)"],
    );

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        if (Math.abs(info.offset.x) > trigger) {
            onReply(message);
        }
    };

    const isReply = message.content.startsWith(">> @");
    let replyHeader = "";
    let mainContent = message.content;

    if (isReply) {
        const parts = message.content.split("\n\n");
        replyHeader = parts[0].substring(3);
        mainContent = parts.slice(1).join("\n\n");
    }

    return (
        <div
            className={cn(
                "flex w-full overflow-visible",
                isMe ? "justify-end" : "justify-start",
            )}
        >
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={handleDragEnd}
                style={{ x, backgroundColor: backgroundTransform }}
                className="relative cursor-grab active:cursor-grabbing max-w-[85%]"
            >
                <div
                    className={cn(
                        "relative px-4 py-2.5 rounded-2xl shadow-sm border border-white/5",
                        isMe
                            ? "bg-bubble-out rounded-tr-sm"
                            : "bg-bubble-in rounded-tl-sm",
                    )}
                >
                    <p
                        className={cn(
                            "text-[11px] font-bold mb-0.5",
                            getNameColor(message.senderName),
                        )}
                    >
                        {message.senderName}
                    </p>

                    {isReply && (
                        <div className="bg-black/20 border-l-2 border-primary/50 py-1.5 px-2 mb-2 rounded-md">
                            <p className="text-[10px] line-clamp-2 opacity-60 italic">
                                {replyHeader}
                            </p>
                        </div>
                    )}

                    <p className="text-[14px] leading-relaxed wrap-break-word whitespace-pre-wrap">
                        {mainContent}
                    </p>

                    <p className="text-[9px] text-white/40 text-right mt-1">
                        {new Date(message._creationTime).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" },
                        )}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
