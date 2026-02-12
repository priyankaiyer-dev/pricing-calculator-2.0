'use client';

/**
 * Deal Health Score: vertically stacked bar with black reference line at blended discount.
 * Label on the right: "[Color]: XX% discount", wraps to fit blue box, text aligned right.
 */
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';

const CHART_MAX = 60;
const ZONE_GREEN_MAX = 30;
const ZONE_ORANGE_MAX = 42;

const STACK_GREEN = 30;
const STACK_ORANGE = 12;
const STACK_RED = 18;

const CHART_DATA = [
  { name: 'Score', green: STACK_GREEN, orange: STACK_ORANGE, red: STACK_RED },
];

const COLORS = {
  green: '#16a34a',
  orange: '#ea580c',
  red: '#dc2626',
};

function getZoneName(discount: number): string {
  if (discount <= ZONE_GREEN_MAX) return 'Green';
  if (discount <= ZONE_ORANGE_MAX) return 'Orange';
  return 'Red';
}

const CHART_RIGHT_MARGIN = 56;

function ReferenceLineLabel({
  viewBox,
  labelText,
}: {
  viewBox?: { x?: number; y?: number; width?: number; height?: number };
  labelText: string;
}) {
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;
  const plotWidth = viewBox?.width ?? 200;
  // Place label in the right margin so it sits all the way to the right of the blue box
  const labelWidth = CHART_RIGHT_MARGIN - 4;
  const labelX = x + plotWidth + 2;

  return (
    <g>
      <foreignObject
        x={labelX}
        y={y - 20}
        width={labelWidth}
        height={40}
        style={{ overflow: 'visible' }}
      >
        <div
          className="text-right text-[10px] font-medium text-slate-800 leading-tight break-words w-full"
          style={{ lineHeight: 1.35 }}
          xmlns="http://www.w3.org/1999/xhtml"
        >
          {labelText}
        </div>
      </foreignObject>
    </g>
  );
}

export default function DealHealthScoreChart({
  blendedDiscount,
}: {
  blendedDiscount: number;
}) {
  const refY = Math.min(blendedDiscount, CHART_MAX);
  const colorName = getZoneName(refY);
  const labelText = `${colorName}: ${blendedDiscount.toFixed(1)}% discount`;

  return (
    <div className="min-h-[200px] w-full flex-1 flex flex-col">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={CHART_DATA}
          margin={{ top: 8, right: CHART_RIGHT_MARGIN, left: 0, bottom: 0 }}
        >
          <XAxis dataKey="name" hide />
          <YAxis
            type="number"
            domain={[0, CHART_MAX]}
            orientation="left"
            tick={{ fontSize: 10, fill: '#475569' }}
            width={28}
            axisLine={false}
            tickLine={false}
          />
          <Bar
            dataKey="green"
            stackId="a"
            fill={COLORS.green}
            radius={[0, 0, 4, 4]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="orange"
            stackId="a"
            fill={COLORS.orange}
            radius={0}
            isAnimationActive={false}
          />
          <Bar
            dataKey="red"
            stackId="a"
            fill={COLORS.red}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <ReferenceLine
            y={refY}
            stroke="#111827"
            strokeWidth={2}
            isFront
            label={(props: { viewBox?: { x?: number; y?: number; width?: number; height?: number } }) => (
              <ReferenceLineLabel {...props} labelText={labelText} />
            )}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
