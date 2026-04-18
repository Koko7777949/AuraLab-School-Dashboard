'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import {
  Search,
  FileDown,
  Download,
  Upload,
  Globe,
  Settings,
  ChevronDown,
  Users,
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
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

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'AR' ? 'EN' : 'AR'));
  }, []);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && searchQuery.trim()) {
        setActiveSection('students');
        setShowSuggestions(false);
        // Blur the input so it doesn't capture focus back
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
    <header
      dir="rtl"
      className={`
        fixed top-0 inset-x-0 z-30
        flex h-16 items-center justify-between gap-4 px-6
        border-b border-[#2A2A38]/60
        bg-[#121218]/70 backdrop-blur-xl
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
            focus:border-[#D4A574]/50 focus:ring-2 focus:ring-[#D4A574]/20
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
      {/* Center — App name with amber gradient */}
      {/* ----------------------------------------------------------------- */}
      <div className="hidden items-center justify-center sm:flex">
        <h1 className="text-xl font-bold tracking-tight select-none">
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
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Left side (RTL end) — Action buttons */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PDF Export */}
        <HeaderButton icon={FileDown} label="تصدير PDF" />

        {/* Export */}
        <div className="hidden sm:block">
          <HeaderButton icon={Download} label="تصدير" />
        </div>

        {/* Import */}
        <div className="hidden sm:block">
          <HeaderButton icon={Upload} label="استيراد" />
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

        {/* Settings */}
        <HeaderButton icon={Settings} label="الإعدادات" />

        {/* Divider before avatar */}
        <div className="mx-1 hidden h-5 w-px bg-[#2A2A38] sm:block" />

        {/* User avatar & name */}
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
            أ
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
      </div>
    </header>
  );
}
