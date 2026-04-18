'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText,
  GraduationCap,
  ClipboardCheck,
  BarChart3,
  Megaphone,
  BookOpen,
  FileBarChart,
  Download,
  Printer,
  FileDown,
  ChevronDown,
  Loader2,
  CalendarDays,
  X,
  Clock,
  Filter,
  Sparkles,
  TrendingUp,
  Eye,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { exportToCSV, formatCsvDate } from '@/lib/csv-export';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import SectionCard from './section-card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportType =
  | 'students'
  | 'teachers'
  | 'attendance'
  | 'grades'
  | 'announcements'
  | 'comprehensive';

interface ReportCategory {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ElementType;
  gradientFrom: string;
  gradientTo: string;
}

interface GeneratedReport {
  id: string;
  title: string;
  type: ReportType;
  generatedAt: string;
  dateRange: { from: string; to: string };
  rowCount: number;
  summaryStats: { label: string; value: string | number; color: string }[];
  tableHeaders: string[];
  tableData: string[][];
  chartData: { label: string; value: number; color: string }[];
  chartType: 'bar' | 'donut';
  trendData?: { label: string; value: number }[];
}

interface ReportFilter {
  classFilter: string;
  statusFilter: string;
  subjectFilter: string;
  termFilter: string;
  categoryFilter: string;
  priorityFilter: string;
}

// ---------------------------------------------------------------------------
// Report categories definition
// ---------------------------------------------------------------------------

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'students',
    title: 'تقرير الطلاب',
    description: 'تقرير شامل عن الطلاب يتضمن التوزيع حسب الصفوف والحالات',
    icon: FileText,
    gradientFrom: '#10b981',
    gradientTo: '#34d399',
  },
  {
    id: 'teachers',
    title: 'تقرير المعلمين',
    description: 'تقرير تفصيلي عن المعلمين حسب المواد والصلاحيات',
    icon: GraduationCap,
    gradientFrom: '#0ea5e9',
    gradientTo: '#38bdf8',
  },
  {
    id: 'attendance',
    title: 'تقرير الحضور',
    description: 'إحصائيات الحضور والغياب مقارنة بين الفصول',
    icon: ClipboardCheck,
    gradientFrom: '#f59e0b',
    gradientTo: '#fbbf24',
  },
  {
    id: 'grades',
    title: 'تقرير الدرجات',
    description: 'تحليل أداء الطلاب ومتوسطات الدرجات حسب المادة',
    icon: BarChart3,
    gradientFrom: '#8b5cf6',
    gradientTo: '#a78bfa',
  },
  {
    id: 'announcements',
    title: 'تقرير الإعلانات',
    description: 'توزيع الإعلانات حسب الفئات والأولويات',
    icon: Megaphone,
    gradientFrom: '#ec4899',
    gradientTo: '#f472b6',
  },
  {
    id: 'comprehensive',
    title: 'تقرير شامل',
    description: 'تقرير متكامل يجمع جميع البيانات والإحصائيات',
    icon: BookOpen,
    gradientFrom: '#D4A574',
    gradientTo: '#E8C9A8',
  },
];

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  students: 'الطلاب',
  teachers: 'المعلمين',
  attendance: 'الحضور',
  grades: 'الدرجات',
  announcements: 'الإعلانات',
  comprehensive: 'شامل',
};

const STATUS_MAP: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  graduated: 'متخرّج',
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
  excused: 'مستأذن',
};

// ---------------------------------------------------------------------------
// Helper: mock data seed with useRef guard
// ---------------------------------------------------------------------------

