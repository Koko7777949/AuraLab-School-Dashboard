'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DonutChart({
  segments,
  size = 180,
  strokeWidth = 24,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const [animProgress, setAnimProgress] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    label: '',
    value: 0,
    percentage: 0,
    color: '',
  });

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = useMemo(() => segments.reduce((sum, s) => sum + s.value, 0), [segments]);

  // Animate segments on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimProgress(1), 100);
    return () => clearTimeout(timer);
  }, []);

  // Compute segment arc data
  const segmentData = useMemo(() => {
    const gap = 0.02; // small gap between segments
    const gapOffset = segments.length > 1 ? gap * circumference : 0;

    // Use reduce to accumulate offsets immutably
    const withAccumulated = segments.reduce<Array< typeof segments[0] & { acc: number }>>(
      (arr, seg) => {
        const prevAcc = arr.length > 0 ? arr[arr.length - 1].acc : 0;
        const fraction = total > 0 ? seg.value / total : 0;
        return [...arr, { ...seg, acc: prevAcc + fraction }];
      },
      [],
    );

    return withAccumulated.map((seg, i) => {
      const fraction = total > 0 ? seg.value / total : 0;
      const segLength = fraction * circumference * animProgress;
      const offset = seg.acc * circumference * animProgress - fraction * circumference * animProgress;

      return {
        ...seg,
        fraction,
        dashArray: `${Math.max(0, segLength - gapOffset)} ${circumference}`,
        dashOffset: -offset,
        percentage: total > 0 ? Math.round((seg.value / total) * 100) : 0,
      };
    });
  }, [segments, total, circumference, animProgress]);

  const handleMouseEnter = useCallback(
    (index: number, seg: (typeof segmentData)[0], e: React.MouseEvent<SVGCircleElement>) => {
      setHoveredIndex(index);
      const svgRect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect();
      const x = e.clientX - svgRect.left;
      const y = e.clientY - svgRect.top;
      setTooltip({
        visible: true,
        x,
        y,
        label: seg.label,
        value: seg.value,
        percentage: seg.percentage,
        color: seg.color,
      });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Chart Container */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
          />

          {/* Segments */}
          {segmentData.map((seg, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={hoveredIndex === i ? radius + 4 : radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredIndex === i ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="round"
              className="cursor-pointer"
              style={{
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.4 : 1,
                filter: hoveredIndex === i ? `drop-shadow(0 0 8px ${seg.color}66)` : 'none',
              }}
              onMouseEnter={(e) => handleMouseEnter(i, seg, e)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </svg>

        {/* Center Text */}
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <span
                className="text-2xl font-bold text-white tabular-nums"
                style={{ animation: 'fade-in 0.6s 0.4s both' }}
              >
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span
                className="text-[11px] text-slate-400 mt-0.5"
                style={{ animation: 'fade-in 0.6s 0.6s both' }}
              >
                {centerLabel}
              </span>
            )}
          </div>
        )}

        {/* Tooltip */}
        {tooltip.visible && (
          <div
            className="absolute pointer-events-none z-10 rounded-lg px-3 py-2 text-xs shadow-xl border"
            style={{
              left: tooltip.x,
              top: tooltip.y - 10,
              transform: 'translate(-50%, -100%)',
              backgroundColor: 'rgba(20,20,28,0.95)',
              borderColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              animation: 'scale-in 0.15s ease-out',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tooltip.color }}
              />
              <span className="font-semibold text-white">{tooltip.label}</span>
            </div>
            <div className="text-slate-400">
              {tooltip.value} طالب &middot;{' '}
              <span className="text-white font-bold">{tooltip.percentage}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 cursor-pointer group"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span
              className="h-2.5 w-2.5 rounded-sm transition-transform duration-200 group-hover:scale-125"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-[11px] text-slate-500 group-hover:text-slate-300 transition-colors">
              {seg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
