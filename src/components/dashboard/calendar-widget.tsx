'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarEvent {
  date: number; // day of month
  title: string;
  color: string; // e.g. '#D4A574', '#10b981'
  id?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const ARABIC_DAYS_SHORT = [
  'س', 'أ', 'اث', 'ث', 'أر', 'خ', 'ج',
];

const EVENT_CATEGORIES = [
  { value: 'exam', label: 'امتحان', color: '#f43f5e' },
  { value: 'meeting', label: 'اجتماع', color: '#D4A574' },
  { value: 'activity', label: 'نشاط', color: '#10b981' },
  { value: 'deadline', label: 'موعد نهائي', color: '#38bdf8' },
  { value: 'cultural', label: 'ثقافي', color: '#a78bfa' },
];

// Mock events for current month
function getMockEvents(year: number, month: number): CalendarEvent[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = (d: number) => Math.min(d, daysInMonth);

  return [
    { date: safeDay(5), title: 'اختبار الرياضيات', color: '#f43f5e' },
    { date: safeDay(5), title: 'اجتماع المعلمين', color: '#D4A574' },
    { date: safeDay(12), title: 'نشاط رياضي مدرسي', color: '#10b981' },
    { date: safeDay(18), title: 'موعد تسليم الواجبات', color: '#38bdf8' },
    { date: safeDay(22), title: 'اختبار العلوم', color: '#f43f5e' },
    { date: safeDay(25), title: 'اجتماع أولياء الأمور', color: '#D4A574' },
    { date: safeDay(28), title: 'نشاط ثقافي', color: '#a78bfa' },
  ];
}

// ---------------------------------------------------------------------------
// CalendarWidget Component
// ---------------------------------------------------------------------------

