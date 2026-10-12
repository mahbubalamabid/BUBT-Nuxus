import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "../services/messageService";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(searchParams.get("conversation") || null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(socketUrl);
    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoadingConvos(true);
      try {
        const data = await getConversations();
        setConversations(data);
        if (!activeId && data.length > 0) setActiveId(data[0]._id);
      } finally {
        setLoadingConvos(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;

    setSearchParams({ conversation: activeId });

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await getMessages(activeId);
        setMessages(data);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();

    socketRef.current?.emit("joinConversation", activeId);

    const handler = (msg) => {
      if (msg.conversation === activeId || msg.conversation?.toString() === activeId) {
        // The sender's own socket is in this room too, so without this check
        // a message they just sent would be appended twice: once from the
        // optimistic/API-response update in handleSend, and again here when
        // the server broadcasts it back to everyone in the room (including
        // them). Only add it if it isn't already in state.
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      }
    };
    socketRef.current?.on("newMessage", handler);

    return () => {
      socketRef.current?.emit("leaveConversation", activeId);
      socketRef.current?.off("newMessage", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const text = draft;
    setDraft("");
    const msg = await sendMessage(activeId, text);
    setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
  };

  const activeConvo = conversations.find((c) => c._id === activeId);
  const otherParticipant = activeConvo?.participants?.find((p) => p._id !== user?._id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Messages</h1>

      <div className="card grid h-[600px] grid-cols-1 overflow-hidden sm:grid-cols-3">
        {/* Conversation list */}
        <div className="col-span-1 overflow-y-auto border-r border-slate-100">
          {loadingConvos ? (
            <div className="p-6 text-center text-sm text-slate-400">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No conversations yet. Accept a collaboration request or message a
              researcher from their profile.
            </div>
          ) : (
            conversations.map((c) => {
              const other = c.participants?.find((p) => p._id !== user?._id);
              return (
                <button
                  key={c._id}
                  onClick={() => setActiveId(c._id)}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${
                    activeId === c._id ? "bg-primary-50" : ""
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                    {other?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {other?.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {c.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Chat window */}
        <div className="col-span-2 flex min-h-0 flex-col">
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
              Select a conversation to start chatting
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 p-4">
                <p className="font-semibold text-slate-900">{otherParticipant?.name}</p>
                <p className="text-xs text-slate-500">{otherParticipant?.department}</p>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {loadingMessages ? (
                  <div className="text-center text-sm text-slate-400">Loading...</div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.sender?._id === user?._id;
                    return (
                      <div
                        key={m._id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                            isMine
                              ? "bg-primary-600 text-white"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-100 p-4">
                <input
                  className="input-field"
                  placeholder="Type a message..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="btn-primary">
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
