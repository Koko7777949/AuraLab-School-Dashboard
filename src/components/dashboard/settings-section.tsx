'use client';

import { useState } from 'react';
import SectionCard from './section-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ToggleSetting {
  key: string;
  label: string;
  icon: React.ReactNode;
  defaultOn: boolean;
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
      className="flex items-center justify-between gap-3 rounded-lg p-3 transition-colors"
      style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex shrink-0 items-center justify-center h-9 w-9 rounded-lg bg-[#D4A574]/10 text-[#D4A574]">
          {setting.icon}
        </div>
        <Label
          htmlFor={`toggle-${setting.key}`}
          className="cursor-pointer text-sm text-gray-200 truncate"
        >
          {setting.label}
        </Label>
      </div>
      <Switch
        id={`toggle-${setting.key}`}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(setting.key, v)}
        className="data-[state=checked]:bg-[#D4A574] data-[state=unchecked]:bg-gray-600"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function SettingsSection() {
  /* ── notification toggles ── */
  const notificationDefaults: ToggleSetting[] = [
    { key: 'system', label: 'إشعارات النظام', icon: <Bell className="h-4 w-4" />, defaultOn: true },
    { key: 'sound', label: 'إشعارات الصوت', icon: <Volume2 className="h-4 w-4" />, defaultOn: true },
    { key: 'email', label: 'إشعارات البريد الإلكتروني', icon: <Mail className="h-4 w-4" />, defaultOn: false },
    { key: 'messages', label: 'إشعارات الرسائل', icon: <Smartphone className="h-4 w-4" />, defaultOn: true },
  ];

  /* ── analytics toggles ── */
  const analyticsDefaults: ToggleSetting[] = [
    { key: 'analyticsNotif', label: 'إشعارات التحليلات', icon: <BarChart3 className="h-4 w-4" />, defaultOn: true },
    { key: 'activityTracking', label: 'تتبع الأنشطة', icon: <Activity className="h-4 w-4" />, defaultOn: true },
    { key: 'assessmentTracking', label: 'تتبع التقييمات', icon: <Target className="h-4 w-4" />, defaultOn: false },
    { key: 'sessionTracking', label: 'تتبع الجلسات', icon: <Clock className="h-4 w-4" />, defaultOn: true },
  ];

  const allDefaults = [...notificationDefaults, ...analyticsDefaults];

  const buildDefaultMap = () =>
    Object.fromEntries(allDefaults.map((s) => [s.key, s.defaultOn]));

  const [toggles, setToggles] = useState<Record<string, boolean>>(buildDefaultMap);
  const [language, setLanguage] = useState('ar');
  const [theme, setTheme] = useState('dark');
  const [schoolName, setSchoolName] = useState('AuraLab Academy');

  const handleToggle = (key: string, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
  };

  const resetAll = () => {
    setToggles(buildDefaultMap());
    setLanguage('ar');
    setTheme('dark');
    setSchoolName('AuraLab Academy');
  };

  /* ── permissions data ── */
  const roles = [
    {
      name: 'مدير',
      nameEn: 'Admin',
      color: '#D4A574',
      permissions: [
        'إدارة كاملة للنظام',
        'إضافة / تعديل / حذف المستخدمين',
        'إدارة الصلاحيات والأدوار',
        'الوصول للتحليلات والتقارير',
        'إعدادات النظام العامة',
      ],
    },
    {
      name: 'معلم',
      nameEn: 'Teacher',
      color: '#60A5FA',
      permissions: [
        'عرض وتسجيل الطلاب في الفصول',
        'إنشاء وإدارة الاختبارات',
        'تسجيل درجات الطلاب',
        'عرض التقارير الخاصة بفصوله',
      ],
    },
    {
      name: 'مشرف',
      nameEn: 'Supervisor',
      color: '#34D399',
      permissions: [
        'عرض جميع البيانات بدون تعديل',
        'إدارة جلسات التقييم',
        'الوصول لجميع التقارير',
        'مراقبة نشاط المعلمين',
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-[#D4A574]/15 text-[#D4A574]">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">إعدادات النظام</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              تخصيص إعدادات النظام والإشعارات والصلاحيات
            </p>
          </div>
        </div>

        <Button
          onClick={resetAll}
          variant="outline"
          className="gap-2 text-gray-300 border-gray-600 hover:bg-[#D4A574]/10 hover:text-[#D4A574] hover:border-[#D4A574]/40 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          إعادة تعيين الإعدادات
        </Button>
      </div>

      <Separator className="bg-white/5" />

      {/* ============================================================ */}
      {/* Section 1 – الإشعارات                                        */}
      {/* ============================================================ */}
      <SectionCard
        title="الإشعارات"
        icon={<Bell className="h-5 w-5" />}
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
      </SectionCard>

      {/* ============================================================ */}
      {/* Section 2 – التحليلات                                        */}
      {/* ============================================================ */}
      <SectionCard
        title="التحليلات"
        icon={<BarChart3 className="h-5 w-5" />}
      >
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
      </SectionCard>

      {/* ============================================================ */}
      {/* Section 3 – عام                                              */}
      {/* ============================================================ */}
      <SectionCard
        title="عام"
        icon={<Globe className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Language */}
          <div className="space-y-2.5">
            <Label className="text-sm text-gray-300">اللغة / Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 focus:ring-[#D4A574]/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A24] border-white/10 text-gray-200">
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Theme */}
          <div className="space-y-2.5">
            <Label className="text-sm text-gray-300">المظهر / Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 focus:ring-[#D4A574]/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A24] border-white/10 text-gray-200">
                <SelectItem value="dark">داكن</SelectItem>
                <SelectItem value="light">فاتح</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* School display name */}
          <div className="space-y-2.5">
            <Label className="text-sm text-gray-300">اسم المدرسة</Label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4A574]/40 transition-colors"
            />
          </div>
        </div>
      </SectionCard>

      {/* ============================================================ */}
      {/* Section 4 – الصلاحيات                                        */}
      {/* ============================================================ */}
      <SectionCard
        title="الصلاحيات"
        icon={<Shield className="h-5 w-5" />}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Header */}
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-right py-3 px-4 text-gray-400 font-medium">الدور</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">الصلاحيات</th>
              </tr>
            </thead>

            {/* Rows */}
            <tbody>
              {roles.map((role, idx) => (
                <tr
                  key={role.nameEn}
                  className={
                    idx < roles.length - 1 ? 'border-b border-white/5' : ''
                  }
                >
                  {/* Role badge */}
                  <td className="py-4 px-4 align-top w-40">
                    <div className="flex flex-col gap-1">
                      <span
                        className="inline-flex items-center justify-center w-fit rounded-md px-2.5 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: `${role.color}18`,
                          color: role.color,
                        }}
                      >
                        {role.name}
                      </span>
                      <span className="text-[11px] text-gray-500">{role.nameEn}</span>
                    </div>
                  </td>

                  {/* Permissions list */}
                  <td className="py-4 px-4">
                    <ul className="space-y-1.5">
                      {role.permissions.map((perm) => (
                        <li
                          key={perm}
                          className="flex items-center gap-2 text-gray-300 text-sm"
                        >
                          <span
                            className="mt-1.5 block h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: role.color }}
                          />
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
