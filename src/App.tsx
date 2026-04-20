import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi, I’m your Curam Expert Assistant. Ask me anything about Curam workflows, evidence, cases, testing, requirements, or troubleshooting.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const data = await response.json();

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: data.reply || "Sorry, I couldn’t generate a response.",
        },
      ]);
    } catch (error) {
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "Something went wrong while contacting the assistant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Curam Expert Assistant</h1>
          <p style={styles.subtitle}>
            Ask functional, technical, testing, and requirements questions about Curam.
          </p>
        </div>

        <div style={styles.chatBox}>
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                ...styles.messageRow,
                justifyContent:
                  message.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...styles.messageBubble,
                  ...(message.role === "user"
                    ? styles.userBubble
                    : styles.assistantBubble),
                }}
              >
                {message.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={styles.messageRow}>
              <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
                Thinking...
              </div>
            </div>
          )}
        </div>

        <div style={styles.inputRow}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a Curam question..."
            style={styles.textarea}
            rows={3}
          />
          <button onClick={handleSend} style={styles.button} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    height: "85vh",
    overflow: "hidden",
  },
  header: {
    padding: "24px",
    borderBottom: "1px solid #e5e7eb",
  },
  title: {
    margin: 0,
    fontSize: "28px",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#555",
  },
  chatBox: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "#fafafa",
  },
  messageRow: {
    display: "flex",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius: "14px",
    whiteSpace: "pre-wrap",
    lineHeight: 1.5,
  },
  userBubble: {
    background: "#2563eb",
    color: "white",
  },
  assistantBubble: {
    background: "#e5e7eb",
    color: "#111827",
  },
  inputRow: {
    display: "flex",
    gap: "12px",
    padding: "16px",
    borderTop: "1px solid #e5e7eb",
    background: "#fff",
  },
  textarea: {
    flex: 1,
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "12px",
    fontSize: "14px",
    resize: "none",
  },
  button: {
    border: "none",
    borderRadius: "12px",
    padding: "12px 20px",
    background: "#111827",
    color: "white",
    cursor: "pointer",
  },
};