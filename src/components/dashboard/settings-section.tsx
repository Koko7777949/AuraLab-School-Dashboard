'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Bell,
  Volume2,
  Mail,
  Smartphone,
  BarChart3,
  Activity,
  Target,
  Clock,
  Globe,
  Shield,
  RotateCcw,
  User,
  Moon,
  Monitor,
  School,
  CalendarDays,
  Check,
  Save,
  Palette,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ToggleSetting {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultOn: boolean;
}

/* ------------------------------------------------------------------ */
/*  Setting Card wrapper                                               */
/* ------------------------------------------------------------------ */
function SettingCard({
  title,
  icon,
  badge,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{
        backgroundColor: '#1A1A24',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(212,165,116,0.12)';
        e.currentTarget.style.borderColor = 'rgba(212,165,116,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
      }}
    >
      {/* Card Header */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center justify-center h-9 w-9 rounded-xl bg-[#D4A574]/10 text-[#D4A574]">
            {icon}
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
          </div>
        </div>
        {badge && (
          <Badge className="bg-[#D4A574]/10 text-[#D4A574] border-[#D4A574]/20 text-[11px] px-2 py-0.5 rounded-full">
            {badge}
          </Badge>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle item component                                              */
/* ------------------------------------------------------------------ */
function ToggleRow({
  setting,
  checked,
  onCheckedChange,
}: {
  setting: ToggleSetting;
  checked: boolean;
  onCheckedChange: (key: string, value: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl p-4 transition-all duration-200"
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex shrink-0 items-center justify-center h-9 w-9 rounded-lg bg-[#D4A574]/10 text-[#D4A574]">
          {setting.icon}
        </div>
        <div className="min-w-0">
          <Label
            htmlFor={`toggle-${setting.key}`}
            className="cursor-pointer text-sm font-medium text-slate-200 block"
          >
            {setting.label}
          </Label>
          <p className="text-xs text-slate-500 mt-0.5">{setting.description}</p>
        </div>
      </div>
      <Switch
        id={`toggle-${setting.key}`}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(setting.key, v)}
        className="data-[state=checked]:bg-[#D4A574] data-[state=unchecked]:bg-slate-600 shrink-0"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Read-only display field                                            */
/* ------------------------------------------------------------------ */
function DisplayField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-xl p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="flex shrink-0 items-center justify-center h-9 w-9 rounded-lg bg-[#D4A574]/10 text-[#D4A574]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-200 truncate">{value}</p>
      </div>
      <Badge className="bg-white/[0.04] text-slate-500 border-white/[0.06] text-[10px] px-2 py-0.5 rounded-full shrink-0">
        للقراءة فقط
      </Badge>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Accent Color Swatch                                                */
/* ------------------------------------------------------------------ */
const ACCENT_COLORS = [
  { value: '#D4A574', label: 'عنبري' },
  { value: '#34D399', label: 'زمردي' },
  { value: '#F472B6', label: 'وردي' },
  { value: '#38BDF8', label: 'سماوي' },
  { value: '#A78BFA', label: 'بنفسجي' },
  { value: '#FB923C', label: 'برتقالي' },
] as const;

/* ------------------------------------------------------------------ */
/*  Theme Customizer — Live Preview Card                               */
/* ------------------------------------------------------------------ */
function LivePreviewCard({
  accentColor,
  borderRadius,
  backgroundStyle,
  uiDensity,
}: {
  accentColor: string;
  borderRadius: number;
  backgroundStyle: 'solid' | 'gradient' | 'dots';
  uiDensity: 'compact' | 'default' | 'comfortable';
}) {
  const densityPadding = uiDensity === 'compact' ? 'p-2' : uiDensity === 'comfortable' ? 'p-4' : 'p-3';
  const densityGap = uiDensity === 'compact' ? 'gap-1' : uiDensity === 'comfortable' ? 'gap-3' : 'gap-2';

  const bgStyle: React.CSSProperties =
    backgroundStyle === 'dots'
      ? {
          backgroundColor: '#121218',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }
      : backgroundStyle === 'gradient'
        ? {
            background: 'linear-gradient(135deg, #121218 0%, #1A1A2E 50%, #1E1E30 100%)',
          }
        : {
            backgroundColor: '#121218',
          };

  return (
    <div
      className={cn('w-full min-h-[140px] transition-all duration-300', densityPadding, densityGap)}
      style={{
        ...bgStyle,
        borderRadius: `${borderRadius}px`,
        border: `1px solid ${accentColor}20`,
      }}
    >
      {/* Preview header */}
      <div
        className={cn('flex items-center justify-between', uiDensity === 'compact' ? 'mb-1' : uiDensity === 'comfortable' ? 'mb-3' : 'mb-2')}
      >
        <div className={cn('flex items-center', densityGap)}>
          <div
            className="rounded-md"
            style={{
              width: uiDensity === 'compact' ? 18 : uiDensity === 'comfortable' ? 26 : 22,
              height: uiDensity === 'compact' ? 18 : uiDensity === 'comfortable' ? 26 : 22,
              backgroundColor: `${accentColor}18`,
            }}
          />
          <div
            className="rounded-sm"
            style={{
              width: uiDensity === 'compact' ? 40 : 55,
              height: uiDensity === 'compact' ? 6 : 8,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          />
        </div>
        <div className="flex gap-1.5">
          <div
            className="rounded-full"
            style={{ width: 6, height: 6, backgroundColor: `${accentColor}40` }}
          />
          <div
            className="rounded-full"
            style={{ width: 6, height: 6, backgroundColor: 'rgba(255,255,255,0.08)' }}
          />
          <div
            className="rounded-full"
            style={{ width: 6, height: 6, backgroundColor: 'rgba(255,255,255,0.08)' }}
          />
        </div>
      </div>

      {/* Preview content cards */}
      <div className={cn('grid grid-cols-2', densityGap)}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="transition-all duration-300"
            style={{
              backgroundColor: '#1A1A24',
              borderRadius: `${Math.max(borderRadius - 4, 2)}px`,
              border: `1px solid rgba(255,255,255,0.04)`,
              padding: uiDensity === 'compact' ? '6px' : uiDensity === 'comfortable' ? '12px' : '8px',
            }}
          >
            <div
              className="rounded-sm mb-1"
              style={{
                width: `${50 + i * 10}%`,
                height: uiDensity === 'compact' ? 4 : 6,
                backgroundColor: `${accentColor}30`,
              }}
            />
            <div
              className="rounded-sm"
              style={{
                width: `${30 + i * 5}%`,
                height: uiDensity === 'compact' ? 3 : 4,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Preview button */}
      <div className={cn('flex items-center', densityGap, uiDensity === 'compact' ? 'mt-1' : uiDensity === 'comfortable' ? 'mt-3' : 'mt-2')}>
        <div
          className="rounded-md"
          style={{
            backgroundColor: accentColor,
            color: '#121218',
            padding: uiDensity === 'compact' ? '3px 10px' : uiDensity === 'comfortable' ? '6px 18px' : '4px 14px',
            fontSize: uiDensity === 'compact' ? '9px' : uiDensity === 'comfortable' ? '12px' : '10px',
            fontWeight: 600,
            width: 'fit-content',
            borderRadius: `${Math.max(borderRadius - 4, 2)}px`,
          }}
        >
          زر
        </div>
        <div
          className="rounded-md"
          style={{
            border: `1px solid ${accentColor}40`,
            color: accentColor,
            padding: uiDensity === 'compact' ? '3px 10px' : uiDensity === 'comfortable' ? '6px 18px' : '4px 14px',
            fontSize: uiDensity === 'compact' ? '9px' : uiDensity === 'comfortable' ? '12px' : '10px',
            fontWeight: 600,
            width: 'fit-content',
            borderRadius: `${Math.max(borderRadius - 4, 2)}px`,
          }}
        >
          زر ثانٍ
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Theme Customizer Card                                              */
/* ------------------------------------------------------------------ */
function ThemeCustomizerCard() {
  const {
    accentColor,
    setAccentColor,
    uiDensity,
    setUiDensity,
    borderRadius,
    setBorderRadius,
    backgroundStyle,
    setBackgroundStyle,
  } = useAppStore();

  const [localAccent, setLocalAccent] = useState(accentColor);
  const [localDensity, setLocalDensity] = useState(uiDensity);
  const [localRadius, setLocalRadius] = useState(borderRadius);
  const [localBgStyle, setLocalBgStyle] = useState(backgroundStyle);

  const handleSaveTheme = () => {
    setAccentColor(localAccent);
    setUiDensity(localDensity);
    setBorderRadius(localRadius);
    setBackgroundStyle(localBgStyle);
    toast.success('تم حفظ إعدادات المظهر بنجاح');
  };

  const handleResetTheme = () => {
    setLocalAccent('#D4A574');
    setLocalDensity('default');
    setLocalRadius(8);
    setLocalBgStyle('dots');
    setAccentColor('#D4A574');
    setUiDensity('default');
    setBorderRadius(8);
    setBackgroundStyle('dots');
    toast.success('تم إعادة تعيين إعدادات المظهر');
  };

  const hasChanges =
    localAccent !== accentColor ||
    localDensity !== uiDensity ||
    localRadius !== borderRadius ||
    localBgStyle !== backgroundStyle;

  const densityOptions: { value: 'compact' | 'default' | 'comfortable'; label: string; desc: string }[] = [
    { value: 'compact', label: 'مضغوط', desc: 'مسافات صغيرة' },
    { value: 'default', label: 'افتراضي', desc: 'مسافات متوسطة' },
    { value: 'comfortable', label: 'مريح', desc: 'مسافات واسعة' },
  ];

  const bgStyleOptions: { value: 'solid' | 'gradient' | 'dots'; label: string }[] = [
    { value: 'solid', label: 'صلب' },
    { value: 'gradient', label: 'متدرج' },
    { value: 'dots', label: 'نقاط' },
  ];

  return (
    <SettingCard
      title="تخصيص المظهر"
      icon={<Palette className="h-5 w-5" />}
      badge="مخصص"
    >
      <div className="flex flex-col gap-5">
        {/* ── Accent Color Picker ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-[#D4A574]" />
            <span className="text-sm font-semibold text-slate-300">اللون المميز</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-wrap gap-3">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setLocalAccent(c.value)}
                  className="group relative flex flex-col items-center gap-1.5 transition-transform duration-200 hover:scale-110 active:scale-95"
                  title={c.label}
                >
                  <div
                    className={cn(
                      'h-9 w-9 rounded-full transition-all duration-200',
                      localAccent === c.value && 'ring-2 ring-offset-2 ring-offset-[#1A1A24]',
                    )}
                    style={{
                      backgroundColor: c.value,
                      ringColor: localAccent === c.value ? c.value : 'transparent',
                      boxShadow: localAccent === c.value ? `0 0 12px ${c.value}50` : 'none',
                    }}
                  >
                    {localAccent === c.value && (
                      <CheckCircle2
                        className="h-5 w-5 text-white mx-auto mt-[6px] drop-shadow-md"
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
            {/* Live Preview */}
            <div className="flex-1 min-w-[200px] max-w-[300px] mx-auto">
              <LivePreviewCard
                accentColor={localAccent}
                borderRadius={localRadius}
                backgroundStyle={localBgStyle}
                uiDensity={localDensity}
              />
            </div>
          </div>
        </div>

        {/* ── UI Density Selector ── */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-[#D4A574]" />
            <span className="text-sm font-semibold text-slate-300">كثافة الواجهة</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {densityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLocalDensity(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl p-3 transition-all duration-200',
                  localDensity === opt.value
                    ? 'border'
                    : 'border border-transparent hover:bg-white/[0.03]',
                )}
                style={
                  localDensity === opt.value
                    ? {
                        backgroundColor: `${localAccent}10`,
                        borderColor: `${localAccent}30`,
                      }
                    : undefined
                }
              >
                <div
                  className={cn(
                    'flex items-center justify-center h-5 w-5 rounded-full border-2 transition-all duration-200',
                    localDensity === opt.value && 'border-transparent',
                  )}
                  style={{
                    borderColor: localDensity === opt.value ? 'transparent' : 'rgba(255,255,255,0.15)',
                    backgroundColor: localDensity === opt.value ? localAccent : 'transparent',
                  }}
                >
                  {localDensity === opt.value && (
                    <Check className="h-3 w-3 text-[#121218]" strokeWidth={3} />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium transition-colors',
                    localDensity === opt.value ? 'text-slate-200' : 'text-slate-500',
                  )}
                >
                  {opt.label}
                </span>
                <span className="text-[10px] text-slate-600">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Border Radius Slider ── */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="h-5 w-5 transition-all duration-300"
                style={{
                  borderRadius: `${localRadius}px`,
                  border: `2px solid ${localAccent}`,
                  backgroundColor: `${localAccent}20`,
                }}
              />
              <span className="text-sm font-semibold text-slate-300">حواف مستديرة</span>
            </div>
            <Badge
              className="text-[11px] px-2.5 py-0.5 rounded-full font-mono"
              style={{
                backgroundColor: `${localAccent}15`,
                color: localAccent,
                border: `1px solid ${localAccent}25`,
              }}
            >
              {localRadius}px
            </Badge>
          </div>
          <Slider
            value={[localRadius]}
            onValueChange={(v) => setLocalRadius(v[0])}
            min={0}
            max={24}
            step={1}
            className="w-full [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-range]]:bg-[var(--preview-accent,#D4A574)] [&_[data-slot=slider-thumb]]:bg-[var(--preview-accent,#D4A574)] [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:h-5 [&_[data-slot=slider-thumb]]:w-5 [&_[data-slot=slider-thumb]]:shadow-md"
            style={{ '--preview-accent': localAccent } as React.CSSProperties}
          />
          <div className="flex justify-between mt-2 text-[10px] text-slate-600 px-0.5">
            <span>0px — مربع</span>
            <span>12px — متوسط</span>
            <span>24px — دائري</span>
          </div>
        </div>

        {/* ── Background Style Toggle ── */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="h-4 w-4 text-[#D4A574]" />
            <span className="text-sm font-semibold text-slate-300">نمط الخلفية</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {bgStyleOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLocalBgStyle(opt.value)}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-200 overflow-hidden',
                  localBgStyle === opt.value ? 'border' : 'border border-transparent hover:bg-white/[0.03]',
                )}
                style={
                  localBgStyle === opt.value
                    ? {
                        backgroundColor: `${localAccent}10`,
                        borderColor: `${localAccent}30`,
                      }
                    : undefined
                }
              >
                {/* Mini background preview */}
                <div
                  className="h-10 w-full rounded-md overflow-hidden"
                  style={
                    opt.value === 'dots'
                      ? {
                          backgroundColor: '#121218',
                          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                          backgroundSize: '6px 6px',
                        }
                      : opt.value === 'gradient'
                        ? {
                            background: 'linear-gradient(135deg, #121218 0%, #1A1A2E 50%, #1E1E30 100%)',
                          }
                        : {
                            backgroundColor: '#121218',
                          }
                  }
                />
                <div
                  className={cn(
                    'text-xs font-medium transition-colors',
                    localBgStyle === opt.value ? 'text-slate-200' : 'text-slate-500',
                  )}
                >
                  {opt.label}
                </div>
                {localBgStyle === opt.value && (
                  <div
                    className="absolute top-2 left-2"
                    style={{ color: localAccent }}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            onClick={handleResetTheme}
            variant="outline"
            className="gap-2 text-slate-400 border-white/[0.08] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors rounded-lg text-xs h-8"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            إعادة تعيين
          </Button>
          <Button
            onClick={handleSaveTheme}
            disabled={!hasChanges}
            className={cn(
              'gap-2 font-semibold rounded-lg px-5 h-8 text-xs transition-all duration-300',
              hasChanges
                ? 'btn-shine'
                : 'opacity-40 cursor-not-allowed',
            )}
            style={
              hasChanges
                ? { backgroundColor: localAccent, color: '#121218' }
                : { backgroundColor: localAccent, color: '#121218' }
            }
          >
            <Save className="h-3.5 w-3.5" />
            حفظ التخصيص
          </Button>
        </div>
      </div>
    </SettingCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function SettingsSection() {
  /* ── notification toggles ── */
  const notificationDefaults: ToggleSetting[] = [
    { key: 'system', label: 'إشعارات النظام', description: 'تحديثات النظام وصيانة الخوادم', icon: <Bell className="h-4 w-4" />, defaultOn: true },
    { key: 'sound', label: 'إشعارات الصوت', description: 'تنبيهات صوتية عند الإشعارات الجديدة', icon: <Volume2 className="h-4 w-4" />, defaultOn: true },
    { key: 'email', label: 'إشعارات البريد الإلكتروني', description: 'إرسال ملخص يومي للبريد', icon: <Mail className="h-4 w-4" />, defaultOn: false },
    { key: 'messages', label: 'إشعارات الرسائل', description: 'تنبيهات الرسائل الجديدة والدردشات', icon: <Smartphone className="h-4 w-4" />, defaultOn: true },
  ];

  /* ── appearance toggles ── */
  const appearanceDefaults: ToggleSetting[] = [
    { key: 'darkMode', label: 'الوضع الداكن', description: 'تفعيل المظهر الداكن (موصى به)', icon: <Moon className="h-4 w-4" />, defaultOn: true },
    { key: 'sidebarDefault', label: 'الشريط الجانبي مفتوح', description: 'عرض الشريط الجانبي افتراضياً عند فتح الصفحة', icon: <Monitor className="h-4 w-4" />, defaultOn: true },
  ];

  /* ── analytics toggles ── */
  const analyticsDefaults: ToggleSetting[] = [
    { key: 'analyticsNotif', label: 'إشعارات التحليلات', description: 'تنبيهات التغييرات في التحليلات', icon: <BarChart3 className="h-4 w-4" />, defaultOn: true },
    { key: 'activityTracking', label: 'تتبع الأنشطة', description: 'تتبع نشاط الطلاب والمعلمين', icon: <Activity className="h-4 w-4" />, defaultOn: true },
    { key: 'assessmentTracking', label: 'تتبع التقييمات', description: 'إشعارات نتائج التقييمات والاختبارات', icon: <Target className="h-4 w-4" />, defaultOn: false },
    { key: 'sessionTracking', label: 'تتبع الجلسات', description: 'تتبع إحصائيات الجلسات التعليمية', icon: <Clock className="h-4 w-4" />, defaultOn: true },
  ];

  const allDefaults = [...notificationDefaults, ...appearanceDefaults, ...analyticsDefaults];

  const buildDefaultMap = () =>
    Object.fromEntries(allDefaults.map((s) => [s.key, s.defaultOn]));

  const [toggles, setToggles] = useState<Record<string, boolean>>(buildDefaultMap);
  const [language, setLanguage] = useState('ar');
  const [schoolName, setSchoolName] = useState('AuraLab Academy');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: string, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const resetAll = () => {
    setToggles(buildDefaultMap());
    setLanguage('ar');
    setSchoolName('AuraLab Academy');
    setAcademicYear('2024-2025');
    setSaved(false);
    toast.success('تم إعادة تعيين جميع الإعدادات');
  };

  const handleSave = () => {
    setSaved(true);
    toast.success('تم حفظ إعدادات النظام بنجاح');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <Settings className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
              إعدادات النظام
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              تخصيص إعدادات النظام والملف الشخصي والإشعارات
            </p>
          </div>
        </div>
        <Button
          onClick={resetAll}
          variant="outline"
          className="gap-2 text-slate-300 border-white/[0.08] hover:bg-[#D4A574]/10 hover:text-[#D4A574] hover:border-[#D4A574]/40 transition-colors rounded-lg"
        >
          <RotateCcw className="h-4 w-4" />
          إعادة تعيين
        </Button>
      </div>

      {/* ============================================================ */}
      {/* Section 1 – الملف الشخصي                                     */}
      {/* ============================================================ */}
      <SettingCard
        title="الملف الشخصي"
        icon={<User className="h-5 w-5" />}
        badge="معلومات الحساب"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DisplayField
            icon={<User className="h-4 w-4" />}
            label="الاسم الكامل"
            value="مدير النظام"
          />
          <DisplayField
            icon={<Mail className="h-4 w-4" />}
            label="البريد الإلكتروني"
            value="admin@auralab.edu.sa"
          />
          <DisplayField
            icon={<Smartphone className="h-4 w-4" />}
            label="رقم الهاتف"
            value="+966 5x xxx xxxx"
          />
          <DisplayField
            icon={<Shield className="h-4 w-4" />}
            label="الدور"
            value="مدير النظام (صلاحيات كاملة)"
          />
        </div>
      </SettingCard>

      {/* ============================================================ */}
      {/* Section 2 – المظهر                                           */}
      {/* ============================================================ */}
      <SettingCard
        title="المظهر"
        icon={<Monitor className="h-5 w-5" />}
        badge="تخصيص العرض"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {appearanceDefaults.map((s) => (
            <ToggleRow
              key={s.key}
              setting={s}
              checked={toggles[s.key]}
              onCheckedChange={handleToggle}
            />
          ))}
        </div>
      </SettingCard>

      {/* ============================================================ */}
      {/* Section 3 – تخصيص المظهر (Theme Customizer)                  */}
      {/* ============================================================ */}
      <ThemeCustomizerCard />

      {/* ============================================================ */}
      {/* Section 4 – الإشعارات                                        */}
      {/* ============================================================ */}
      <SettingCard
        title="الإشعارات"
        icon={<Bell className="h-5 w-5" />}
        badge="إدارة التنبيهات"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {notificationDefaults.map((s) => (
            <ToggleRow
              key={s.key}
              setting={s}
              checked={toggles[s.key]}
              onCheckedChange={handleToggle}
            />
          ))}
        </div>

        {/* Analytics subsection */}
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-[#D4A574]" />
            <span className="text-sm font-semibold text-slate-300">تحليلات وإحصائيات</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analyticsDefaults.map((s) => (
              <ToggleRow
                key={s.key}
                setting={s}
                checked={toggles[s.key]}
                onCheckedChange={handleToggle}
              />
            ))}
          </div>
        </div>
      </SettingCard>

      {/* ============================================================ */}
      {/* Section 5 – النظام                                           */}
      {/* ============================================================ */}
      <SettingCard
        title="النظام"
        icon={<Globe className="h-5 w-5" />}
        badge="إعدادات عامة"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* School name */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-slate-300 font-medium flex items-center gap-2">
              <School className="h-4 w-4 text-[#D4A574]" />
              اسم المدرسة
            </Label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => { setSchoolName(e.target.value); setSaved(false); }}
              className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 outline-none transition-colors"
            />
          </div>

          {/* Academic year */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-slate-300 font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#D4A574]" />
              العام الدراسي
            </Label>
            <Select value={academicYear} onValueChange={(v) => { setAcademicYear(v); setSaved(false); }}>
              <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A24] border-white/[0.08] text-slate-200">
                <SelectItem value="2024-2025" className="focus:bg-white/[0.05] focus:text-white">2024 - 2025</SelectItem>
                <SelectItem value="2025-2026" className="focus:bg-white/[0.05] focus:text-white">2025 - 2026</SelectItem>
                <SelectItem value="2023-2024" className="focus:bg-white/[0.05] focus:text-white">2023 - 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-slate-300 font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#D4A574]" />
              اللغة
            </Label>
            <Select value={language} onValueChange={(v) => { setLanguage(v); setSaved(false); }}>
              <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A24] border-white/[0.08] text-slate-200">
                <SelectItem value="ar" className="focus:bg-white/[0.05] focus:text-white">العربية</SelectItem>
                <SelectItem value="en" className="focus:bg-white/[0.05] focus:text-white">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingCard>

      {/* ============================================================ */}
      {/* Save Button                                                   */}
      {/* ============================================================ */}
      <div
        className="flex items-center justify-between rounded-xl p-4"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {saved ? (
            <span className="flex items-center gap-2 text-emerald-400">
              <Check className="h-4 w-4" />
              تم حفظ التغييرات بنجاح
            </span>
          ) : (
            'تأكد من مراجعة التغييرات قبل الحفظ'
          )}
        </div>
        <Button
          onClick={handleSave}
          className={cn(
            'gap-2 font-semibold rounded-lg px-6 h-10 transition-all duration-300',
            saved
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-slate-900',
          )}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              تم الحفظ
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
