'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AreaDataPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: AreaDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  animate?: boolean;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  value: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AreaChart({
  data,
  width = 500,
  height = 200,
  color = '#D4A574',
  showDots = true,
  animate = true,
}: AreaChartProps) {
  const [animProgress, setAnimProgress] = useState(animate ? 0 : 1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    label: '',
    value: 0,
  });

  // Chart area padding
  const padding = { top: 20, right: 10, bottom: 30, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Animate on mount (only when animate is true)
  useEffect(() => {
    if (!animate) return;
    const timer = setTimeout(() => setAnimProgress(1), 200);
    return () => clearTimeout(timer);
  }, [animate]);

  const maxVal = useMemo(
    () => Math.max(...data.map((d) => d.value), 1),
    [data],
  );

  // Map data to x,y coordinates
  const coords = useMemo(() => {
    return data.map((d, i) => ({
      x: padding.left + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2),
      y:
        padding.top +
        chartH -
        (d.value / maxVal) * chartH * animProgress,
      rawY: padding.top + chartH - (d.value / maxVal) * chartH,
      label: d.label,
      value: d.value,
    }));
  }, [data, maxVal, chartW, chartH, padding, animProgress]);

  // Generate smooth bezier curve path using Catmull-Rom to Bezier conversion
  const linePath = useMemo(() => {
    if (coords.length < 2) return '';

    const points = coords;

    // Catmull-Rom to Cubic Bezier
    const tension = 0.3;
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  }, [coords]);

  // Area fill path (line path closed at bottom)
  const areaPath = useMemo(() => {
    if (!linePath || coords.length < 2) return '';
    const lastPoint = coords[coords.length - 1];
    const firstPoint = coords[0];
    return `${linePath} L ${lastPoint.x} ${padding.top + chartH} L ${firstPoint.x} ${padding.top + chartH} Z`;
  }, [linePath, coords, padding, chartH]);

  // Grid lines
  const gridLines = useMemo(() => {
    const lines: { y: number; value: number }[] = [];
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const y = padding.top + (i / gridCount) * chartH;
      const value = Math.round(maxVal - (i / gridCount) * maxVal);
      lines.push({ y, value });
    }
    return lines;
  }, [chartH, maxVal, padding]);

  const handleDotHover = useCallback(
    (index: number, e: React.MouseEvent<SVGCircleElement>) => {
      setHoveredIndex(index);
      const svgRect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect();
      setTooltip({
        visible: true,
        x: coords[index].x,
        y: coords[index].rawY - 12,
        label: coords[index].label,
        value: coords[index].value,
      });
    },
    [coords],
  );

  const handleDotLeave = useCallback(() => {
    setHoveredIndex(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  // Gradient ID (unique per color to avoid conflicts)
  const gradientId = `area-gradient-${color.replace('#', '')}`;

  return (
    <div className="w-full">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="60%" stopColor={color} stopOpacity="0.1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>

          {/* Glow filter for line */}
          <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid Lines */}
        {gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={width - padding.right}
              y2={line.y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
              strokeDasharray={i === gridLines.length - 1 ? 'none' : '4 4'}
            />
            {/* Y-axis value labels */}
            {i > 0 && i < gridLines.length && (
              <text
                x={width - padding.right + 2}
                y={line.y + 3}
                textAnchor="end"
                fill="rgba(255,255,255,0.15)"
                fontSize="8"
              >
                {line.value}
              </text>
            )}
          </g>
        ))}

        {/* Area Fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill={`url(#${gradientId})`}
            style={{
              transition: 'opacity 0.5s ease',
            }}
          />
        )}

        {/* Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#glow-${gradientId})`}
            style={{
              transition: 'opacity 0.5s ease',
            }}
          />
        )}

        {/* Hover vertical line */}
        {hoveredIndex !== null && (
          <line
            x1={coords[hoveredIndex].x}
            y1={padding.top}
            x2={coords[hoveredIndex].x}
            y2={padding.top + chartH}
            stroke={color}
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.3"
            style={{
              transition: 'opacity 0.2s ease',
            }}
          />
        )}

        {/* Data Points */}
        {showDots &&
          coords.map((coord, i) => (
            <g key={i}>
              {/* Invisible hit area */}
              <circle
                cx={coord.x}
                cy={coord.rawY}
                r={16}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={(e) => handleDotHover(i, e)}
                onMouseLeave={handleDotLeave}
              />
              {/* Outer glow on hover */}
              {hoveredIndex === i && (
                <circle
                  cx={coord.x}
                  cy={coord.rawY}
                  r={10}
                  fill={color}
                  opacity="0.15"
                  style={{ animation: 'scale-in 0.15s ease-out' }}
                />
              )}
              {/* Dot */}
              <circle
                cx={coord.x}
                cy={coord.rawY}
                r={hoveredIndex === i ? 5 : 3}
                fill={color}
                stroke="#1A1A24"
                strokeWidth="2"
                className="cursor-pointer"
                style={{
                  transition: 'r 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  filter:
                    hoveredIndex === i ? `drop-shadow(0 0 6px ${color})` : 'none',
                }}
                onMouseEnter={(e) => handleDotHover(i, e)}
                onMouseLeave={handleDotLeave}
              />
            </g>
          ))}

        {/* Tooltip */}
        {tooltip.visible && (
          <g>
            <rect
              x={tooltip.x - 32}
              y={tooltip.y - 24}
              width={64}
              height={22}
              rx={6}
              fill="rgba(20,20,28,0.95)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
              style={{ animation: 'scale-in 0.15s ease-out' }}
            />
            <text
              x={tooltip.x}
              y={tooltip.y - 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="11"
              fontWeight="bold"
            >
              {tooltip.value}%
            </text>
          </g>
        )}

        {/* X-Axis Labels */}
        {coords.map((coord, i) => (
          <text
            key={i}
            x={coord.x}
            y={height - 6}
            textAnchor="middle"
            fill={
              hoveredIndex === i
                ? color
                : 'rgba(255,255,255,0.35)'
            }
            fontSize="10"
            fontWeight={hoveredIndex === i ? '600' : '400'}
            style={{
              transition: 'fill 0.2s ease',
            }}
          >
            {coord.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
