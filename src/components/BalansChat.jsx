import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Loader2, Sparkles } from 'lucide-react';
import { streamChat, buildBalansSystemPrompt } from '../services/chatApi';
import { useApp } from '../context/AppContext';

// ─── markdown renderer ───────────────────────────────────────────────────────

function boldify(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:#f0ece0;padding:1px 4px;border-radius:3px;font-family:\'DM Mono\',monospace;font-size:0.9em">$1</code>');
}

function Markdown({ text }) {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', lineHeight: 1.55, color: '#020309' }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: '5px' }} />;
        if (/^#{1,3}\s/.test(line)) return (
          <div key={i} style={{ fontWeight: 700, fontSize: '13px', margin: '6px 0 2px' }}>
            {line.replace(/^#+\s/, '')}
          </div>
        );
        if (/^[-*]\s/.test(line)) return (
          <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'baseline', marginBottom: '2px' }}>
            <span style={{ flexShrink: 0, color: '#888', fontSize: '9px', marginTop: '4px' }}>●</span>
            <span dangerouslySetInnerHTML={{ __html: boldify(line.slice(2)) }} />
          </div>
        );
        return <div key={i} style={{ marginBottom: '1px' }} dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
      })}
    </div>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: '5px', height: '5px', borderRadius: '50%', background: '#aaa',
          animation: `chatblink 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes chatblink{0%,80%,100%{opacity:.2}40%{opacity:1}}`}</style>
    </span>
  );
}

function Bubble({ msg }) {
  const isUser  = msg.role === 'user';
  const isEmpty = !msg.content && !msg.error;

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
      {!isUser && (
        <div style={{
          width: '26px', height: '26px', flexShrink: 0, marginRight: '7px', marginTop: '3px',
          background: '#FDEEC4', border: '2px solid #020309', borderRadius: '7px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={13} />
        </div>
      )}
      <div style={{
        maxWidth: '88%',
        background: isUser ? '#FDEEC4' : '#FFFFFF',
        border: '2px solid #020309',
        borderRadius: isUser ? '12px 12px 3px 12px' : '3px 12px 12px 12px',
        boxShadow: '2px 2px 0 #020309',
        padding: '9px 12px',
      }}>
        {isEmpty ? <ThinkingDots /> :
         msg.error ? <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#c0392b' }}>⚠ {msg.content}</div> :
         isUser    ? <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', lineHeight: 1.45 }}>{msg.content}</div> :
                     <Markdown text={msg.content} />
        }
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function BalansChat({ balansData }) {
  const { apiKey, language, t } = useApp();
  const SUGGESTIONS = [
    t('chat.suggestion1'), t('chat.suggestion2'), t('chat.suggestion3'),
    t('chat.suggestion4'), t('chat.suggestion5'),
  ];
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (text) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const history = [...messages, { role: 'user', content: userText }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setLoading(true);

    await streamChat({
      apiKey,
      systemPrompt: buildBalansSystemPrompt(balansData, language),
      messages: history,
      onDelta: (delta) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { role: 'assistant', content: last.content + delta }];
          }
          return prev;
        });
      },
      onDone:  () => setLoading(false),
      onError: (err) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && !last.content) {
            return [...prev.slice(0, -1), { role: 'assistant', content: err, error: true }];
          }
          return prev;
        });
        setLoading(false);
      },
    });
  }, [input, loading, messages, apiKey, balansData, language]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const noKey      = !apiKey;
  const hasMessages = messages.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAF3E3' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 16px',
        background: '#020309',
        flexShrink: 0,
      }}>
        <div style={{
          width: '30px', height: '30px',
          background: '#FDEEC4', border: '2px solid #FDEEC4', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Bot size={15} color="#020309" />
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '14px', color: '#FAF3E3' }}>
            Bookie AI
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#666' }}>
            {balansData.period} · {t('chat.balanceAnalysis')}
          </div>
        </div>
      </div>

      {/* No API key warning */}
      {noKey && (
        <div style={{
          margin: '16px', padding: '14px 16px', flexShrink: 0,
          background: '#FDEEC4', border: '2px solid #020309', borderRadius: '10px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '13px', lineHeight: 1.5,
        }}>
          <strong>{t('chat.noApiKeyTitle')}</strong><br />
          {t('chat.noApiKeyDescBefore')} <strong>{t('chat.noApiKeySettingsPath')}</strong> {t('chat.noApiKeyDescAfter')}
        </div>
      )}

      {/* Messages — fills remaining height */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* Empty state */}
        {!hasMessages && !noKey && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px',
              padding: '12px 13px',
              background: '#FFFFFF', border: '2px solid #020309',
              borderRadius: '10px', boxShadow: '2px 2px 0 #020309',
            }}>
              <Sparkles size={14} color="#888" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
                {t('chat.loadedBalance')}
              </span>
            </div>

            <div style={{ marginTop: '4px' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '10px', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#888', marginBottom: '7px' }}>
                {t('chat.suggestions')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} style={{
                    textAlign: 'left', cursor: 'pointer',
                    background: '#FFFFFF', border: '1.5px solid #020309',
                    borderRadius: '9px', padding: '8px 11px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#020309',
                    transition: 'background .1s',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FDEEC4'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!noKey && (
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'flex-end',
          padding: '10px 12px',
          borderTop: '2px solid #020309',
          background: '#FFFFFF',
          flexShrink: 0,
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t('chat.placeholder')}
            rows={1}
            disabled={loading}
            style={{
              flex: 1, resize: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px',
              background: '#FAF3E3', border: '2px solid #020309',
              borderRadius: '10px', padding: '8px 11px',
              color: '#020309', outline: 'none', lineHeight: 1.45,
              opacity: loading ? 0.5 : 1,
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width: '36px', height: '36px', flexShrink: 0,
              background: input.trim() && !loading ? '#020309' : '#e8e0d0',
              border: '2px solid #020309', borderRadius: '9px',
              boxShadow: input.trim() && !loading ? '2px 2px 0 #020309' : 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .1s',
              color: input.trim() && !loading ? '#FAF3E3' : '#aaa',
            }}
          >
            {loading
              ? <Loader2 size={15} style={{ animation: 'chatspin 1s linear infinite' }} />
              : <Send size={14} />
            }
          </button>
          <style>{`@keyframes chatspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </div>
  );
}
