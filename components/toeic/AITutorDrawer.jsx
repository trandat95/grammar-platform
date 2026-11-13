import React, { useState } from 'react';

/**
 * AITutorDrawer Component (Milestone E6, AC-U6.5)
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
    <div className="toeic-drawer-overlay" onClick={onClose}>
      <div
        className="toeic-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="toeic-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                backgroundColor: 'var(--ds-accent-bg)',
                color: 'var(--ds-accent)'
              }}
            >
              🧑‍🏫
            </span>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--ds-text)' }}>
                AI Gia Sư Ngữ Pháp TOEIC
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', margin: 0 }}>
                Chủ điểm: {question.ai_analysis?.primary_topic_name_vi || question.primary_grammar_topic_id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 800,
              border: '1px solid var(--ds-border)',
              backgroundColor: 'var(--ds-card)',
              color: 'var(--ds-text)',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* CHAT MESSAGES BODY */}
        <div className="toeic-drawer-body">
          {/* Welcome Message */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '1rem',
              border: '1px solid var(--ds-border)',
              backgroundColor: 'var(--ds-bg-elevated)'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ds-accent)', marginBottom: '0.35rem' }}>
              Xin chào! Tôi có thể giải thích chi tiết câu hỏi #{question.number || question.id}:
            </div>
            <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--ds-text)', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
              "{question.context_sentence || question.stem}"
            </p>
            {question.ai_analysis?.micro_rule_formula_vi && (
              <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--ds-success)' }}>
                Công thức: {question.ai_analysis.micro_rule_formula_vi}
              </div>
            )}
          </div>

          {/* User & AI Messages */}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`toeic-chat-bubble ${m.role === 'user' ? 'toeic-chat-user' : 'toeic-chat-ai'}`}
            >
              <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--ds-text-muted)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ds-accent)' }} />
              AI Gia Sư đang phân tích dữ liệu...
            </div>
          )}
        </div>

        {/* QUICK PROMPT CHIPS */}
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-bg-elevated)', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(p)}
              className="toeic-prompt-chip"
            >
              {p}
            </button>
          ))}
        </div>

        {/* INPUT BOX */}
        <div className="toeic-drawer-footer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="text"
            value={inputText}
            placeholder="Đặt câu hỏi cho AI Gia Sư..."
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            style={{
              flex: 1,
              padding: '0.55rem 0.85rem',
              borderRadius: '0.75rem',
              fontSize: '0.85rem',
              border: '1px solid var(--ds-border)',
              backgroundColor: 'var(--ds-card)',
              color: 'var(--ds-text)',
              outline: 'none'
            }}
          />

          <button
            type="button"
            disabled={!inputText.trim() || isLoading}
            onClick={() => handleSendMessage()}
            className="toeic-btn toeic-btn-primary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.8rem', opacity: !inputText.trim() || isLoading ? 0.4 : 1 }}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