export default function CalendarWidget() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; day: number } | null>(null);
  const [monthKey, setMonthKey] = useState(0);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('exam');
  const calendarRef = useRef<HTMLDivElement>(null);

  const { calendarEvents, addCalendarEvent } = useAppStore();

  const mockEvents = useMemo(
    () => getMockEvents(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const storeEventsForMonth = useMemo(() => {
    return calendarEvents
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .map(e => ({
        date: new Date(e.date).getDate(),
        title: e.title,
        color: e.color,
        id: e.id,
      }));
  }, [calendarEvents, currentYear, currentMonth]);

  const events = useMemo(() => [...mockEvents, ...storeEventsForMonth], [mockEvents, storeEventsForMonth]);

  const eventsMap = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    events.forEach((ev) => {
      const existing = map.get(ev.date) || [];
      existing.push(ev);
      map.set(ev.date, existing);
    });
    return map;
  }, [events]);

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDow = (firstDay.getDay() + 1) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) cells.push(null);
    }
    return cells;
  }, [currentYear, currentMonth]);

  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const isToday = (day: number) =>
    day === todayDate && currentMonth === todayMonth && currentYear === todayYear;

  const navigatePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
    setTooltipPos(null);
    setMonthKey((k) => k + 1);
  };

  const navigateNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
    setTooltipPos(null);
    setMonthKey((k) => k + 1);
  };

  const handleDateClick = (day: number, event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedDate(day);
    if (eventsMap.has(day)) {
      const rect = event.currentTarget.getBoundingClientRect();
      const containerRect = calendarRef.current?.getBoundingClientRect();
      setTooltipPos({
        x: containerRect ? rect.left - containerRect.left + rect.width / 2 : rect.left,
        y: containerRect ? rect.top - containerRect.top : rect.top,
        day,
      });
    } else {
      setTooltipPos(null);
    }
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tooltipPos && calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setTooltipPos(null);
        setSelectedDate(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [tooltipPos]);

  const handleAddEvent = () => {
    if (!newEventTitle.trim() || !selectedDate) return;
    const category = EVENT_CATEGORIES.find(c => c.value === newEventCategory);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    addCalendarEvent({
      id: `evt-${Date.now()}`,
      date: dateStr,
      title: newEventTitle.trim(),
      color: category?.color || '#D4A574',
      category: newEventCategory,
    });
    setNewEventTitle('');
    setShowEventForm(false);
    toast.success('تم إضافة الحدث بنجاح');
  };

  const upcomingEvents = useMemo(() => {
    const nowDay = today.getDate();
    const nowMonth = today.getMonth();
    const nowYear = today.getFullYear();
    return events
      .filter(e => e.date >= nowDay || currentMonth > nowMonth || currentYear > nowYear)
      .sort((a, b) => a.date - b.date)
      .slice(0, 5);
  }, [events, currentMonth, currentYear, today]);

  const isCurrentMonth =
    currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <div
      ref={calendarRef}
      dir="rtl"
      className="relative rounded-xl bg-[#1A1A24] border border-white/[0.06] p-4 w-full max-w-[320px] mx-auto select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={navigateNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-300 hover:bg-white/[0.06] hover:text-[#D4A574] hover:scale-110 active:scale-95"
          aria-label="الشهر التالي"
        >
          <ChevronLeft size={18} strokeWidth={1.8} />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#D4A574]" />
          <span className="text-sm font-bold text-white">{ARABIC_MONTHS[currentMonth]} {currentYear}</span>
        </div>
        <button
          onClick={navigatePrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-300 hover:bg-white/[0.06] hover:text-[#D4A574] hover:scale-110 active:scale-95"
          aria-label="الشهر السابق"
        >
          <ChevronRight size={18} strokeWidth={1.8} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {ARABIC_DAYS_SHORT.map((day) => (
          <div key={day} className="flex items-center justify-center text-[11px] font-semibold text-[#B0B0C0] py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div key={monthKey} className="grid grid-cols-7 gap-1 animate-calendar-month-in">
        {calendarGrid.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} className="h-9" />;
          const todayHighlight = isToday(day);
          const isSelected = selectedDate === day;
          const dayEvents = eventsMap.get(day) || [];
          return (
            <button
              key={day}
              onClick={(e) => handleDateClick(day, e)}
              className={`relative flex flex-col items-center justify-center h-9 rounded-lg transition-all duration-200 cursor-pointer ${todayHighlight ? 'bg-[#D4A574]/15 text-[#D4A574] animate-calendar-today-glow' : isSelected ? 'bg-[#D4A574]/15 text-[#D4A574]' : 'text-slate-300 hover:bg-white/[0.08] hover:text-white hover:scale-105'} active:scale-95`}
              aria-label={`${day} ${ARABIC_MONTHS[currentMonth]}`}
            >
              <span className={`text-[13px] font-medium leading-none ${todayHighlight ? 'font-bold' : ''}`}>{day}</span>
              {dayEvents.length > 0 && (
                <div className="flex items-center gap-[3px] mt-[2px]">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <span key={i} className="h-[4px] w-[4px] rounded-full" style={{ backgroundColor: ev.color }} />
                  ))}
                </div>
              )}
              {todayHighlight && <span className="absolute inset-0 rounded-lg border-2 border-[#D4A574]/40 pointer-events-none" />}
            </button>
          );
        })}
      </div>

      {/* Legend + Add Event */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#A0A0B8]">
          {Array.from(new Map(events.map((ev) => [ev.color, ev.color])).keys()).slice(0, 4).map((color) => (
            <div key={color} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            </div>
          ))}
          <span>{events.length} حدث</span>
        </div>
        {selectedDate && (
          <button onClick={() => setShowEventForm(!showEventForm)} className="flex items-center gap-1 text-[10px] font-medium text-[#D4A574] hover:text-[#E8C9A8] transition-colors">
            <Plus className="h-3 w-3" />
            إضافة
          </button>
        )}
      </div>

      {/* Event Creation Form */}
      {showEventForm && selectedDate && (
        <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">إضافة حدث - {selectedDate} {ARABIC_MONTHS[currentMonth]}</span>
            <button onClick={() => setShowEventForm(false)} className="text-slate-500 hover:text-slate-300">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            placeholder="عنوان الحدث..."
            className="w-full h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:outline-none mb-2"
          />
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {EVENT_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setNewEventCategory(cat.value)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all"
                style={{
                  backgroundColor: newEventCategory === cat.value ? `${cat.color}15` : 'transparent',
                  border: `1px solid ${newEventCategory === cat.value ? `${cat.color}30` : 'rgba(255,255,255,0.04)'}`,
                  color: newEventCategory === cat.value ? cat.color : '#8888A0',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleAddEvent}
            disabled={!newEventTitle.trim()}
            className="w-full rounded-lg py-1.5 text-xs font-semibold bg-[#D4A574] text-[#121218] hover:bg-[#B8895A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            إضافة الحدث
          </button>
        </div>
      )}

      {/* Upcoming Events List */}
      {upcomingEvents.length > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[11px] font-semibold text-[#B0B0C0] mb-2 block">الأحداث القادمة</span>
          <div className="flex flex-col gap-1.5">
            {upcomingEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                <span className="text-slate-300 truncate">{ev.title}</span>
                <span className="text-[10px] text-[#8888A0] tabular-nums mr-auto">{ev.date}/{currentMonth + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Tooltip */}
      {tooltipPos && eventsMap.has(tooltipPos.day) && (
        <div
          className="absolute z-50 animate-scale-in"
          style={{ top: tooltipPos.y - 8, left: '50%', transform: 'translateX(-50%) translateY(-100%)' }}
        >
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#22222E] border-b border-l border-white/[0.06]" />
          <div
            className="rounded-lg px-4 py-3 min-w-[200px] shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: '#22222E', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Calendar className="h-3.5 w-3.5 text-[#D4A574]" />
              <span className="text-xs font-bold text-white">{tooltipPos.day} {ARABIC_MONTHS[currentMonth]}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {eventsMap.get(tooltipPos.day)!.map((ev, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-[6px] w-[6px] rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                  <span className="text-[12px] text-slate-300 leading-snug">{ev.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Go to today */}
      {!isCurrentMonth && (
        <button
          onClick={() => {
            setCurrentMonth(today.getMonth());
            setCurrentYear(today.getFullYear());
            setSelectedDate(null);
            setTooltipPos(null);
            setMonthKey((k) => k + 1);
          }}
          className="mt-3 w-full rounded-lg py-2 text-[12px] font-medium text-[#D4A574] bg-[#D4A574]/10 border border-[#D4A574]/20 transition-all duration-300 hover:bg-[#D4A574]/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          العودة إلى اليوم
        </button>
      )}
    </div>
  );
}
