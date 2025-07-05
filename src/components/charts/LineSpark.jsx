import React from 'react';

// Simple SVG line graph for 7 points
export default function LineSpark({ data = [], width = 60, height = 18, color = '#1976d2' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    // Invert y axis: higher value = lower y
    const y = height - ((v - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
      {/* Optionally, draw circles at each point */}
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / (max - min || 1)) * height;
        return <circle key={i} cx={x} cy={y} r="1.8" fill={color} />;
      })}
    </svg>
  );
}
