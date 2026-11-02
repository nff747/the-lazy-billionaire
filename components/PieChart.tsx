
import React from 'react';

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
}

export const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const total = data.reduce((acc, cur) => acc + cur.value, 0);
  let accumulatedAngle = 0;

  // Safe radius for SVG
  const radius = 50;
  const size = 100;
  const center = 50;

  if (total === 0) {
      return (
        <div className="w-32 h-32 rounded-full border-4 border-zinc-800 flex items-center justify-center">
            <span className="text-zinc-700 text-[10px]">EMPTY</span>
        </div>
      );
  }

  return (
    <div className="relative w-32 h-32">
      <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 w-full h-full overflow-visible">
        {data.map((slice, i) => {
          if (slice.value <= 0) return null;

          const percentage = slice.value / total;
          const angle = percentage * 360;
          
          // Calculate SVG path
          const x1 = center + radius * Math.cos((Math.PI * accumulatedAngle) / 180);
          const y1 = center + radius * Math.sin((Math.PI * accumulatedAngle) / 180);
          
          const endAngle = accumulatedAngle + angle;
          const x2 = center + radius * Math.cos((Math.PI * endAngle) / 180);
          const y2 = center + radius * Math.sin((Math.PI * endAngle) / 180);

          const largeArcFlag = percentage > 0.5 ? 1 : 0;

          // If it's a full circle (100%), draw a circle
          const pathData = percentage >= 0.999 
            ? `M ${center}, ${center} m -${radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`
            : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          accumulatedAngle += angle;

          return (
            <path
              key={i}
              d={pathData}
              fill={slice.color}
              stroke="#050505"
              strokeWidth="2"
            />
          );
        })}
      </svg>
      {/* Hollow Center for Donut Effect */}
      <div className="absolute inset-0 m-auto w-16 h-16 bg-[#050505] rounded-full flex items-center justify-center">
          <div className="text-[8px] font-black text-zinc-500">ASSETS</div>
      </div>
    </div>
  );
};
