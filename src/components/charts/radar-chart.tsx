'use client';

import { useState, useEffect, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RadarPoint {
  label: string;
  value: number; // 0-100
}

interface RadarChartProps {
  points: RadarPoint[];
  size?: number;
  color?: string;
  maxValue?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute point position on the radar grid */
function computePointPos(
  index: number,
  r: number,
  center: number,
  startAngle: number,
  angleStep: number,
) {
  const angle = startAngle + index * angleStep;
  return {
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RadarChart({
  points,
  size = 220,
  color = '#D4A574',
  maxValue = 100,
}: RadarChartProps) {
  const [animProgress, setAnimProgress] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const center = size / 2;
  const maxRadius = size / 2 - 36; // leave room for labels
  const levels = 5;
  const count = points.length;
  const angleStep = count > 0 ? (2 * Math.PI) / count : 0;
  // Start from top (-90°) and go clockwise
  const startAngle = -Math.PI / 2;

  // Animate on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimProgress(1), 150);
    return () => clearTimeout(timer);
  }, []);

  // Generate grid polygons (5 concentric levels)
  const gridLevels = useMemo(() => {
    return Array.from({ length: levels }, (_, level) => {
      const r = ((level + 1) / levels) * maxRadius;
      const vertices = points.map((_, i) =>
        computePointPos(i, r, center, startAngle, angleStep),
      );
      return { r, vertices, label: `${Math.round(((level + 1) / levels) * maxValue)}` };
    });
  }, [points, maxRadius, maxValue, center, startAngle, angleStep]);

  // Generate data polygon
  const dataPolygon = useMemo(() => {
    return points.map((p, i) => {
      const r = (p.value / maxValue) * maxRadius * animProgress;
      return computePointPos(i, r, center, startAngle, angleStep);
    });
  }, [points, maxValue, maxRadius, animProgress, center, startAngle, angleStep]);

  // Generate data polygon path
  const dataPath = dataPolygon.map((p) => `${p.x},${p.y}`).join(' ');

  // Generate grid lines from center to vertices
  const axisLines = points.map((_, i) => {
    const end = computePointPos(i, maxRadius, center, startAngle, angleStep);
    return { x1: center, y1: center, x2: end.x, y2: end.y };
  });

  // Label positions (slightly outside the outermost grid)
  const labelPositions = points.map((_, i) => {
    const r = maxRadius + 18;
    return computePointPos(i, r, center, startAngle, angleStep);
  });

  return (
    <div className="flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Grid Polygons */}
        {gridLevels.map((level, li) => (
          <polygon
            key={li}
            points={level.vertices.map((v) => `${v.x},${v.y}`).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}

        {/* Axis Lines (from center to each vertex) */}
        {axisLines.map((line, i) => (
          <line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}

        {/* Grid level labels (first and last only for cleanliness) */}
        {gridLevels.map((level, li) => {
          if (li === 0 || li === levels - 1) {
            const pos = computePointPos(0, level.r, center, startAngle, angleStep);
            return (
              <text
                key={`label-${li}`}
                x={pos.x + 8}
                y={pos.y + 3}
                fill="rgba(255,255,255,0.15)"
                fontSize="8"
                textAnchor="start"
              >
                {level.label}
              </text>
            );
          }
          return null;
        })}

        {/* Data Polygon Fill */}
        <polygon
          points={dataPath}
          fill={`${color}22`}
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          style={{
            transition: 'all 0.3s ease',
            filter: `drop-shadow(0 0 12px ${color}33)`,
          }}
        />

        {/* Data Points (circles at vertices) */}
        {dataPolygon.map((p, i) => (
          <g key={i}>
            {/* Invisible larger hit area */}
            <circle
              cx={p.x}
              cy={p.y}
              r={14}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            {/* Outer glow ring on hover */}
            {hoveredPoint === i && (
              <circle
                cx={p.x}
                cy={p.y}
                r={7}
                fill="none"
                stroke={color}
                strokeWidth="2"
                opacity="0.3"
                style={{
                  animation: 'scale-in 0.2s ease-out',
                }}
              />
            )}
            {/* Point dot */}
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredPoint === i ? 5 : 3.5}
              fill={color}
              stroke="#1A1A24"
              strokeWidth="2"
              className="cursor-pointer"
              style={{
                transition: 'r 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                filter: hoveredPoint === i ? `drop-shadow(0 0 6px ${color})` : 'none',
              }}
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          </g>
        ))}

        {/* Labels at each vertex */}
        {points.map((point, i) => {
          const pos = labelPositions[i];
          // Determine text-anchor based on position relative to center
          const angle = startAngle + i * angleStep;
          const isRight = Math.cos(angle) > 0.1;
          const isLeft = Math.cos(angle) < -0.1;
          const isTop = Math.sin(angle) < -0.1;
          const isBottom = Math.sin(angle) > 0.1;

          let anchor = 'middle';
          if (isRight) anchor = 'start';
          else if (isLeft) anchor = 'end';

          let dy = 0;
          if (isTop) dy = -2;
          else if (isBottom) dy = 10;

          return (
            <text
              key={i}
              x={pos.x}
              y={pos.y + dy}
              textAnchor={anchor}
              dominantBaseline="middle"
              fill={hoveredPoint === i ? '#D4A574' : 'rgba(255,255,255,0.5)'}
              fontSize="10"
              fontWeight={hoveredPoint === i ? '600' : '400'}
              style={{
                transition: 'fill 0.2s ease',
                fontFamily: 'inherit',
              }}
            >
              {point.label}
            </text>
          );
        })}

        {/* Tooltip for hovered point */}
        {hoveredPoint !== null && (
          <g>
            <rect
              x={dataPolygon[hoveredPoint].x - 28}
              y={dataPolygon[hoveredPoint].y - 28}
              width={56}
              height={22}
              rx={6}
              fill="rgba(20,20,28,0.95)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
              style={{
                animation: 'scale-in 0.15s ease-out',
              }}
            />
            <text
              x={dataPolygon[hoveredPoint].x}
              y={dataPolygon[hoveredPoint].y - 17}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="11"
              fontWeight="bold"
            >
              {points[hoveredPoint].value}%
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
