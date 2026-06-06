import { formatCompactNumber, formatMarketPrice, getMarketStats } from "@/lib/market";
import type { MarketPoint, MarketQuote } from "@/types/market";

function getPointClose(point: MarketPoint) {
  return point.close ?? point.price;
}

function getPointOpen(point: MarketPoint, previous?: MarketPoint) {
  return point.open ?? (previous ? getPointClose(previous) : getPointClose(point));
}

function getPointHigh(point: MarketPoint, open: number, close: number) {
  return point.high ?? Math.max(open, close);
}

function getPointLow(point: MarketPoint, open: number, close: number) {
  return point.low ?? Math.min(open, close);
}

function formatAxisPrice(value: number) {
  if (value >= 1000) {
    return formatCompactNumber(value);
  }

  return value.toFixed(value >= 100 ? 2 : 3);
}

function buildAveragePath(points: MarketPoint[], priceToY: (price: number) => number, xForIndex: (index: number) => number) {
  const values = points.map(getPointClose);

  return values
    .map((_, index) => {
      if (index < 4) {
        return null;
      }

      const slice = values.slice(index - 4, index + 1);
      const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;

      return `${index === 4 ? "M" : "L"} ${xForIndex(index).toFixed(2)} ${priceToY(average).toFixed(2)}`;
    })
    .filter(Boolean)
    .join(" ");
}

export function MarketChart({
  compact = false,
  quote,
  zh = false,
}: Readonly<{
  compact?: boolean;
  quote: MarketQuote;
  zh?: boolean;
}>) {
  const points = quote.points.slice(-30);
  const stats = getMarketStats(points);

  if (!stats || points.length < 2) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
        {zh ? "暂无足够行情数据。" : "Not enough market data yet."}
      </div>
    );
  }

  const width = 360;
  const height = compact ? 176 : 220;
  const left = 10;
  const right = 58;
  const top = 14;
  const priceHeight = compact ? 108 : 142;
  const volumeTop = top + priceHeight + 18;
  const volumeHeight = compact ? 26 : 34;
  const plotWidth = width - left - right;
  const highs = points.map((point, index) => {
    const open = getPointOpen(point, points[index - 1]);
    const close = getPointClose(point);
    return getPointHigh(point, open, close);
  });
  const lows = points.map((point, index) => {
    const open = getPointOpen(point, points[index - 1]);
    const close = getPointClose(point);
    return getPointLow(point, open, close);
  });
  const rawHigh = Math.max(...highs);
  const rawLow = Math.min(...lows);
  const padding = (rawHigh - rawLow || Math.max(rawHigh * 0.01, 1)) * 0.08;
  const high = rawHigh + padding;
  const low = rawLow - padding;
  const priceRange = high - low || 1;
  const volumes = points.map((point) => point.volume ?? 0);
  const maxVolume = Math.max(...volumes, 1);
  const step = plotWidth / points.length;
  const candleWidth = Math.max(3, Math.min(8, step * 0.58));
  const priceToY = (price: number) => top + ((high - price) / priceRange) * priceHeight;
  const xForIndex = (index: number) => left + index * step + step / 2;
  const averagePath = buildAveragePath(points, priceToY, xForIndex);
  const gridValues = [high - padding, (high + low) / 2, low + padding];
  const isUp = stats.absolute >= 0;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold">{formatMarketPrice(stats.latestClose, quote.currency)}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {zh ? "最新" : "Last"} {stats.latestDate} · {quote.provider}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold ${isUp ? "text-teal-700" : "text-red-700"}`}>
            {isUp ? "+" : ""}
            {formatMarketPrice(stats.absolute, quote.currency)} ({isUp ? "+" : ""}
            {stats.percent.toFixed(2)}%)
          </p>
          <p className="mt-1 text-xs text-zinc-500">{zh ? "日涨跌" : "Daily change"}</p>
        </div>
      </div>

      <svg
        aria-label={zh ? "近 30 天 K 线图" : "30 day candlestick chart"}
        className={`w-full overflow-visible rounded-md border border-zinc-200 bg-zinc-50 ${compact ? "h-44" : "h-56"}`}
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <rect fill="#fafafa" height={height} width={width} x="0" y="0" />
        {gridValues.map((value) => {
          const y = priceToY(value);

          return (
            <g key={value.toFixed(4)}>
              <line stroke="#e4e4e7" strokeWidth="0.7" x1={left} x2={width - right + 4} y1={y} y2={y} />
              <text fill="#71717a" fontSize="8" x={width - right + 8} y={y + 3}>
                {formatAxisPrice(value)}
              </text>
            </g>
          );
        })}

        {points.map((point, index) => {
          const previous = points[index - 1];
          const open = getPointOpen(point, previous);
          const close = getPointClose(point);
          const candleHigh = getPointHigh(point, open, close);
          const candleLow = getPointLow(point, open, close);
          const x = xForIndex(index);
          const yOpen = priceToY(open);
          const yClose = priceToY(close);
          const yHigh = priceToY(candleHigh);
          const yLow = priceToY(candleLow);
          const up = close >= open;
          const color = up ? "#0f766e" : "#b91c1c";
          const bodyY = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(1.2, Math.abs(yClose - yOpen));
          const volumeHeightValue = ((point.volume ?? 0) / maxVolume) * volumeHeight;

          return (
            <g key={`${point.date}-${index}`}>
              <line stroke={color} strokeWidth="1.2" x1={x} x2={x} y1={yHigh} y2={yLow} />
              <rect
                fill={up ? "#f0fdfa" : "#fef2f2"}
                height={bodyHeight}
                stroke={color}
                strokeWidth="1"
                width={candleWidth}
                x={x - candleWidth / 2}
                y={bodyY}
              />
              <rect
                fill={color}
                height={volumeHeightValue}
                opacity="0.28"
                width={Math.max(1.5, candleWidth * 0.8)}
                x={x - (Math.max(1.5, candleWidth * 0.8)) / 2}
                y={volumeTop + volumeHeight - volumeHeightValue}
              />
            </g>
          );
        })}

        {averagePath ? (
          <path d={averagePath} fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="1.6" />
        ) : null}
        <line stroke="#d4d4d8" strokeWidth="0.8" x1={left} x2={width - right + 4} y1={volumeTop} y2={volumeTop} />
        <text fill="#2563eb" fontSize="8" x={left} y={top + 10}>
          MA5
        </text>
      </svg>

      {!compact ? (
        <dl className="grid gap-2 text-xs text-zinc-600 sm:grid-cols-4">
          <div>
            <dt>{zh ? "今开" : "Open"}</dt>
            <dd className="font-semibold text-zinc-900">{formatMarketPrice(stats.open, quote.currency)}</dd>
          </div>
          <div>
            <dt>{zh ? "区间高" : "30D high"}</dt>
            <dd className="font-semibold text-zinc-900">{formatMarketPrice(stats.high, quote.currency)}</dd>
          </div>
          <div>
            <dt>{zh ? "区间低" : "30D low"}</dt>
            <dd className="font-semibold text-zinc-900">{formatMarketPrice(stats.low, quote.currency)}</dd>
          </div>
          <div>
            <dt>{zh ? "成交额" : "Volume"}</dt>
            <dd className="font-semibold text-zinc-900">{formatCompactNumber(stats.volume)}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
