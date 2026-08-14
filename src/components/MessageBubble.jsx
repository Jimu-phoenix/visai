import ReactMarkdown from "react-markdown";

export default function MessageBubble({ role, content, targetDevice }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed md:max-w-[70%] ${
          isUser
            ? "bg-amber text-ink font-medium"
            : "bg-panel2 text-paper"
        }`}
      >
        {isUser ? (
          content
        ) : (
          <div className="markdown-body">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
        {targetDevice && targetDevice !== "this" && (
          <div className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-cyan/80">
            → routed to {targetDevice}
          </div>
        )}
      </div>
    </div>
  );
}