function useMockReportData() {
  const seeded = useRef(false);
  const recentReports = useRef<GeneratedReport[]>([]);

  if (!seeded.current) {
    seeded.current = true;
    recentReports.current = [
      {
        id: 'r1',
        title: 'تقرير الطلاب - الأسبوع الأول',
        type: 'students',
        generatedAt: new Date(Date.now() - 86400000).toISOString(),
        dateRange: {
          from: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0],
        },
        rowCount: 120,
        summaryStats: [
          { label: 'إجمالي الطلاب', value: 120, color: '#D4A574' },
          { label: 'نشط', value: 92, color: '#10b981' },
          { label: 'غير نشط', value: 18, color: '#f59e0b' },
          { label: 'متخرّج', value: 10, color: '#0ea5e9' },
        ],
        tableHeaders: ['الصف', 'عدد الطلاب', 'نشط', 'غير نشط', 'متخرّج'],
        tableData: [
          ['الصف الأول - أ', '22', '18', '3', '1'],
          ['الصف الأول - ب', '20', '16', '3', '1'],
          ['الصف الثاني - أ', '25', '20', '3', '2'],
          ['الصف الثاني - ب', '18', '14', '2', '2'],
          ['الصف الثالث - أ', '20', '14', '4', '2'],
          ['الصف الثالث - ب', '15', '10', '3', '2'],
        ],
        chartData: [
          { label: 'نشط', value: 92, color: '#10b981' },
          { label: 'غير نشط', value: 18, color: '#f59e0b' },
          { label: 'متخرّج', value: 10, color: '#0ea5e9' },
        ],
        chartType: 'donut',
      },
      {
        id: 'r2',
        title: 'تقرير الحضور - شهري',
        type: 'attendance',
        generatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        dateRange: {
          from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0],
        },
        rowCount: 85,
        summaryStats: [
          { label: 'نسبة الحضور', value: '94%', color: '#10b981' },
          { label: 'حاضر', value: 1128, color: '#10b981' },
          { label: 'غائب', value: 48, color: '#ef4444' },
          { label: 'متأخر', value: 36, color: '#f59e0b' },
        ],
        tableHeaders: ['الصف', 'نسبة الحضور', 'حاضر', 'غائب', 'متأخر', 'مستأذن'],
        tableData: [
          ['الصف الأول - أ', '96%', '211', '5', '3', '1'],
          ['الصف الأول - ب', '92%', '184', '12', '3', '1'],
          ['الصف الثاني - أ', '95%', '238', '8', '4', '0'],
          ['الصف الثاني - ب', '90%', '162', '13', '4', '1'],
          ['الصف الثالث - أ', '93%', '186', '7', '6', '1'],
          ['الصف الثالث - ب', '88%', '132', '11', '5', '2'],
        ],
        chartData: [
          { label: '١-أ', value: 96, color: '#10b981' },
          { label: '١-ب', value: 92, color: '#0ea5e9' },
          { label: '٢-أ', value: 95, color: '#8b5cf6' },
          { label: '٢-ب', value: 90, color: '#f59e0b' },
          { label: '٣-أ', value: 93, color: '#ec4899' },
          { label: '٣-ب', value: 88, color: '#f97316' },
        ],
        chartType: 'bar',
        trendData: [
          { label: 'الأسبوع ١', value: 93 },
          { label: 'الأسبوع ٢', value: 95 },
          { label: 'الأسبوع ٣', value: 91 },
          { label: 'الأسبوع ٤', value: 94 },
        ],
      },
      {
        id: 'r3',
        title: 'تقرير الدرجات - الفصل الدراسي الأول',
        type: 'grades',
        generatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        dateRange: {
          from: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0],
        },
        rowCount: 65,
        summaryStats: [
          { label: 'المتوسط العام', value: '76.5%', color: '#D4A574' },
          { label: 'ممتاز (90+)', value: 18, color: '#10b981' },
          { label: 'جيد جداً', value: 32, color: '#0ea5e9' },
          { label: 'مقبول', value: 15, color: '#f59e0b' },
        ],
        tableHeaders: ['المادة', 'المتوسط', 'أعلى درجة', 'أدنى درجة', 'عدد الطلاب'],
        tableData: [
          ['الرياضيات', '74%', '98%', '32%', '120'],
          ['العلوم', '78%', '97%', '45%', '120'],
          ['اللغة العربية', '82%', '100%', '50%', '120'],
          ['اللغة الإنجليزية', '71%', '95%', '28%', '120'],
          ['التربية الإسلامية', '85%', '100%', '55%', '120'],
          ['الاجتماعيات', '76%', '96%', '38%', '120'],
        ],
        chartData: [
          { label: 'رياضيات', value: 74, color: '#f59e0b' },
          { label: 'علوم', value: 78, color: '#10b981' },
          { label: 'عربي', value: 82, color: '#0ea5e9' },
          { label: 'إنجليزي', value: 71, color: '#8b5cf6' },
          { label: 'إسلامية', value: 85, color: '#D4A574' },
          { label: 'اجتماعيات', value: 76, color: '#ec4899' },
        ],
        chartType: 'bar',
      },
    ];
  }

  return recentReports.current;
}

// ---------------------------------------------------------------------------
// SVG Chart Components
// ---------------------------------------------------------------------------

