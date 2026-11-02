import React, { useState, useRef, useMemo } from 'react';

interface StockChartProps {
  history: number[];
  color: string;
  chartType?: 'area' | 'candle';
  showVolume?: boolean;
  interactive?: boolean;
  onHoverPrice?: (price: number | null, index: number | null) => void;
}

export const StockChart: React.FC<StockChartProps> = ({ 
  history, 
  color, 
  chartType = 'area', 
  showVolume = false,
  interactive = false,
  onHoverPrice
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!history || history.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600 font-mono">NO MARKET DATA</div>;
  }

  const min = Math.min(...history) * 0.995;
  const max = Math.max(...history) * 1.005;
  const range = max - min || 0.1;
  
  const width = 300;
  const height = 120;
  const volumeHeight = showVolume ? 25 : 0;
  const chartHeight = height - volumeHeight;

  const divisor = history.length > 1 ? history.length - 1 : 1;

  // Points for Area Chart
  const points = history.map((price, i) => {
    const x = (i / divisor) * width;
    const y = chartHeight - ((price - min) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = history.length === 1 
    ? `0,${chartHeight} 0,${chartHeight/2} ${width},${chartHeight/2} ${width},${chartHeight}`
    : `0,${chartHeight} ${points} ${width},${chartHeight}`;

  const strokePoints = history.length === 1
    ? `0,${chartHeight/2} ${width},${chartHeight/2}`
    : points;

  // Generate Candlestick Data for Candle Mode
  const candleData = useMemo(() => {
    if (chartType !== 'candle') return [];
    const candles = [];
    const chunkSize = Math.max(1, Math.floor(history.length / 20));
    for (let i = 0; i < history.length; i += chunkSize) {
      const slice = history.slice(i, i + chunkSize);
      if (slice.length === 0) continue;
      const open = slice[0];
      const close = slice[slice.length - 1];
      const high = Math.max(...slice);
      const low = Math.min(...slice);
      candles.push({ open, close, high, low, isUp: close >= open });
    }
    return candles;
  }, [history, chartType]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(xRatio * (history.length - 1));
    setHoverIndex(idx);
    if (onHoverPrice) onHoverPrice(history[idx], idx);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
    if (onHoverPrice) onHoverPrice(null, null);
  };

  const hoveredPrice = hoverIndex !== null ? history[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? (hoverIndex / divisor) * width : null;
  const hoverY = hoveredPrice !== null ? chartHeight - ((hoveredPrice - min) / range) * chartHeight : null;

  return (
    <div 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`w-full h-full relative p-1 transition-all duration-300 ${interactive ? 'cursor-crosshair touch-none' : ''}`}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* High & Low Reference Dashed Lines */}
        {interactive && (
          <>
            <line x1="0" y1="4" x2={width} y2="4" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
            <line x1="0" y1={chartHeight - 4} x2={width} y2={chartHeight - 4} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
          </>
        )}

        {/* Volume Bars */}
        {showVolume && history.map((price, i) => {
          const x = (i / divisor) * width;
          const prev = i > 0 ? history[i - 1] : price;
          const isUp = price >= prev;
          const volRatio = Math.min(1, Math.abs(price - prev) / (range * 0.3) + 0.2);
          const barHeight = volRatio * volumeHeight;
          const barY = height - barHeight;
          return (
            <rect 
              key={`vol-${i}`}
              x={x - 1.5}
              y={barY}
              width="3"
              height={barHeight}
              fill={isUp ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}
              rx="1"
            />
          );
        })}

        {chartType === 'area' ? (
          <>
            <polyline
              fill={`url(#grad-${color.replace('#', '')})`}
              points={areaPoints}
              stroke="none"
              className="transition-all duration-500"
            />
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2.8"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={strokePoints}
              className="transition-all duration-500"
            />
          </>
        ) : (
          candleData.map((c, i) => {
            const candleDivisor = candleData.length > 1 ? candleData.length - 1 : 1;
            const cx = (i / candleDivisor) * (width - 20) + 10;
            const topY = chartHeight - ((c.high - min) / range) * chartHeight;
            const bottomY = chartHeight - ((c.low - min) / range) * chartHeight;
            const openY = chartHeight - ((c.open - min) / range) * chartHeight;
            const closeY = chartHeight - ((c.close - min) / range) * chartHeight;
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(3, Math.abs(closeY - openY));
            const cColor = c.isUp ? '#10b981' : '#ef4444';

            return (
              <g key={`candle-${i}`}>
                <line x1={cx} y1={topY} x2={cx} y2={bottomY} stroke={cColor} strokeWidth="1.2" />
                <rect 
                  x={cx - 3} 
                  y={bodyTop} 
                  width="6" 
                  height={bodyHeight} 
                  fill={cColor} 
                  stroke={cColor}
                  strokeWidth="0.8"
                  rx="1" 
                />
              </g>
            );
          })
        )}

        {interactive && hoverX !== null && hoverY !== null && (
          <g>
            <line 
              x1={hoverX} 
              y1="0" 
              x2={hoverX} 
              y2={chartHeight} 
              stroke="rgba(255,255,255,0.4)" 
              strokeDasharray="2 2" 
              strokeWidth="1" 
            />
            <circle cx={hoverX} cy={hoverY} r="5" fill="#ffffff" stroke={color} strokeWidth="3" filter="url(#glow)" />
          </g>
        )}
      </svg>

      {interactive && hoveredPrice !== null && (
        <div 
          className="absolute top-2 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono font-bold shadow-lg flex items-center gap-2 pointer-events-none"
        >
          <span className="text-zinc-400">POINT:</span>
          <span className="text-white">${hoveredPrice.toFixed(2)}</span>
          <span className={`text-[9px] ${hoveredPrice >= history[0] ? 'text-emerald-400' : 'text-red-400'}`}>
            {hoveredPrice >= history[0] ? '+' : ''}{(((hoveredPrice - history[0]) / history[0]) * 100).toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
};
