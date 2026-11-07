import { useState } from "react";

const AI_PROJECT_URL = import.meta.env.VITE_SEVERAIN_AI_SUPABASE_URL || "https://iijxdopbacltbzrafbka.supabase.co";
const AI_ANON_KEY = import.meta.env.VITE_SEVERAIN_AI_SUPABASE_ANON_KEY || "";
const CHAT_URL = `${AI_PROJECT_URL.replace(/\/+$/, "")}/functions/v1/chat`;
const MAX_MESSAGE_LENGTH = 4000;

const SYSTEM_GUIDANCE = `You are Severain AI, the general workflow assistant embedded in a school admin panel.
Help administrators understand how to use the Student API and Student Results screens, including entering student records, selecting a program and level, entering marks, reviewing averages and positions, saving drafts, and publishing results.
You cannot access or change student records, call the school API, or perform administrative actions. Explain how the administrator can complete actions using the existing authenticated forms.
Keep help generic. Do not request, process, or repeat student names, IDs, codes, contact details, individual marks, or other student-specific information. If asked to review or process an individual student's information, ask the administrator to remove those details and direct them to the existing admin form.`;

const SUGGESTIONS = [
  "How do I add or update a student?",
  "How do I enter and save student results?",
  "How are averages and class positions calculated?",
  "How do draft and published results differ?",
];

export default function SeverainAdminAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState("");

  const sendMessage = async (messageText = input) => {
    const text = messageText.trim();
    if (!text || streaming) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      setStatus(`Keep each message under ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.`);
      return;
    }
    if (!AI_ANON_KEY) {
      setStatus("Severain AI is not configured. Set VITE_SEVERAIN_AI_SUPABASE_ANON_KEY in the admin panel environment and rebuild.");
      return;
    }

    const updatedMessages = [...messages, { role: "user", content: text }];
    setMessages(updatedMessages);
    setInput("");
    setStatus("");
    setStreaming(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: AI_ANON_KEY,
          Authorization: `Bearer ${AI_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.slice(-12),
          mode: "learner",
          language: "en",
          adminSystem: SYSTEM_GUIDANCE,
        }),
      });

      if (!response.ok || !response.body) {
        let errorMessage = `Severain AI request failed (HTTP ${response.status}).`;
        try {
          const errorBody = await response.json();
          if (errorBody?.error) errorMessage = errorBody.error;
        } catch {
          // Keep the explicit HTTP error when the service does not return JSON.
        }
        throw new Error(errorMessage);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const chunk = JSON.parse(data);
            assistantText += chunk.choices?.[0]?.delta?.content || "";
          } catch {
            throw new Error("Severain AI returned an invalid streaming response.");
          }
        }
      }
      buffer += decoder.decode();
      if (buffer.trim().startsWith("data:")) {
        const data = buffer.trim().slice(5).trim();
        if (data && data !== "[DONE]") {
          try {
            const chunk = JSON.parse(data);
            assistantText += chunk.choices?.[0]?.delta?.content || "";
          } catch {
            throw new Error("Severain AI returned an invalid streaming response.");
          }
        }
      }

      const finalText = assistantText.trim();
      if (!finalText) throw new Error("Severain AI returned an empty response. Please try again.");
      setMessages([...updatedMessages, { role: "assistant", content: finalText }]);
    } catch (error) {
      setMessages(messages);
      setInput(text);
      setStatus(error.message || "Unable to reach Severain AI. Please try again.");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <section className="adm-panel adm-ai-panel">
      <div className="adm-panel-head">
        <div>
          <h3>Severain AI</h3>
          <p>General guidance for student records and results workflows. The assistant cannot view or change school records.</p>
        </div>
      </div>

      <div className="adm-ai-privacy" role="note">
        For student privacy, do not enter student names, IDs, codes, contact details, or marks. Your chat is sent to the Severain AI service.
      </div>

      {messages.length === 0 ? (
        <div className="adm-ai-welcome">
          <strong>What would you like help with?</strong>
          <div className="adm-ai-suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                className="adm-btn adm-btn-light"
                disabled={streaming}
                onClick={() => sendMessage(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="adm-ai-messages" aria-live="polite" aria-label="Chat messages">
          {messages.map((message, index) => (
            <article className={`adm-ai-message adm-ai-message-${message.role}`} key={`${message.role}-${index}`}>
              <strong>{message.role === "user" ? "You" : "Severain AI"}</strong>
              <p>{message.content}</p>
            </article>
          ))}
          {streaming && <p className="adm-ai-thinking">Severain AI is thinking…</p>}
        </div>
      )}

      {status && <p className="adm-status" aria-live="assertive">{status}</p>}

      <form
        className="adm-ai-compose"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
      >
        <label className="adm-field">
          <span>Ask a general workflow question</span>
          <textarea
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(event) => setInput(event.target.value)}
            placeholder="For example: How do I publish a saved result?"
            value={input}
          />
        </label>
        <div className="adm-ai-compose-footer">
          <small>{input.length}/{MAX_MESSAGE_LENGTH}</small>
          <button className="adm-btn" disabled={streaming || !input.trim()} type="submit">
            {streaming ? "Waiting…" : "Ask Severain AI"}
          </button>
        </div>
      </form>
    </section>
  );
}
