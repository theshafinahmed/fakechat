"use strict";
"use client";

import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    Link as LinkIcon,
    MessageSquareQuote,
    Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../convex/_generated/api";

type View = "initial" | "create" | "join";

export default function Home() {
    const [view, setView] = useState<View>("initial");
    const [roomName, setRoomName] = useState("");
    const [creatorName, setCreatorName] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();
    const createRoom = useMutation(api.rooms.create);

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomName || !creatorName) return;

        setIsLoading(true);
        setError("");
        try {
            const { code } = await createRoom({ name: roomName, creatorName });
            router.push(`/room/${code}`);
        } catch {
            setError("Failed to create room. Please try again.");
            setIsLoading(false);
        }
    };

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (roomCode.length !== 6) {
            setError("Room code must be 6 characters.");
            return;
        }
        router.push(`/room/${roomCode.toUpperCase()}`);
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm flex flex-col gap-8 z-10"
            >
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="p-4 rounded-3xl bg-primary/10 text-primary mb-2">
                        <MessageSquareQuote size={40} />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">
                        FakeChat
                    </h1>
                    <p className="text-secondary text-sm">
                        Prank your friends with total anonymity.
                    </p>
                </div>

                <div className="relative min-h-75">
                    <AnimatePresence mode="wait">
                        {view === "initial" && (
                            <motion.div
                                key="initial"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="flex flex-col gap-4"
                            >
                                <button
                                    onClick={() => setView("create")}
                                    className="w-full p-6 rounded-2xl bg-surface hover:bg-surface-hover border border-border flex items-center gap-4 transition-all group"
                                >
                                    <div className="p-3 rounded-xl bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                                        <Plus size={24} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-foreground">
                                            Create Room
                                        </div>
                                        <div className="text-secondary text-xs">
                                            Start a new private prank session
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setView("join")}
                                    className="w-full p-6 rounded-2xl bg-surface hover:bg-surface-hover border border-border flex items-center gap-4 transition-all group"
                                >
                                    <div className="p-3 rounded-xl bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                                        <LinkIcon size={24} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-foreground">
                                            Join Room
                                        </div>
                                        <div className="text-secondary text-xs">
                                            Enter a 6-character code to join
                                        </div>
                                    </div>
                                </button>
                            </motion.div>
                        )}

                        {view === "create" && (
                            <motion.form
                                key="create"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleCreateRoom}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-secondary ml-1 uppercase tracking-wider">
                                        Room Name
                                    </label>
                                    <input
                                        autoFocus
                                        required
                                        type="text"
                                        placeholder="e.g., The Secret Group"
                                        value={roomName}
                                        onChange={(e) =>
                                            setRoomName(e.target.value)
                                        }
                                        className="w-full p-4 rounded-xl bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-secondary ml-1 uppercase tracking-wider">
                                        Your &quot;Original&quot; Name
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="So friends know it's you"
                                        value={creatorName}
                                        onChange={(e) =>
                                            setCreatorName(e.target.value)
                                        }
                                        className="w-full p-4 rounded-xl bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setView("initial")}
                                        className="flex-1 p-4 rounded-xl bg-transparent border border-border hover:bg-surface transition-all text-foreground font-medium"
                                    >
                                        Back
                                    </button>
                                    <button
                                        disabled={isLoading}
                                        type="submit"
                                        className="flex-2 p-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all font-semibold flex items-center justify-center gap-2"
                                    >
                                        {isLoading
                                            ? "Creating..."
                                            : "Create Room"}
                                        {!isLoading && <ArrowRight size={20} />}
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        {view === "join" && (
                            <motion.form
                                key="join"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleJoinRoom}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-secondary ml-1 uppercase tracking-wider">
                                        Room Code
                                    </label>
                                    <input
                                        autoFocus
                                        required
                                        maxLength={6}
                                        type="text"
                                        placeholder="6-character code"
                                        value={roomCode}
                                        onChange={(e) =>
                                            setRoomCode(
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        className="w-full p-4 rounded-xl bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-center text-2xl font-mono tracking-[0.5em]"
                                    />
                                </div>
                                {error && (
                                    <p className="text-red-500 text-xs text-center">
                                        {error}
                                    </p>
                                )}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setView("initial")}
                                        className="flex-1 p-4 rounded-xl bg-transparent border border-border hover:bg-surface transition-all text-foreground font-medium"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-2 p-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all font-semibold flex items-center justify-center gap-2"
                                    >
                                        Join Room
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Footer Info */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-10 text-secondary/40 text-[10px] uppercase tracking-[0.2em]"
            >
                Encrypted • Anonymous • Ephemeral
            </motion.p>
        </main>
    );
}
