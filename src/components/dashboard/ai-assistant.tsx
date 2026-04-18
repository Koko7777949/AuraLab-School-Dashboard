'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Bot, Send, Trash2, Sparkles, MessageSquare } from 'lucide-react';

const WELCOME_MESSAGE =
  'مرحباً! أنا المساعد الذكي لنظام AuraLab. يمكنني مساعدتك في تحليل بيانات الطلاب، تقديم اقتراحات لتحسين التفاعل، وإعداد التقارير. كيف يمكنني مساعدتك اليوم؟';

const SUGGESTIONS = [
  'تحليل أداء الطلاب',
  'اقتراح تحسين التفاعل',
  'تقرير الحضور',
  'تنبيهات مهمة',
] as const;

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AiAssistant() {
  const { chatMessages, addChatMessage, clearChat, isAiLoading, setIsAiLoading } =
    useAppStore();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ─── Scroll to bottom ───────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isAiLoading, scrollToBottom]);

  // ─── Auto-resize textarea ───────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputValue]);

  // ─── Send message ───────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isAiLoading) return;

      const userMessage = {
        id: generateId(),
        role: 'user' as const,
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      addChatMessage(userMessage);
      setInputValue('');
      setIsAiLoading(true);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      try {
        const history = [...chatMessages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, history }),
        });

        if (!res.ok) throw new Error('فشل في الاتصال بالمساعد');

        const data = await res.json();

        addChatMessage({
          id: generateId(),
          role: 'assistant',
          content: data.reply ?? data.message ?? data.content ?? 'عذراً، لم أتمكن من معالجة طلبك.',
          timestamp: new Date().toISOString(),
        });
      } catch {
        addChatMessage({
          id: generateId(),
          role: 'assistant',
          content: 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsAiLoading(false);
      }
    },
    [chatMessages, addChatMessage, isAiLoading, setIsAiLoading],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleClear = () => {
    clearChat();
  };

  const hasMessages = chatMessages.length > 0;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-[#18181B] overflow-hidden">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1E1E26]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/15">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-base font-bold text-white">المساعد الذكي</h2>
        </div>

        {hasMessages && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            aria-label="مسح المحادثة"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح المحادثة</span>
          </button>
        )}
      </div>

      {/* ─── Chat Area ───────────────────────────────────────── */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
        style={{ maxHeight: 'calc(100vh - 340px)', minHeight: '320px' }}
      >
        {/* Empty / Welcome state */}
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 mb-6">
              <Bot className="w-10 h-10 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">المساعد الذكي</h3>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
              {WELCOME_MESSAGE}
            </p>
          </div>
        )}

        {/* Messages */}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}
          >
            <div
              className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                msg.role === 'user'
                  ? 'bg-amber-500/90 text-white rounded-2xl rounded-br-md'
                  : 'bg-[#22222E] text-zinc-100 rounded-2xl rounded-bl-md'
              }`}
            >
              <div className="flex items-start gap-2">
                {msg.role === 'assistant' && (
                  <Bot className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                )}
                <span>{msg.content}</span>
              </div>
            </div>
            <span className="mt-1.5 text-[10px] text-zinc-500 px-1">
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}

        {/* AI Typing indicator */}
        {isAiLoading && (
          <div className="flex flex-col items-end">
            <div className="bg-[#22222E] rounded-2xl rounded-bl-md px-5 py-4">
              <div className="flex items-center gap-1.5" dir="ltr">
                <span
                  className="w-2 h-2 rounded-full bg-amber-400"
                  style={{
                    animation: 'aiBounce 1.4s ease-in-out infinite',
                    animationDelay: '0ms',
                  }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-amber-400"
                  style={{
                    animation: 'aiBounce 1.4s ease-in-out infinite',
                    animationDelay: '200ms',
                  }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-amber-400"
                  style={{
                    animation: 'aiBounce 1.4s ease-in-out infinite',
                    animationDelay: '400ms',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Suggestion Chips ────────────────────────────────── */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex flex-wrap gap-2 justify-end" dir="rtl">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => sendMessage(suggestion)}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                bg-white/5 text-zinc-300 border border-white/10
                hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-300
                disabled:opacity-40 disabled:pointer-events-none
                transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Input Area ──────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-3 px-4 py-3 border-t border-white/10 bg-[#1E1E26]"
      >
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب رسالتك هنا..."
          disabled={isAiLoading}
          rows={1}
          dir="rtl"
          className="flex-1 resize-none rounded-xl bg-white/5 border border-white/10 px-4 py-2.5
            text-sm text-white placeholder:text-zinc-500
            focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40
            disabled:opacity-50 transition-all"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isAiLoading}
          aria-label="إرسال"
          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0
            transition-all duration-200
            disabled:opacity-30 disabled:cursor-not-allowed
            cursor-pointer"
          style={{
            backgroundColor: inputValue.trim() && !isAiLoading ? '#f59e0b' : '#3f3f46',
          }}
        >
          <Send className="w-4 h-4" style={{ color: inputValue.trim() && !isAiLoading ? '#fff' : '#a1a1aa' }} />
        </button>
      </form>

      {/* ─── Keyframe for typing dots ────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes aiBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}} />
    </div>
  );
}
