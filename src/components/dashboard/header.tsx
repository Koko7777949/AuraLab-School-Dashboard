'use client';

import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  FileDown,
  Download,
  Upload,
  Globe,
  Settings,
  ChevronDown,
  Users,
  Bell,
  User,
  LogOut,
  Clock,
  Keyboard,
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/lib/store';

// ---------------------------------------------------------------------------
// Reusable action button
// ---------------------------------------------------------------------------
function HeaderButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
            border border-[#2A2A38] bg-[#1A1A24]/80 text-[#C4C4D4]
            transition-all duration-200
            hover:scale-[1.02] hover:border-[#D4A574]/40 hover:text-[#D4A574]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50
            active:scale-[0.98]"
        >
          <Icon size={18} strokeWidth={1.8} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        sideOffset={8}
        className="rounded-lg border border-[#2A2A38] bg-[#1A1A24] px-3 py-1.5 text-xs text-[#C4C4D4] shadow-lg"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Search suggestions (visual)
// ---------------------------------------------------------------------------
const SEARCH_SUGGESTIONS = [
  { text: 'بحث في الطلاب...', section: 'students' as const, icon: Users },
  { text: 'عرض الحصص', section: 'sessions' as const, icon: Settings },
  { text: 'الامتحانات', section: 'exams' as const, icon: Settings },
];

// ---------------------------------------------------------------------------
// Header Component
// ---------------------------------------------------------------------------
export default function Header() {
  const { searchQuery, setSearchQuery, setActiveSection, sidebarOpen } = useAppStore();
  const [lang, setLang] = useState<'AR' | 'EN'>('AR');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<typeof SEARCH_SUGGESTIONS>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Live clock
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeParts = useMemo(() => {
    if (!currentTime) return { time: '', seconds: '' };
    const parts = currentTime.split(':');
    return { time: `${parts[0]}:${parts[1]}`, seconds: parts[2] || '' };
  }, [currentTime]);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'AR' ? 'EN' : 'AR'));
  }, []);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && searchQuery.trim()) {
        setActiveSection('students');
        setShowSuggestions(false);
        (e.target as HTMLInputElement).blur();
      }
    },
    [searchQuery, setActiveSection],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      if (value.trim()) {
        setFilteredSuggestions(
          SEARCH_SUGGESTIONS.filter((s) =>
            s.text.includes(value.trim()),
          ),
        );
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    },
    [setSearchQuery],
  );

  const handleSuggestionClick = useCallback(
    (section: typeof SEARCH_SUGGESTIONS[number]['section']) => {
      setActiveSection(section);
      setShowSuggestions(false);
    },
    [setActiveSection],
  );

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header
        dir="rtl"
        className={`
          fixed top-0 inset-x-0 z-30
          flex h-16 items-center justify-between gap-4 px-6
          border-b border-[#2A2A38]/60
          bg-[#121218]/60 backdrop-blur-2xl
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'mr-60' : 'mr-[72px]'}
        `}
      >
        {/* ----------------------------------------------------------------- */}
        {/* Right side (RTL start) — Search bar */}
        {/* ----------------------------------------------------------------- */}
        <div className="relative w-full max-w-xs min-w-0 sm:max-w-sm" ref={searchRef}>
          <Search
            size={18}
            strokeWidth={1.8}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8B8B9E]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => {
              if (searchQuery.trim()) setShowSuggestions(true);
            }}
            placeholder="بحث..."
            className="
              h-9 w-full rounded-lg border border-[#2A2A38] bg-[#1A1A24]/80
              pr-10 pl-4 text-sm text-[#E4E4EC] placeholder-[#8B8B9E]
              outline-none backdrop-blur-sm
              transition-all duration-200
              focus:border-[#D4A574]/50
              focus:shadow-[0_0_12px_2px_rgba(212,165,116,0.15),0_0_4px_0px_rgba(212,165,116,0.1)]
              focus:ring-0
            "
          />

          {/* Search suggestions dropdown */}
          {showSuggestions && (
            <div
              className="absolute top-full right-0 left-0 mt-1.5 z-50 rounded-lg border border-[#2A2A38] bg-[#1A1A24] py-1.5 shadow-xl animate-fade-in-up overflow-hidden"
              style={{ animationDuration: '0.2s' }}
            >
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((suggestion, i) => {
                  const Icon = suggestion.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion.section)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#C4C4D4] transition-colors duration-150 hover:bg-[#22222E] hover:text-[#D4A574]"
                    >
                      <Icon size={14} strokeWidth={1.5} className="text-[#8B8B9E]" />
                      <span>{suggestion.text}</span>
                      <span className="mr-auto text-[11px] text-[#8B8B9E]/60">
                        Enter ↵
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-[#8B8B9E]">
                  <Search size={14} strokeWidth={1.5} />
                  <span>اضغط Enter للبحث في الطلاب</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Center — Live Clock + App name */}
        {/* ----------------------------------------------------------------- */}
        <div className="hidden sm:flex flex-col items-center justify-center gap-0.5 min-w-0">
          {/* Live clock */}
          <div className="flex items-center gap-2 select-none">
            <Clock size={13} strokeWidth={1.8} className="text-[#D4A574]/60" />
            <span className="text-sm font-semibold tabular-nums tracking-wider text-[#C4C4D4]" dir="ltr">
              {timeParts.time}
            </span>
            <span className="text-xs font-medium tabular-nums text-[#8B8B9E] min-w-[18px] text-center" dir="ltr">
              {timeParts.seconds}
            </span>
          </div>
          {/* App name */}
          <h1 className="text-sm font-bold tracking-tight select-none">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #D4A574 0%, #E8C9A0 50%, #D4A574 100%)',
              }}
            >
              AuraLab
            </span>
          </h1>
          {/* Date */}
          <span className="text-[10px] text-[#5A5A6E] truncate max-w-[180px]">
            {currentDate}
          </span>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Left side (RTL end) — Action buttons */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PDF Export → analytics */}
          <HeaderButton
            icon={FileDown}
            label="تصدير PDF"
            onClick={() => setActiveSection('analytics')}
          />

          {/* Export → analytics */}
          <div className="hidden sm:block">
            <HeaderButton
              icon={Download}
              label="تصدير"
              onClick={() => setActiveSection('analytics')}
            />
          </div>

          {/* Import → students */}
          <div className="hidden sm:block">
            <HeaderButton
              icon={Upload}
              label="استيراد"
              onClick={() => setActiveSection('students')}
            />
          </div>

          {/* Divider */}
          <div className="mx-1 hidden h-5 w-px bg-[#2A2A38] sm:block" />

          {/* Language toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleLang}
                aria-label="تغيير اللغة"
                className="flex h-9 items-center gap-1.5 rounded-lg
                  border border-[#2A2A38] bg-[#1A1A24]/80 px-2.5
                  text-xs font-semibold text-[#C4C4D4]
                  transition-all duration-200
                  hover:scale-[1.02] hover:border-[#D4A574]/40 hover:text-[#D4A574]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50
                  active:scale-[0.98]"
              >
                <Globe size={16} strokeWidth={1.8} />
                <span className="hidden sm:inline">{lang}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={8}
              className="rounded-lg border border-[#2A2A38] bg-[#1A1A24] px-3 py-1.5 text-xs text-[#C4C4D4] shadow-lg"
            >
              {lang === 'AR' ? 'English' : 'العربية'}
            </TooltipContent>
          </Tooltip>

          {/* Settings → settings */}
          <HeaderButton
            icon={Settings}
            label="الإعدادات"
            onClick={() => setActiveSection('settings')}
          />

          {/* Divider */}
          <div className="mx-1 hidden h-5 w-px bg-[#2A2A38] sm:block" />

          {/* Notification bell → notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveSection('notifications')}
                aria-label="الإشعارات"
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
                  border border-[#2A2A38] bg-[#1A1A24]/80 text-[#C4C4D4]
                  transition-all duration-200
                  hover:scale-[1.02] hover:border-[#D4A574]/40 hover:text-[#D4A574]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50
                  active:scale-[0.98]"
              >
                <Bell size={18} strokeWidth={1.8} />
                {/* Red dot indicator */}
                <span
                  className="absolute top-1.5 left-1.5 h-2 w-2 rounded-full border border-[#121218]"
                  style={{ background: '#EF4444' }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={8}
              className="rounded-lg border border-[#2A2A38] bg-[#1A1A24] px-3 py-1.5 text-xs text-[#C4C4D4] shadow-lg"
            >
              الإشعارات
            </TooltipContent>
          </Tooltip>

          {/* ----------------------------------------------------------------- */}
          {/* User Profile Dropdown */}
          {/* ----------------------------------------------------------------- */}
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <button
                aria-label="قائمة المستخدم"
                className="flex items-center gap-2 rounded-lg
                  border border-[#2A2A38] bg-[#1A1A24]/80 py-1.5 pl-2 pr-3
                  transition-all duration-200
                  hover:scale-[1.02] hover:border-[#D4A574]/40
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50
                  active:scale-[0.98]"
              >
                {/* Avatar circle */}
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#1A1A24]"
                  style={{
                    background:
                      'linear-gradient(135deg, #D4A574 0%, #E8C9A0 60%, #D4A574 100%)',
                  }}
                >
                  أم
                </span>

                {/* Name (hidden on small screens) */}
                <span className="hidden text-sm font-medium text-[#E4E4EC] sm:block">
                  أحمد محمد
                </span>

                {/* Dropdown chevron */}
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className="hidden text-[#8B8B9E] sm:block"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={8}
              align="start"
              className="w-56 rounded-xl border-[#2A2A38] bg-[#1A1A24] p-1.5 shadow-2xl"
            >
              {/* User info header */}
              <DropdownMenuLabel className="px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#1A1A24]"
                    style={{
                      background:
                        'linear-gradient(135deg, #D4A574 0%, #E8C9A0 60%, #D4A574 100%)',
                    }}
                  >
                    أم
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#E4E4EC]">
                      أحمد محمد
                    </span>
                    <span className="text-xs text-[#8B8B9E]">مدير النظام</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-[#2A2A38]" />

              {/* Profile — disabled / coming soon */}
              <DropdownMenuItem
                disabled
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#C4C4D4] cursor-default data-[disabled]:opacity-40"
              >
                <User size={16} strokeWidth={1.8} className="text-[#8B8B9E]" />
                <span>الملف الشخصي</span>
              </DropdownMenuItem>

              {/* Settings */}
              <DropdownMenuItem
                onSelect={() => setActiveSection('settings')}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#C4C4D4] transition-colors duration-150 hover:bg-[#22222E] hover:text-[#D4A574] focus:bg-[#22222E] focus:text-[#D4A574] cursor-pointer"
              >
                <Settings size={16} strokeWidth={1.8} className="text-[#8B8B9E]" />
                <span>الإعدادات</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-[#2A2A38]" />

              {/* Logout — disabled / coming soon */}
              <DropdownMenuItem
                disabled
                variant="destructive"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-default data-[disabled]:opacity-40"
              >
                <LogOut size={16} strokeWidth={1.8} />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ----------------------------------------------------------------- */}
      {/* Bottom gradient line (amber-to-transparent) */}
      {/* ----------------------------------------------------------------- */}
      <div
        dir="rtl"
        className={`
          fixed top-16 inset-x-0 z-30 h-px pointer-events-none
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'mr-60' : 'mr-[72px]'}
        `}
        style={{
          background: 'linear-gradient(to left, transparent, #D4A574 30%, #D4A574 70%, transparent)',
          opacity: 0.3,
        }}
      />
    </>
  );
}
