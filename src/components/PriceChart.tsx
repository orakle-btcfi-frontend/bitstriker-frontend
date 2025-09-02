import { useMemo } from 'react';

interface PriceChartProps {
  currentPrice: number;
  className?: string;
}

export const PriceChart = ({ currentPrice, className = "" }: PriceChartProps) => {
  // Generate sample 24h price data
  const chartData = useMemo(() => {
    const points = 24;
    const data = [];
    const basePrice = currentPrice;
    const volatility = 0.05; // 5% volatility
    
    for (let i = 0; i < points; i++) {
      const randomChange = (Math.random() - 0.5) * volatility;
      const price = basePrice * (1 + randomChange);
      data.push({
        time: i,
        price: price,
      });
    }
    
    // Ensure the last point is the current price
    data[data.length - 1].price = currentPrice;
    
    return data;
  }, [currentPrice]);

  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const priceRange = maxPrice - minPrice;

  // Generate SVG path for the line
  const pathData = chartData.map((point, index) => {
    const x = (index / (chartData.length - 1)) * 100;
    const y = 100 - ((point.price - minPrice) / priceRange) * 100;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate SVG path for the filled area
  const fillPathData = `${pathData} L 100 100 L 0 100 Z`;

  return (
    <div className={`h-20 w-full ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--trading-yellow))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--trading-yellow))" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Filled area under the line */}
        <path
          d={fillPathData}
          fill="url(#priceGradient)"
          className="opacity-80"
        />
        
        {/* Price line */}
        <path
          d={pathData}
          fill="none"
          stroke="hsl(var(--trading-yellow))"
          strokeWidth="2"
          className="drop-shadow-sm"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};