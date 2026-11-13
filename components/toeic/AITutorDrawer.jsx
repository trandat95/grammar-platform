import React, { useState } from 'react';

/**
 * AITutorDrawer Component (Milestone E6 & Section 6)
 * Conversational AI Tutor slide-over grounded in question ai_tutor_rag_context,
 * sentence_xray and micro-rule formulas.
 * Strict Design Token Discipline: var(--ds-*).
 */
export default function AITutorDrawer({
  isOpen = false,
  onClose,
  question,
  selectedOption = null
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !question) return null;

  const quickPrompts = [
    'Tại sao không dùng dạng V-ing được?',
    'Dấu hiệu nhận biết nhanh vị trí này là gì?',
    'Từ này thường đi với giới từ nào?'
  ];

  const handleSendMessage = async (msgText) => {
    const textToSend = msgText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/toeic/ai-tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          selectedOption,
          userMessage: textToSend
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: data.replyMarkdown || 'Đã có câu trả lời từ AI Gia Sư!' }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: 'Xin lỗi, hiện tại tôi chưa thể phân tích câu hỏi này.' }
        ]);
      }
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Lỗi mạng khi kết nối với AI Gia Sư.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md h-full flex flex-col border-l shadow-2xl transition-all"
        style={{
          backgroundColor: 'var(--ds-surface)',
          borderColor: 'var(--ds-border)'
        }}
      >
        {/* HEADER */}
        <div className="p-4 border-b flex items-center justify-between"
             style={{ borderColor: 'var(--ds-border)' }}>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: 'var(--ds-primary-subtle)', color: 'var(--ds-primary)' }}>
              🧑‍🏫
            </span>
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--ds-text-primary)' }}>
                AI Gia Sư Ngữ Pháp TOEIC
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
                Chủ điểm: {question.ai_analysis?.primary_topic_name_vi || question.primary_grammar_topic_id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border hover:bg-[var(--ds-surface-secondary)]"
            style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-primary)' }}
          >
            ✕
          </button>
        </div>

        {/* CHAT MESSAGES BODY */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs sm:text-sm">
          {/* Welcome Message */}
          <div className="p-3.5 rounded-2xl border space-y-1.5"
               style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)' }}>
            <div className="font-bold text-xs" style={{ color: 'var(--ds-primary)' }}>
              Xin chào! Tôi có thể giải thích chi tiết câu hỏi #{question.number || question.id}:
            </div>
            <p className="italic text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
              "{question.context_sentence || question.stem}"
            </p>
            {question.ai_analysis?.micro_rule_formula_vi && (
              <div className="text-[11px] font-mono font-semibold pt-1" style={{ color: 'var(--ds-text-primary)' }}>
                Công thức: {question.ai_analysis.micro_rule_formula_vi}
              </div>
            )}
          </div>

          {/* User & AI Messages */}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] ${
                m.role === 'user' ? 'ml-auto text-right' : 'mr-auto text-left border'
              }`}
              style={{
                backgroundColor: m.role === 'user' ? 'var(--ds-primary)' : 'var(--ds-surface)',
                borderColor: 'var(--ds-border)',
                color: m.role === 'user' ? 'var(--ds-surface)' : 'var(--ds-text-primary)'
              }}
            >
              <div className="whitespace-pre-line">{m.text}</div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs italic" style={{ color: 'var(--ds-text-muted)' }}>
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--ds-primary)' }} />
              AI Gia Sư đang phân tích dữ liệu...
            </div>
          )}
        </div>

        {/* QUICK PROMPT CHIPS */}
        <div className="p-3 border-t flex flex-wrap gap-1.5"
             style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)' }}>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(p)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all hover:bg-[var(--ds-surface)]"
              style={{
                backgroundColor: 'var(--ds-surface)',
                borderColor: 'var(--ds-border)',
                color: 'var(--ds-text-secondary)'
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* INPUT BOX */}
        <div className="p-3 border-t flex items-center gap-2"
             style={{ borderColor: 'var(--ds-border)' }}>
          <input
            type="text"
            value={inputText}
            placeholder="Đặt câu hỏi cho AI Gia Sư..."
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm border focus:outline-none focus:border-[var(--ds-primary)]"
            style={{
              backgroundColor: 'var(--ds-surface)',
              borderColor: 'var(--ds-border)',
              color: 'var(--ds-text-primary)'
            }}
          />

          <button
            type="button"
            disabled={!inputText.trim() || isLoading}
            onClick={() => handleSendMessage()}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
            style={{ backgroundColor: 'var(--ds-primary)', color: 'var(--ds-surface)' }}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
