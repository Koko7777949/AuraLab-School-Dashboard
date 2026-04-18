'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
  };

  const handleSave = () => {
    setSaved(true);
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
      {/* Section 3 – الإشعارات                                        */}
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
      {/* Section 4 – النظام                                           */}
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
