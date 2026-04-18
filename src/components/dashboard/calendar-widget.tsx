'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarEvent {
  date: number; // day of month
  title: string;
  color: string; // e.g. '#D4A574', '#10b981'
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const ARABIC_DAYS = [
  'السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة',
];

const ARABIC_DAYS_SHORT = [
  'س', 'أ', 'اث', 'ث', 'أر', 'خ', 'ج',
];

// Mock events for current month
function getMockEvents(year: number, month: number): CalendarEvent[] {
  // Generate events relative to the current month
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
  const calendarRef = useRef<HTMLDivElement>(null);

  const events = useMemo(
    () => getMockEvents(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  // Build event lookup map
  const eventsMap = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    events.forEach((ev) => {
      const existing = map.get(ev.date) || [];
      existing.push(ev);
      map.set(ev.date, existing);
    });
    return map;
  }, [events]);

  // Compute calendar grid (weeks starting Saturday)
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    // getDay(): 0=Sun, 6=Sat. Convert to Saturday-first: (day + 1) % 7
    const startDow = (firstDay.getDay() + 1) % 7; // 0=Sat, 1=Sun, ...6=Fri
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const cells: (number | null)[] = [];

    // Leading empty cells
    for (let i = 0; i < startDow; i++) {
      cells.push(null);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }

    // Trailing empty cells to fill the last row
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push(null);
      }
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

  // Close tooltip on outside click
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

  const isCurrentMonth =
    currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <div
      ref={calendarRef}
      dir="rtl"
      className="relative rounded-xl bg-[#1A1A24] border border-white/[0.06] p-4 w-full max-w-[320px] mx-auto select-none"
    >
      {/* ── Header: Month/Year + Navigation ── */}
      <div className="flex items-center justify-between mb-4">
        {/* Next month button (appears on the left in RTL) */}
        <button
          onClick={navigateNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400
            transition-all duration-200 hover:bg-white/[0.06] hover:text-[#D4A574]
            active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50"
          aria-label="الشهر التالي"
        >
          <ChevronLeft size={18} strokeWidth={1.8} />
        </button>

        {/* Month and Year */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#D4A574]" />
          <span className="text-sm font-bold text-white">
            {ARABIC_MONTHS[currentMonth]} {currentYear}
          </span>
        </div>

        {/* Previous month button (appears on the right in RTL) */}
        <button
          onClick={navigatePrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400
            transition-all duration-200 hover:bg-white/[0.06] hover:text-[#D4A574]
            active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50"
          aria-label="الشهر السابق"
        >
          <ChevronRight size={18} strokeWidth={1.8} />
        </button>
      </div>

      {/* ── Day of week headers ── */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {ARABIC_DAYS_SHORT.map((day) => (
          <div
            key={day}
            className="flex items-center justify-center text-[11px] font-semibold text-slate-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* ── Calendar Grid ── */}
      <div className="grid grid-cols-7 gap-1">
        {calendarGrid.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-9" />;
          }

          const todayHighlight = isToday(day);
          const isSelected = selectedDate === day;
          const dayEvents = eventsMap.get(day) || [];

          return (
            <button
              key={day}
              onClick={(e) => handleDateClick(day, e)}
              className={`
                relative flex flex-col items-center justify-center h-9 rounded-lg
                transition-all duration-200 cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50
                ${todayHighlight || isSelected
                  ? 'bg-[#D4A574]/15 text-[#D4A574]'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }
              `}
              aria-label={`${day} ${ARABIC_MONTHS[currentMonth]}`}
            >
              {/* Day number */}
              <span className={`text-[13px] font-medium leading-none ${todayHighlight ? 'font-bold' : ''}`}>
                {day}
              </span>

              {/* Event dots */}
              {dayEvents.length > 0 && (
                <div className="flex items-center gap-[3px] mt-[2px]">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <span
                      key={i}
                      className="h-[4px] w-[4px] rounded-full"
                      style={{ backgroundColor: ev.color }}
                    />
                  ))}
                </div>
              )}

              {/* Today indicator ring */}
              {todayHighlight && (
                <span className="absolute inset-0 rounded-lg border border-[#D4A574]/40 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Legend ── */}
      {events.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
          {Array.from(new Map(events.map((ev) => [ev.color, ev.color])).keys()).map((color) => (
            <div key={color} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            </div>
          ))}
          <span>{events.length} حدث هذا الشهر</span>
        </div>
      )}

      {/* ── Event Tooltip/Popover ── */}
      {tooltipPos && eventsMap.has(tooltipPos.day) && (
        <div
          className="absolute z-50 animate-scale-in"
          style={{
            top: tooltipPos.y - 8,
            left: '50%',
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          {/* Arrow */}
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#22222E] border-b border-l border-white/[0.06]" />

          {/* Tooltip content */}
          <div
            className="rounded-lg px-4 py-3 min-w-[200px] shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
            style={{
              backgroundColor: '#22222E',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Date header */}
            <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Calendar className="h-3.5 w-3.5 text-[#D4A574]" />
              <span className="text-xs font-bold text-white">
                {tooltipPos.day} {ARABIC_MONTHS[currentMonth]}
              </span>
            </div>

            {/* Event list */}
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

      {/* ── Go to today button ── */}
      {!isCurrentMonth && (
        <button
          onClick={() => {
            setCurrentMonth(today.getMonth());
            setCurrentYear(today.getFullYear());
            setSelectedDate(null);
            setTooltipPos(null);
          }}
          className="mt-3 w-full rounded-lg py-2 text-[12px] font-medium text-[#D4A574]
            bg-[#D4A574]/10 border border-[#D4A574]/20
            transition-all duration-200 hover:bg-[#D4A574]/20 active:scale-[0.98]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50"
        >
          العودة إلى اليوم
        </button>
      )}
    </div>
  );
}
