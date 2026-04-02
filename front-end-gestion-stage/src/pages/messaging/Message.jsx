import { useEffect, useRef, useState } from "react";
import api from "../../services/api";

export default function Message() {
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [receiverId, setReceiverId] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef(null);

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Récupérer les conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get("/messages/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error("Erreur fetch conversations:", err);
    }
  };

  // Récupérer les contacts (encadrant / stagiaires)
  const fetchContacts = async () => {
    try {
      const res = await api.get("/messages/contacts");
      setContacts(res.data);
    } catch (err) {
      console.error("Erreur fetch contacts:", err);
    }
  };

  // Charger les messages d'une conversation
  const fetchMessages = async (conversationId, otherUserId) => {
    try {
      const res = await api.get(`/messages/conversations/${conversationId}`);
      setMessages(res.data);
      setSelectedConv(conversationId);
      setReceiverId(otherUserId);
      scrollToBottom();
    } catch (err) {
      console.error("Erreur fetch messages:", err);
    }
  };

  // Envoyer un message
  const handleSend = async () => {
    if (!newMessage.trim() || !receiverId) return;

    const tempMessage = {
      id: Date.now(),
      body: newMessage,
      is_mine: true,
      created_at: new Date().toISOString(),
      sending: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    const messageToSend = newMessage;
    setNewMessage("");

    try {
      const res = await api.post("/messages/send", {
        receiver_id: receiverId,
        body: messageToSend,
      });

      // Remplacer le message temporaire par le vrai message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id
            ? { ...res.data.message, is_mine: true }
            : msg
        )
      );

      fetchConversations(); // Mettre à jour conversations
    } catch (err) {
      console.error("Erreur envoi message:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? { ...msg, error: true } : msg
        )
      );
    }
  };

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
    <div className="flex h-screen bg-gray-100">

      {/* Liste des conversations */}
      <div className="w-1/4 bg-white border-r p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">💬 Conversations</h2>

        {conversations.length === 0 && (
          <p className="text-gray-400 text-sm">Aucune conversation</p>
        )}

        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() =>
              fetchMessages(conv.id, conv.other_user.id)
            }
            className="p-3 mb-2 border rounded cursor-pointer hover:bg-gray-100"
          >
            <p className="font-semibold">{conv.other_user.name}</p>
            <p className="text-sm text-gray-500 truncate">
              {conv.last_message || "Aucun message"}
            </p>
            {conv.unread_count > 0 && (
              <span className="text-xs text-red-500">
                {conv.unread_count} non lus
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Zone de chat */}
      <div className="w-2/4 flex flex-col">
        <div className="p-3 border-b bg-white">
          {receiverId ? (
            <p className="font-bold">
              Conversation avec{" "}
              {contacts.find((c) => c.id === receiverId)?.name || "Utilisateur"}
            </p>
          ) : (
            <p className="text-gray-400">Sélectionner un contact</p>
          )}
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-gray-400 text-center mt-10">
              Aucune conversation sélectionnée
            </p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-2 ${msg.is_mine ? "text-right" : "text-left"}`}
            >
              <div
                className={`inline-block px-3 py-2 rounded-lg ${
                  msg.is_mine ? "bg-blue-500 text-white" : "bg-gray-300"
                }`}
              >
                {msg.body}
                {msg.sending && (
                  <span className="block text-xs opacity-70">Envoi...</span>
                )}
                {msg.error && (
                  <span className="block text-xs text-red-200">Échec</span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input message */}
        <div className="p-3 bg-white border-t flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message..."
            className="flex-1 border px-3 py-2 rounded"
            disabled={!receiverId}
          />
          <button
            onClick={handleSend}
            disabled={!receiverId}
            className={`ml-2 px-4 rounded ${
              receiverId ? "bg-blue-500 text-white" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Envoyer
          </button>
        </div>
      </div>

      {/* Liste des contacts */}
      <div className="w-1/4 bg-white border-l p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">👥 Contacts</h2>

        {contacts.length === 0 && (
          <p className="text-gray-400 text-sm">Aucun contact disponible</p>
        )}

        {contacts.map((c) => (
          <div
            key={c.id}
            onClick={() => {
              setReceiverId(c.id);
              setMessages([]);
              setSelectedConv(null);
            }}
            className="p-2 border mb-2 rounded cursor-pointer hover:bg-gray-100"
          >
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-gray-500">{c.role || c.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}