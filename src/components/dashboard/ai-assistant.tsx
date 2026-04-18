'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  BookOpen,
  Lightbulb,
  Calendar,
  Bell,
  Paperclip,
  Mic,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */

const WELCOME_MESSAGE =
  'مرحباً! أنا المساعد الذكي لنظام AuraLab. يمكنني مساعدتك في تحليل بيانات الطلاب، تقديم اقتراحات لتحسين التفاعل، وإعداد التقارير. كيف يمكنني مساعدتك اليوم؟';

interface Suggestion {
  label: string;
  description: string;
  icon: React.ElementType;
}

const SUGGESTIONS: Suggestion[] = [
  {
    label: 'تحليل أداء الطلاب',
    description: 'تحليل شامل لأداء جميع الطلاب',
    icon: BookOpen,
  },
  {
    label: 'اقتراح تحسين التفاعل',
    description: 'توصيات مبنية على بيانات التفاعل',
    icon: Lightbulb,
  },
  {
    label: 'تقرير الحضور',
    description: 'ملخص الحضور والغياب',
    icon: Calendar,
  },
  {
    label: 'تنبيهات مهمة',
    description: 'عرض التنبيهات والملاحظات',
    icon: Bell,
  },
];

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════ */

export default function AiAssistant() {
  const { chatMessages, addChatMessage, clearChat, isAiLoading, setIsAiLoading } =
    useAppStore();

  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
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
    toast.success('تم مسح المحادثة');
  };

  const hasMessages = chatMessages.length > 0;

  /* ─── Group consecutive messages ──────────────────────────── */
  const groupedMessages = chatMessages.reduce<
    { msg: (typeof chatMessages)[0]; showAvatar: boolean; isFirstInGroup: boolean }[]
  >((acc, msg, i) => {
    const prev = i > 0 ? chatMessages[i - 1] : null;
    const isFirstInGroup = !prev || prev.role !== msg.role;
    const showAvatar = isFirstInGroup;
    acc.push({ msg, showAvatar, isFirstInGroup });
    return acc;
  }, []);

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-[#18181B] overflow-hidden glass-heavy">
      {/* ═══════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════ */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-white/10"
        style={{
          background:
            'linear-gradient(135deg, #1E1E26 0%, #1a1a28 50%, #1E1E26 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/15">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            {/* Online status dot */}
            <span className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#1E1E26]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">المساعد الذكي</h2>
              {/* Message count badge */}
              {hasMessages && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-400">
                  {chatMessages.length}
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              متصل
            </span>
          </div>
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

      {/* ═══════════════════════════════════════════════════════
          CHAT AREA
          ═══════════════════════════════════════════════════════ */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-3 scroll-smooth"
        style={{ maxHeight: 'calc(100vh - 340px)', minHeight: '320px' }}
      >
        {/* ─── Welcome State ───────────────────────────────── */}
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            {/* Animated gradient ring around bot icon */}
            <div className="relative mb-8">
              <div
                className="absolute inset-0 rounded-3xl animate-spin"
                style={{
                  background:
                    'conic-gradient(from 0deg, #f59e0b, #d97706, #f59e0b, transparent, #f59e0b)',
                  animationDuration: '3s',
                  filter: 'blur(4px)',
                  opacity: 0.6,
                }}
              />
              <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-[#1a1a24] border border-white/10">
                <Bot className="w-12 h-12 text-amber-400" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">المساعد الذكي</h3>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-md mb-8">
              {WELCOME_MESSAGE}
            </p>

            {/* 2×2 Suggestion Cards Grid */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
              {SUGGESTIONS.map((s) => {
                const IconComp = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.label)}
                    disabled={isAiLoading}
                    className="group flex flex-col items-center gap-2 p-4 rounded-2xl
                      bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm
                      hover:bg-amber-500/[0.06] hover:border-amber-500/30
                      disabled:opacity-40 disabled:pointer-events-none
                      transition-all duration-300 text-center"
                  >
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-xl
                        bg-amber-500/10 group-hover:bg-amber-500/20
                        transition-colors duration-300"
                    >
                      <IconComp className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300 transition-colors duration-300">
                      {s.label}
                    </span>
                    <span className="text-[10px] text-zinc-500 leading-relaxed">
                      {s.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Messages ────────────────────────────────────── */}
        {groupedMessages.map(({ msg, showAvatar }) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 scroll-fade-in ${
                isUser ? 'flex-row' : 'flex-row-reverse'
              }`}
              style={{ marginBottom: showAvatar ? '12px' : '4px', marginTop: showAvatar ? '8px' : '0' }}
            >
              {/* Avatar */}
              {showAvatar ? (
                isUser ? (
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-xs font-bold text-white shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    }}
                  >
                    أ
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 bg-amber-500/15 border border-amber-500/20 shadow-lg">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                )
              ) : (
                <div className="w-8 shrink-0" />
              )}

              {/* Bubble */}
              <div className="flex flex-col max-w-[80%] sm:max-w-[70%]">
                <div
                  className={`relative px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isUser
                      ? 'rounded-2xl rounded-br-sm text-white shadow-lg'
                      : 'rounded-2xl rounded-bl-sm text-zinc-100 border border-white/[0.08]'
                  }`}
                  style={
                    isUser
                      ? {
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          boxShadow: '0 4px 20px -4px rgba(245, 158, 11, 0.35)',
                        }
                      : {
                          background: 'linear-gradient(135deg, rgba(34,34,46,0.8) 0%, rgba(30,30,40,0.9) 100%)',
                          backdropFilter: 'blur(12px)',
                        }
                  }
                >
                  {/* Tail / Arrow */}
                  {isUser && (
                    <div
                      className="absolute top-3 -right-[6px] w-3 h-3 rotate-45"
                      style={{
                        background: 'linear-gradient(135deg, #d97706 0%, #d97706 100%)',
                      }}
                    />
                  )}
                  {!isUser && (
                    <div
                      className="absolute top-3 -left-[6px] w-3 h-3 rotate-45 bg-[#22222E]/80 border-l border-b border-white/[0.08]"
                    />
                  )}
                  <span className="relative z-10">{msg.content}</span>
                </div>

                {/* Timestamp (only show for last message in group) */}
                {showAvatar && (
                  <span
                    className={`mt-1.5 text-[10px] text-zinc-600 px-1 ${
                      isUser ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* ─── Typing Indicator ────────────────────────────── */}
        {isAiLoading && (
          <div className="flex items-end gap-2.5 flex-row-reverse">
            {/* AI Avatar */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 bg-amber-500/15 border border-amber-500/20 shadow-lg">
              <Bot className="w-4 h-4 text-amber-400" />
            </div>

            <div className="flex flex-col">
              <div
                className="relative rounded-2xl rounded-bl-sm px-5 py-4 border border-white/[0.08]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(34,34,46,0.8) 0%, rgba(30,30,40,0.9) 100%)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {/* Tail */}
                <div className="absolute top-3 -left-[6px] w-3 h-3 rotate-45 bg-[#22222E]/80 border-l border-b border-white/[0.08]" />

                <div className="flex items-center gap-2" dir="ltr">
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
                  <span className="text-[10px] text-zinc-500 mr-1" dir="rtl">
                    يكتب...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ═══════════════════════════════════════════════════════
          INPUT AREA
          ═══════════════════════════════════════════════════════ */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 px-4 py-3 border-t border-white/10 bg-[#1E1E26]"
      >
        {/* Attachment button (coming soon) */}
        <button
          type="button"
          disabled
          aria-label="إرفاق ملف"
          title="قريباً..."
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0
            bg-white/5 border border-white/10
            text-zinc-600 cursor-not-allowed
            transition-colors"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Textarea with gradient focus border */}
        <div className="relative flex-1">
          {isFocused && (
            <div
              className="absolute -inset-[2px] rounded-xl pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #92400e 70%, #f59e0b 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradientShift 3s ease-in-out infinite',
                zIndex: 0,
              }}
            />
          )}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="اكتب رسالتك هنا..."
            disabled={isAiLoading}
            rows={1}
            dir="rtl"
            className="relative z-10 w-full resize-none rounded-xl bg-[#121218] border border-white/10 px-4 py-2.5
              text-sm text-white placeholder:text-zinc-500
              focus:outline-none
              disabled:opacity-50 transition-all"
          />
        </div>

        {/* Voice input button (coming soon) */}
        <button
          type="button"
          disabled
          aria-label="إدخال صوتي"
          title="قريباً..."
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0
            bg-white/5 border border-white/10
            text-zinc-600 cursor-not-allowed
            transition-colors"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Send button with animated gradient */}
        <button
          type="submit"
          disabled={!inputValue.trim() || isAiLoading}
          aria-label="إرسال"
          className="relative flex items-center justify-center w-10 h-10 rounded-xl shrink-0 overflow-hidden
            transition-all duration-200
            disabled:opacity-30 disabled:cursor-not-allowed
            cursor-pointer"
          style={{
            background:
              inputValue.trim() && !isAiLoading
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)'
                : '#3f3f46',
            boxShadow:
              inputValue.trim() && !isAiLoading
                ? '0 4px 16px -2px rgba(245, 158, 11, 0.4)'
                : 'none',
          }}
        >
          {/* Animated shimmer overlay when active */}
          {inputValue.trim() && !isAiLoading && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
                animation: 'sendShimmer 2s ease-in-out infinite',
              }}
            />
          )}
          <Send
            className="relative z-10 w-4 h-4"
            style={{
              color: inputValue.trim() && !isAiLoading ? '#fff' : '#a1a1aa',
            }}
          />
        </button>
      </form>

      {/* ═══════════════════════════════════════════════════════
          KEYFRAMES
          ═══════════════════════════════════════════════════════ */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes aiBounce {
              0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
              30% { transform: translateY(-6px); opacity: 1; }
            }

            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }

            @keyframes sendShimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `,
        }}
      />
    </div>
  );
}