function ReportBarChart({
  data,
  height = 180,
}: {
  data: { label: string; value: number; color: string }[];
  height?: number;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.min(40, Math.max(16, 200 / data.length));
  const gap = Math.max(4, (200 - barWidth * data.length) / (data.length + 1));

  return (
    <svg
      viewBox={`0 0 200 ${height + 30}`}
      width="100%"
      height={height + 30}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((pct) => {
        const y = height - (pct / 100) * height + 5;
        return (
          <g key={pct}>
            <line
              x1="25"
              y1={y}
              x2="195"
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="4 3"
            />
            <text
              x="20"
              y={y + 3}
              textAnchor="end"
              fill="rgba(255,255,255,0.25)"
              fontSize="7"
            >
              {pct}%
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((item, i) => {
        const barHeight = (item.value / maxValue) * height;
        const x = 30 + i * (barWidth + gap);
        const y = height - barHeight + 5;

        return (
          <g key={item.label}>
            {/* Bar gradient */}
            <defs>
              <linearGradient id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={item.color} stopOpacity="1" />
                <stop offset="100%" stopColor={item.color} stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="3"
              fill={`url(#bar-grad-${i})`}
              className="transition-all duration-700"
              style={{ animationDelay: `${i * 80}ms` }}
            />
            {/* Value on top */}
            <text
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="600"
            >
              {item.value}
            </text>
            {/* Label below */}
            <text
              x={x + barWidth / 2}
              y={height + 22}
              textAnchor="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize="7"
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ReportDonutChart({
  data,
  size = 160,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Compute segment offsets immutably
  const segments = data.reduce(
    (acc, item) => {
      const pct = item.value / total;
      const dashLength = pct * circumference;
      const gapSize = 2; // small gap between segments
      const offset = acc.accumulated;
      return {
        segments: [
          ...acc.segments,
          { ...item, dashLength, gapSize, offset },
        ],
        accumulated: offset + dashLength + gapSize,
      };
    },
    { segments: [] as { label: string; value: number; color: string; dashLength: number; gapSize: number; offset: number }[], accumulated: 0 },
  ).segments;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => (
          <circle
            key={seg.label}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="round"
            className="transition-all duration-700"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
        {/* Center text */}
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          fill="white"
          fontSize="20"
          fontWeight="700"
        >
          {total}
        </text>
        <text
          x={center}
          y={center + 12}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize="10"
        >
          إجمالي
        </text>
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-slate-400">
              {item.label} ({item.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportTrendChart({
  data,
  height = 80,
  width = 300,
}: {
  data: { label: string; value: number }[];
  height?: number;
  width?: number;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;
  const padding = { top: 10, bottom: 20, left: 30, right: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((d.value - minValue) / range) * chartH,
    label: d.label,
    value: d.value,
  }));

  const linePath =
    points.length > 1
      ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      : '';

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`
      : '';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4A574" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#D4A574" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0, 1, 2, 3].map((i) => {
        const y = padding.top + (i / 3) * chartH;
        return (
          <line
            key={i}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="3 3"
          />
        );
      })}

      {/* Area */}
      {areaPath && <path d={areaPath} fill="url(#trend-fill)" />}

      {/* Line */}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="#D4A574"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Dots & labels */}
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="3" fill="#D4A574" stroke="#1A1A24" strokeWidth="1.5" />
          <text
            x={p.x}
            y={p.y - 8}
            textAnchor="middle"
            fill="rgba(255,255,255,0.7)"
            fontSize="7"
            fontWeight="600"
          >
            {p.value}%
          </text>
          <text
            x={p.x}
            y={height - 4}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize="7"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Animated Counter
// ---------------------------------------------------------------------------

function AnimatedCounter({ target, duration = 800 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return <span className="tabular-nums">{count}</span>;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ReportsSection() {
  const { students, teachers, classes, exams, grades } = useAppStore();

  // State
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [viewingReport, setViewingReport] = useState<GeneratedReport | null>(null);

  const [reportTitle, setReportTitle] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const [filters, setFilters] = useState<ReportFilter>({
    classFilter: 'all',
    statusFilter: 'all',
    subjectFilter: 'all',
    termFilter: 'all',
    categoryFilter: 'all',
    priorityFilter: 'all',
  });

  // Mock recent reports
  const recentReportsRef = useMockReportData();
  const [recentReports, setRecentReports] = useState<GeneratedReport[]>(recentReportsRef);

  // Unique class/subject lists from store
  const classList = classes.length > 0 ? classes.map((c) => c.name) : ['الصف الأول - أ', 'الصف الأول - ب', 'الصف الثاني - أ', 'الصف الثاني - ب', 'الصف الثالث - أ', 'الصف الثالث - ب'];
  const subjectList = teachers.length > 0
    ? [...new Set(teachers.map((t) => t.subject))]
    : ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'التربية الإسلامية', 'الاجتماعيات'];

  // Handlers
  const handleSelectType = useCallback((type: ReportType) => {
    setSelectedType(type);
    setGeneratedReport(null);
    setViewingReport(null);
    const cat = REPORT_CATEGORIES.find((c) => c.id === type);
    if (cat) setReportTitle(`تقرير ${cat.title} - ${new Date().toLocaleDateString('ar-SA')}`);
    setFilters({
      classFilter: 'all',
      statusFilter: 'all',
      subjectFilter: 'all',
      termFilter: 'all',
      categoryFilter: 'all',
      priorityFilter: 'all',
    });
  }, []);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      if (!selectedType) return;
      const report = generateReport(selectedType, reportTitle, { from: dateFrom, to: dateTo }, filters, { students, teachers, classes, exams, grades });
      setGeneratedReport(report);
      setViewingReport(report);
      setRecentReports((prev) => [report, ...prev.slice(0, 9)]);
      setIsGenerating(false);
      toast.success('تم إنشاء التقرير بنجاح');
    }, 1500);
  }, [selectedType, reportTitle, dateFrom, dateTo, filters, students, teachers, classes, exams, grades]);

  const handleExportCSV = useCallback((report: GeneratedReport) => {
    const data = report.tableData.map((row) => {
      const obj: Record<string, unknown> = {};
      report.tableHeaders.forEach((header, idx) => {
        obj[header] = row[idx];
      });
      return obj;
    });
    const columns = report.tableHeaders.map((header) => ({
      key: header,
      label: header,
    }));
    exportToCSV(data as Record<string, unknown>[], report.title.replace(/\s+/g, '-'), columns);
    toast.success('تم تصدير التقرير كملف CSV');
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDeleteReport = useCallback(
    (id: string) => {
      setRecentReports((prev) => prev.filter((r) => r.id !== id));
      if (viewingReport?.id === id) setViewingReport(null);
      if (generatedReport?.id === id) setGeneratedReport(null);
      toast.success('تم حذف التقرير');
    },
    [viewingReport, generatedReport],
  );

  const handleViewReport = useCallback((report: GeneratedReport) => {
    setViewingReport(report);
    setSelectedType(report.type);
    setReportTitle(report.title);
  }, []);

  // Get the report being displayed
  const displayReport = viewingReport || generatedReport;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ── Page Title ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <FileBarChart className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
              التقارير
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              إنشاء وتصدير التقارير الإحصائية للمدرسة
            </p>
          </div>
        </div>
        {selectedType && (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => {
              setSelectedType(null);
              setGeneratedReport(null);
              setViewingReport(null);
            }}
          >
            <ArrowLeft className="h-4 w-4 ml-1" />
            العودة إلى الأنواع
          </Button>
        )}
      </div>

      {/* ── Step 1: Report Categories Grid ── */}
      {!selectedType && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_CATEGORIES.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="glass-card-elevated hover-lift group cursor-pointer rounded-xl p-5 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                  onClick={() => handleSelectType(cat.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className="flex shrink-0 items-center justify-center h-12 w-12 rounded-xl transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${cat.gradientFrom}22, ${cat.gradientTo}22)`,
                      }}
                    >
                      <Icon
                        className="h-6 w-6 transition-colors duration-300"
                        style={{ color: cat.gradientFrom }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white mb-1 group-hover:text-[#D4A574] transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 bg-white/[0.04] px-2.5 py-1 rounded-md">
                      {cat.id === 'comprehensive' ? 'جميع البيانات' : `${REPORT_TYPE_LABELS[cat.id]}`}
                    </span>
                    <Button
                      size="sm"
                      className="h-8 text-xs font-medium px-3 transition-all duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${cat.gradientFrom}, ${cat.gradientTo})`,
                        color: 'white',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectType(cat.id);
                      }}
                    >
                      إنشاء التقرير
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Recent Reports ── */}
          <SectionCard
            title="التقارير الأخيرة"
            icon={<Clock className="h-4 w-4" />}
            action={
              <span className="text-xs text-muted-foreground bg-white/[0.04] px-3 py-1.5 rounded-lg">
                {recentReports.length} تقرير
              </span>
            }
          >
            {recentReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white/[0.04]">
                  <FileText className="h-7 w-7 text-slate-500" />
                </div>
                <p className="text-sm text-slate-400">لا توجد تقارير تم إنشاؤها بعد</p>
                <p className="text-xs text-slate-500">اختر نوع التقرير أعلاه للبدء</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto scrollbar-thin">
                {recentReports.map((report) => {
                  const cat = REPORT_CATEGORIES.find((c) => c.id === report.type);
                  return (
                    <div
                      key={report.id}
                      className="flex items-center gap-4 rounded-xl p-3.5 transition-all duration-200 hover:bg-white/[0.03] cursor-pointer group"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.015)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                      onClick={() => handleViewReport(report)}
                    >
                      {/* Type icon */}
                      <div
                        className="flex shrink-0 items-center justify-center h-10 w-10 rounded-lg"
                        style={{
                          background: cat
                            ? `linear-gradient(135deg, ${cat.gradientFrom}22, ${cat.gradientTo}22)`
                            : 'rgba(212,165,116,0.1)',
                        }}
                      >
                        {cat ? (
                          <cat.icon className="h-5 w-5" style={{ color: cat.gradientFrom }} />
                        ) : (
                          <FileText className="h-5 w-5 text-[#D4A574]" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {report.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-2 py-0 bg-white/[0.06] text-slate-400 border-0"
                          >
                            {REPORT_TYPE_LABELS[report.type]}
                          </Badge>
                          <span className="text-[10px] text-slate-500">
                            {formatCsvDate(report.generatedAt)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {report.rowCount} صف
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReport(report);
                          }}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#D4A574] hover:bg-[#D4A574]/10 transition-colors"
                          title="عرض"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(report.id);
                          }}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </>
      )}

      {/* ── Step 2: Report Generation Form ── */}
      {selectedType && !displayReport && (
        <SectionCard
          title={`إنشاء ${REPORT_CATEGORIES.find((c) => c.id === selectedType)?.title || ''}`}
          icon={
            (() => {
              const cat = REPORT_CATEGORIES.find((c) => c.id === selectedType);
              return cat ? <cat.icon className="h-4 w-4" /> : <FileBarChart className="h-4 w-4" />;
            })()
          }
        >
          <div className="flex flex-col gap-5">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">عنوان التقرير</label>
              <Input
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="أدخل عنوان التقرير..."
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
              />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#D4A574]" />
                  من تاريخ
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-white/[0.04] border-white/[0.08] text-white focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#D4A574]" />
                  إلى تاريخ
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-white/[0.04] border-white/[0.08] text-white focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
                />
              </div>
            </div>

            {/* Dynamic filters based on report type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#D4A574]" />
                تصفية إضافية
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Class filter - for student, attendance, grades, comprehensive */}
                {(selectedType === 'students' || selectedType === 'attendance' || selectedType === 'grades' || selectedType === 'comprehensive') && (
                  <SelectField
                    label="الصف"
                    value={filters.classFilter}
                    onChange={(v) => setFilters((f) => ({ ...f, classFilter: v }))}
                    options={[
                      { value: 'all', label: 'جميع الصفوف' },
                      ...classList.map((c) => ({ value: c, label: c })),
                    ]}
                  />
                )}

                {/* Status filter - for student, teacher, attendance, comprehensive */}
                {(selectedType === 'students' || selectedType === 'teachers' || selectedType === 'attendance' || selectedType === 'comprehensive') && (
                  <SelectField
                    label="الحالة"
                    value={filters.statusFilter}
                    onChange={(v) => setFilters((f) => ({ ...f, statusFilter: v }))}
                    options={
                      selectedType === 'teachers'
                        ? [
                            { value: 'all', label: 'جميع الحالات' },
                            { value: 'active', label: 'نشط' },
                            { value: 'inactive', label: 'غير نشط' },
                          ]
                        : selectedType === 'attendance'
                          ? [
                              { value: 'all', label: 'جميع الحالات' },
                              { value: 'present', label: 'حاضر' },
                              { value: 'absent', label: 'غائب' },
                              { value: 'late', label: 'متأخر' },
                              { value: 'excused', label: 'مستأذن' },
                            ]
                          : [
                              { value: 'all', label: 'جميع الحالات' },
                              { value: 'active', label: 'نشط' },
                              { value: 'inactive', label: 'غير نشط' },
                              { value: 'graduated', label: 'متخرّج' },
                            ]
                    }
                  />
                )}

                {/* Subject filter - for teacher, grades, comprehensive */}
                {(selectedType === 'teachers' || selectedType === 'grades' || selectedType === 'comprehensive') && (
                  <SelectField
                    label="المادة"
                    value={filters.subjectFilter}
                    onChange={(v) => setFilters((f) => ({ ...f, subjectFilter: v }))}
                    options={[
                      { value: 'all', label: 'جميع المواد' },
                      ...subjectList.map((s) => ({ value: s, label: s })),
                    ]}
                  />
                )}

                {/* Term filter - for grades, comprehensive */}
                {(selectedType === 'grades' || selectedType === 'comprehensive') && (
                  <SelectField
                    label="الفصل الدراسي"
                    value={filters.termFilter}
                    onChange={(v) => setFilters((f) => ({ ...f, termFilter: v }))}
                    options={[
                      { value: 'all', label: 'جميع الفصول' },
                      { value: 'first', label: 'الفصل الأول' },
                      { value: 'second', label: 'الفصل الثاني' },
                    ]}
                  />
                )}

                {/* Category filter - for announcements, comprehensive */}
                {(selectedType === 'announcements' || selectedType === 'comprehensive') && (
                  <SelectField
                    label="الفئة"
                    value={filters.categoryFilter}
                    onChange={(v) => setFilters((f) => ({ ...f, categoryFilter: v }))}
                    options={[
                      { value: 'all', label: 'جميع الفئات' },
                      { value: 'general', label: 'عام' },
                      { value: 'academic', label: 'أكاديمي' },
                      { value: 'event', label: 'فعالية' },
                      { value: 'urgent', label: 'عاجل' },
                      { value: 'parent', label: 'أولياء الأمور' },
                    ]}
                  />
                )}

                {/* Priority filter - for announcements, comprehensive */}
                {(selectedType === 'announcements' || selectedType === 'comprehensive') && (
                  <SelectField
                    label="الأولوية"
                    value={filters.priorityFilter}
                    onChange={(v) => setFilters((f) => ({ ...f, priorityFilter: v }))}
                    options={[
                      { value: 'all', label: 'جميع الأولويات' },
                      { value: 'low', label: 'منخفض' },
                      { value: 'normal', label: 'عادي' },
                      { value: 'high', label: 'مرتفع' },
                      { value: 'urgent', label: 'عاجل' },
                    ]}
                  />
                )}
              </div>
            </div>

            {/* Generate button */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !reportTitle.trim()}
                className="h-11 px-6 text-sm font-medium"
                style={{
                  background: 'linear-gradient(135deg, #D4A574, #B07D4F)',
                  color: 'white',
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جارٍ إنشاء التقرير...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 ml-2" />
                    إنشاء التقرير
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedType(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 3: Report Preview ── */}
      {displayReport && (
        <>
          {/* Report Header Card */}
          <div className="glass-card-elevated rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                {(() => {
                  const cat = REPORT_CATEGORIES.find((c) => c.id === displayReport.type);
                  return cat ? (
                    <div
                      className="flex shrink-0 items-center justify-center h-12 w-12 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${cat.gradientFrom}22, ${cat.gradientTo}22)`,
                      }}
                    >
                      <cat.icon className="h-6 w-6" style={{ color: cat.gradientFrom }} />
                    </div>
                  ) : null;
                })()}
                <div>
                  <h2 className="text-xl font-bold text-white">{displayReport.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <Badge
                      variant="secondary"
                      className="text-xs px-2.5 py-0.5 bg-[#D4A574]/10 text-[#D4A574] border border-[#D4A574]/20"
                    >
                      {REPORT_TYPE_LABELS[displayReport.type]}
                    </Badge>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {displayReport.dateRange.from} — {displayReport.dateRange.to}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      تم الإنشاء: {formatCsvDate(displayReport.generatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs border-[#D4A574]/30 text-[#D4A574] hover:bg-[#D4A574]/10"
                  onClick={() => handleExportCSV(displayReport)}
                >
                  <Download className="h-3.5 w-3.5 ml-1.5" />
                  تصدير CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs border-white/[0.1] text-slate-300 hover:bg-white/[0.06]"
                  onClick={handlePrint}
                >
                  <Printer className="h-3.5 w-3.5 ml-1.5" />
                  طباعة
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs border-white/[0.1] text-slate-300 hover:bg-white/[0.06]"
                  onClick={() => {
                    setGeneratedReport(null);
                    setViewingReport(null);
                  }}
                >
                  <FileDown className="h-3.5 w-3.5 ml-1.5" />
                  تقرير جديد
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Statistics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {displayReport.summaryStats.map((stat, index) => (
              <div
                key={stat.label}
                className="glass-card-elevated rounded-xl p-4 animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <p className="text-[11px] text-slate-400 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-white tabular-nums" style={{ color: stat.color }}>
                  {typeof stat.value === 'number' ? (
                    <AnimatedCounter target={stat.value} />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Chart + Table Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="glass-card-elevated rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#D4A574]" />
                {displayReport.chartType === 'donut' ? 'توزيع الحالات' : 'مقارنة البيانات'}
              </h3>
              {displayReport.chartType === 'donut' ? (
                <ReportDonutChart data={displayReport.chartData} size={180} />
              ) : (
                <ReportBarChart data={displayReport.chartData} height={200} />
              )}
            </div>

            {/* Data Table */}
            <div className="glass-card-elevated rounded-xl p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#D4A574]" />
                بيانات التقرير
                <Badge variant="secondary" className="text-[10px] px-2 py-0 bg-white/[0.06] text-slate-400 border-0 mr-auto">
                  {displayReport.rowCount} صف
                </Badge>
              </h3>
              <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      {displayReport.tableHeaders.map((header, i) => (
                        <th
                          key={i}
                          className="text-right text-xs font-medium text-slate-400 px-4 py-3 whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayReport.tableData.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={cn(
                          'border-t border-white/[0.04] transition-colors hover:bg-white/[0.02]',
                          rowIdx % 2 === 1 && 'bg-white/[0.015]',
                        )}
                      >
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="text-xs text-slate-300 px-4 py-2.5 whitespace-nowrap tabular-nums"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Trend Chart (if available) */}
          {displayReport.trendData && displayReport.trendData.length > 1 && (
            <div className="glass-card-elevated rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#D4A574]" />
                اتجاه الأداء
              </h3>
              <ReportTrendChart data={displayReport.trendData} height={100} width={500} />
            </div>
          )}

          {/* Recent Reports (compact) */}
          <SectionCard
            title="التقارير الأخيرة"
            icon={<Clock className="h-4 w-4" />}
            action={
              <span className="text-xs text-muted-foreground bg-white/[0.04] px-3 py-1.5 rounded-lg">
                {recentReports.length} تقرير
              </span>
            }
          >
            <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto scrollbar-thin">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg p-2.5 transition-all cursor-pointer',
                    viewingReport?.id === report.id
                      ? 'bg-[#D4A574]/10 border border-[#D4A574]/20'
                      : 'hover:bg-white/[0.03] border border-transparent',
                  )}
                  onClick={() => handleViewReport(report)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{report.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formatCsvDate(report.generatedAt)} · {report.rowCount} صف
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-white/[0.06] text-slate-400 border-0 shrink-0">
                    {REPORT_TYPE_LABELS[report.type]}
                  </Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Select Field Component
// ---------------------------------------------------------------------------

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs px-3 py-2.5 pl-8 focus:outline-none focus:border-[#D4A574]/50 focus:ring-1 focus:ring-[#D4A574]/20 transition-colors cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1A1A24] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Report Generation Logic
// ---------------------------------------------------------------------------

function generateReport(
  type: ReportType,
  title: string,
  dateRange: { from: string; to: string },
  filters: ReportFilter,
  storeData: {
    students: ReturnType<typeof useAppStore.getState>['students'];
    teachers: ReturnType<typeof useAppStore.getState>['teachers'];
    classes: ReturnType<typeof useAppStore.getState>['classes'];
    exams: ReturnType<typeof useAppStore.getState>['exams'];
    grades: ReturnType<typeof useAppStore.getState>['grades'];
  },
): GeneratedReport {
  const { students, teachers, classes, exams, grades } = storeData;
  const id = `r-${Date.now()}`;
  const now = new Date().toISOString();

  // Get unique class names
  const classNames = classes.length > 0
    ? classes.map((c) => c.name)
    : ['الصف الأول - أ', 'الصف الأول - ب', 'الصف الثاني - أ', 'الصف الثاني - ب', 'الصف الثالث - أ', 'الصف الثالث - ب'];

  switch (type) {
    case 'students':
      return generateStudentReport(id, title, now, dateRange, filters, students, classNames);
    case 'teachers':
      return generateTeacherReport(id, title, now, dateRange, filters, teachers);
    case 'attendance':
      return generateAttendanceReport(id, title, now, dateRange, filters, classNames);
    case 'grades':
      return generateGradesReport(id, title, now, dateRange, filters, grades);
    case 'announcements':
      return generateAnnouncementsReport(id, title, now, dateRange, filters);
    case 'comprehensive':
      return generateComprehensiveReport(id, title, now, dateRange, filters, students, teachers, classNames, grades);
    default:
      return generateStudentReport(id, title, now, dateRange, filters, students, classNames);
  }
}

function generateStudentReport(
  id: string,
  title: string,
  generatedAt: string,
  dateRange: { from: string; to: string },
  _filters: ReportFilter,
  students: { id: string; name: string; status: string; classId: string | null; createdAt: string }[],
  classNames: string[],
): GeneratedReport {
  // Use store data if available, otherwise mock
  const hasRealData = students.length > 0;

  const activeCount = hasRealData ? students.filter((s) => s.status === 'active').length : 92;
  const inactiveCount = hasRealData ? students.filter((s) => s.status === 'inactive').length : 18;
  const graduatedCount = hasRealData ? students.filter((s) => s.status === 'graduated').length : 10;
  const totalCount = hasRealData ? students.length : 120;

  const tableData = classNames.map((cls, i) => {
    const classStudents = hasRealData ? students.filter((s) => {
      // Simple match by index for demo
      return Math.floor(Number(s.id?.slice(-1) || '0') / 2) === i;
    }) : [];
    const count = hasRealData ? Math.max(15, Math.round(totalCount / classNames.length) + Math.round(Math.random() * 5 - 2)) : [22, 20, 25, 18, 20, 15][i];
    const actv = Math.round(count * (0.7 + Math.random() * 0.2));
    const inactv = Math.round((count - actv) * 0.6);
    const grad = count - actv - inactv;
    return [cls, String(count), String(actv), String(inactv), String(grad)];
  });

  return {
    id,
    title,
    type: 'students',
    generatedAt,
    dateRange,
    rowCount: totalCount,
    summaryStats: [
      { label: 'إجمالي الطلاب', value: totalCount, color: '#D4A574' },
      { label: 'نشط', value: activeCount, color: '#10b981' },
      { label: 'غير نشط', value: inactiveCount, color: '#f59e0b' },
      { label: 'متخرّج', value: graduatedCount, color: '#0ea5e9' },
    ],
    tableHeaders: ['الصف', 'عدد الطلاب', 'نشط', 'غير نشط', 'متخرّج'],
    tableData,
    chartData: [
      { label: 'نشط', value: activeCount, color: '#10b981' },
      { label: 'غير نشط', value: inactiveCount, color: '#f59e0b' },
      { label: 'متخرّج', value: graduatedCount, color: '#0ea5e9' },
    ],
    chartType: 'donut',
  };
}

function generateTeacherReport(
  id: string,
  title: string,
  generatedAt: string,
  dateRange: { from: string; to: string },
  _filters: ReportFilter,
  teachers: { id: string; name: string; subject: string; status: string; permissions: string }[],
): GeneratedReport {
  const hasRealData = teachers.length > 0;
  const totalCount = hasRealData ? teachers.length : 24;
  const activeCount = hasRealData ? teachers.filter((t) => t.status === 'active').length : 20;
  const inactiveCount = totalCount - activeCount;
  const adminCount = hasRealData ? teachers.filter((t) => t.permissions === 'admin').length : 3;
  const supervisorCount = hasRealData ? teachers.filter((t) => t.permissions === 'supervisor').length : 5;

  const subjects = hasRealData
    ? [...new Set(teachers.map((t) => t.subject))]
    : ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'التربية الإسلامية', 'الاجتماعيات'];

  const tableData = subjects.map((sub) => {
    const count = hasRealData
      ? teachers.filter((t) => t.subject === sub).length
      : Math.floor(Math.random() * 3) + 2;
    return [sub, String(count), String(Math.round(count * 0.85)), String(Math.round(count * 0.15))];
  });

  return {
    id,
    title,
    type: 'teachers',
    generatedAt,
    dateRange,
    rowCount: totalCount,
    summaryStats: [
      { label: 'إجمالي المعلمين', value: totalCount, color: '#D4A574' },
      { label: 'نشط', value: activeCount, color: '#10b981' },
      { label: 'مشرفين', value: supervisorCount, color: '#8b5cf6' },
      { label: 'مديرين', value: adminCount, color: '#f59e0b' },
    ],
    tableHeaders: ['المادة', 'عدد المعلمين', 'نشط', 'غير نشط'],
    tableData,
    chartData: [
      { label: 'مدير', value: adminCount, color: '#f59e0b' },
      { label: 'مشرف', value: supervisorCount, color: '#8b5cf6' },
      { label: 'معلم', value: totalCount - adminCount - supervisorCount, color: '#0ea5e9' },
    ],
    chartType: 'donut',
  };
}

function generateAttendanceReport(
  id: string,
  title: string,
  generatedAt: string,
  dateRange: { from: string; to: string },
  _filters: ReportFilter,
  classNames: string[],
): GeneratedReport {
  const rates = [96, 92, 95, 90, 93, 88];
  const tableData = classNames.map((cls, i) => {
    const total = 220;
    const present = Math.round(total * rates[i] / 100);
    const absent = Math.round(total * (100 - rates[i]) / 100 * 0.5);
    const late = Math.round(total * (100 - rates[i]) / 100 * 0.35);
    const excused = total - present - absent - late;
    return [cls, `${rates[i]}%`, String(present), String(absent), String(late), String(Math.max(excused, 0))];
  });

  return {
    id,
    title,
    type: 'attendance',
    generatedAt,
    dateRange,
    rowCount: classNames.length * 220,
    summaryStats: [
      { label: 'نسبة الحضور', value: '94%', color: '#10b981' },
      { label: 'حاضر', value: 1128, color: '#10b981' },
      { label: 'غائب', value: 48, color: '#ef4444' },
      { label: 'متأخر', value: 36, color: '#f59e0b' },
    ],
    tableHeaders: ['الصف', 'نسبة الحضور', 'حاضر', 'غائب', 'متأخر', 'مستأذن'],
    tableData,
    chartData: classNames.map((cls, i) => ({
      label: cls.replace(/الصف /, '').split(' ')[0],
      value: rates[i],
      color: ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899', '#f97316'][i],
    })),
    chartType: 'bar',
    trendData: [
      { label: 'الأسبوع ١', value: 91 },
      { label: 'الأسبوع ٢', value: 94 },
      { label: 'الأسبوع ٣', value: 92 },
      { label: 'الأسبوع ٤', value: 95 },
    ],
  };
}

function generateGradesReport(
  id: string,
  title: string,
  generatedAt: string,
  dateRange: { from: string; to: string },
  _filters: ReportFilter,
  grades: { id: string; subject: string; score: number; maxScore: number; studentName?: string }[],
): GeneratedReport {
  const hasRealData = grades.length > 0;
  const subjects = ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'التربية الإسلامية', 'الاجتماعيات'];
  const avgs = hasRealData
    ? subjects.map((sub) => {
        const subGrades = grades.filter((g) => g.subject === sub);
        if (subGrades.length === 0) return 70 + Math.round(Math.random() * 20);
        return Math.round(subGrades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / subGrades.length);
      })
    : [74, 78, 82, 71, 85, 76];

  const tableData = subjects.map((sub, i) => {
    const avg = avgs[i];
    const high = avg + Math.round(Math.random() * 10 + 5);
    const low = Math.max(avg - Math.round(Math.random() * 20 + 10), 20);
    return [sub, `${avg}%`, `${high}%`, `${low}%`, '120'];
  });

  return {
    id,
    title,
    type: 'grades',
    generatedAt,
    dateRange,
    rowCount: 65,
    summaryStats: [
      { label: 'المتوسط العام', value: '76.5%', color: '#D4A574' },
      { label: 'ممتاز (90+)', value: 18, color: '#10b981' },
      { label: 'جيد جداً', value: 32, color: '#0ea5e9' },
      { label: 'مقبول', value: 15, color: '#f59e0b' },
    ],
    tableHeaders: ['المادة', 'المتوسط', 'أعلى درجة', 'أدنى درجة', 'عدد الطلاب'],
    tableData,
    chartData: subjects.map((sub, i) => ({
      label: sub.replace(/ال /, '').slice(0, 5),
      value: avgs[i],
      color: ['#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#D4A574', '#ec4899'][i],
    })),
    chartType: 'bar',
    trendData: [
      { label: 'محرم', value: 72 },
      { label: 'صفر', value: 75 },
      { label: 'ربيع أول', value: 78 },
      { label: 'ربيع ثاني', value: 76 },
      { label: 'جمادى أول', value: 80 },
      { label: 'جمادى ثاني', value: 79 },
    ],
  };
}

function generateAnnouncementsReport(
  id: string,
  title: string,
  generatedAt: string,
  dateRange: { from: string; to: string },
  _filters: ReportFilter,
): GeneratedReport {
  const categories = ['عام', 'أكاديمي', 'فعالية', 'عاجل', 'أولياء الأمور'];
  const counts = [15, 12, 8, 5, 10];
  const total = counts.reduce((a, b) => a + b, 0);

  const tableData = [
    ['عام', String(counts[0]), '8', '5', '2'],
    ['أكاديمي', String(counts[1]), '10', '1', '1'],
    ['فعالية', String(counts[2]), '6', '1', '1'],
    ['عاجل', String(counts[3]), '3', '0', '2'],
    ['أولياء الأمور', String(counts[4]), '7', '2', '1'],
  ];

  return {
    id,
    title,
    type: 'announcements',
    generatedAt,
    dateRange,
    rowCount: total,
    summaryStats: [
      { label: 'إجمالي الإعلانات', value: total, color: '#D4A574' },
      { label: 'مثبّت', value: 8, color: '#f59e0b' },
      { label: 'نشط', value: 34, color: '#10b981' },
      { label: 'منتهي', value: 8, color: '#ef4444' },
    ],
    tableHeaders: ['الفئة', 'العدد', 'نشط', 'مثبّت', 'عاجل'],
    tableData,
    chartData: categories.map((cat, i) => ({
      label: cat,
      value: counts[i],
      color: ['#D4A574', '#0ea5e9', '#8b5cf6', '#ef4444', '#10b981'][i],
    })),
    chartType: 'donut',
  };
}

function generateComprehensiveReport(
  id: string,
  title: string,
  generatedAt: string,
  dateRange: { from: string; to: string },
  _filters: ReportFilter,
  students: { id: string; status: string }[],
  teachers: { id: string; status: string }[],
  classNames: string[],
  grades: { id: string; subject: string; score: number; maxScore: number }[],
): GeneratedReport {
  const studentCount = students.length > 0 ? students.length : 120;
  const teacherCount = teachers.length > 0 ? teachers.length : 24;
  const classCount = classNames.length;

  const tableData = classNames.map((cls) => {
    const avg = 70 + Math.round(Math.random() * 20);
    const attendRate = 85 + Math.round(Math.random() * 12);
    return [cls, String(Math.round(studentCount / classCount)), `${avg}%`, `${attendRate}%`, 'جيد'];
  });

  return {
    id,
    title,
    type: 'comprehensive',
    generatedAt,
    dateRange,
    rowCount: studentCount + teacherCount,
    summaryStats: [
      { label: 'الطلاب', value: studentCount, color: '#10b981' },
      { label: 'المعلمون', value: teacherCount, color: '#0ea5e9' },
      { label: 'الصفوف', value: classCount, color: '#8b5cf6' },
      { label: 'نسبة الحضور', value: '93%', color: '#D4A574' },
    ],
    tableHeaders: ['الصف', 'عدد الطلاب', 'متوسط الدرجات', 'نسبة الحضور', 'التقييم'],
    tableData,
    chartData: classNames.map((cls, i) => ({
      label: cls.replace(/الصف /, '').split(' ')[0],
      value: 85 + Math.round(Math.random() * 12),
      color: ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899', '#f97316'][i],
    })),
    chartType: 'bar',
    trendData: [
      { label: 'محرم', value: 75 },
      { label: 'صفر', value: 78 },
      { label: 'ربيع أول', value: 80 },
      { label: 'ربيع ثاني', value: 82 },
      { label: 'جمادى أول', value: 85 },
      { label: 'جمادى ثاني', value: 83 },
    ],
  };
}
