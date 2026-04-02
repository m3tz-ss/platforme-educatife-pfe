import { useEffect, useRef, useState } from "react";
import api from "../../services/api";

export default function Message() {
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [receiverId, setReceiverId] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef(null);

  // 🔽 Scroll auto
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 🔽 Conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get("/messages/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔽 Contacts
  const fetchContacts = async () => {
    try {
      const res = await api.get("/messages/contacts");
      setContacts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔽 Messages
  const fetchMessages = async (conversationId, otherUserId) => {
    try {
      const res = await api.get(`/messages/conversations/${conversationId}`);
      setMessages(res.data);
      setReceiverId(otherUserId);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔽 Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !receiverId) return;

    const temp = {
      id: Date.now(),
      body: newMessage,
      is_mine: true,
      sending: true,
    };

    setMessages((prev) => [...prev, temp]);
    setNewMessage("");

    try {
      const res = await api.post("/messages/send", {
        receiver_id: receiverId,
        body: temp.body,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === temp.id ? { ...res.data.message, is_mine: true } : m
        )
      );

      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔽 Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  useEffect(() => {
    fetchConversations();
    fetchContacts();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex h-screen">

      {/* 🔹 Conversations */}
      <div className="w-1/4 border-r p-3 overflow-y-auto">
        <h2 className="font-bold mb-3">Conversations</h2>

        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() =>
              fetchMessages(conv.id, conv.user?.id)
            }
            className="p-2 border mb-2 cursor-pointer hover:bg-gray-100"
          >
            <p className="font-semibold">
              {conv.user?.name || "User"}
            </p>

            <p className="text-sm text-gray-500">
              {conv.last_message?.body || "Aucun message"}
            </p>
          </div>
        ))}
      </div>

      {/* 🔹 Chat */}
      <div className="w-2/4 flex flex-col">

        {/* Header */}
        <div className="p-3 border-b">
          {receiverId ? (
            <p>
              Chat avec{" "}
              {contacts.find((c) => c.id === receiverId)?.name}
            </p>
          ) : (
            <p>Sélectionner contact</p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 p-3 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-2 ${
                msg.is_mine ? "text-right" : "text-left"
              }`}
            >
              <span
                className={`px-3 py-2 rounded inline-block ${
                  msg.is_mine
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300"
                }`}
              >
                {msg.body}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t flex">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border px-2"
            placeholder="Message..."
          />

          <button
            onClick={handleSend}
            className="ml-2 bg-blue-500 text-white px-4"
          >
            Send
          </button>
        </div>
      </div>

      {/* 🔹 Contacts */}
      <div className="w-1/4 border-l p-3 overflow-y-auto">
        <h2 className="font-bold mb-3">Contacts</h2>

        {contacts.map((c) => (
          <div
            key={c.id}
            onClick={() => {
              setReceiverId(c.id);
              setMessages([]);
            }}
            className="p-2 border mb-2 cursor-pointer hover:bg-gray-100"
          >
            <p>{c.name}</p>
            <p className="text-xs text-gray-500">
              {c.role || c.type}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}