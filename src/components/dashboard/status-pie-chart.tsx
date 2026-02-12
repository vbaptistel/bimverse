"use client";

import { Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrencyBrl } from "@/shared/domain/currency";
import type { ProposalStatus } from "@/shared/domain/types";

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export interface StatusPieChartDatum {
  status: ProposalStatus;
  label: string;
  valueBrl: number;
  count: number;
  fill: string;
}

export function StatusPieChart({ data }: { data: StatusPieChartDatum[] }) {
  const chartConfig = data.reduce((accumulator, item) => {
    accumulator[item.status] = {
      label: item.label,
      color: item.fill,
    };

    return accumulator;
  }, {} as ChartConfig);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[22rem] w-full max-w-[30rem]"
    >
      <PieChart margin={{ top: 24, right: 24, bottom: 24, left: 24 }}>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(_value, _name, item) => {
                const payload = item.payload as StatusPieChartDatum;

                return (
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-muted-foreground">
                      {payload.label} ({payload.count})
                    </span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatCurrencyBrl(payload.valueBrl)}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        <Pie
          data={data}
          dataKey="valueBrl"
          nameKey="status"
          outerRadius={112}
          stroke="hsl(var(--background))"
          strokeWidth={3}
          labelLine={false}
          label={({
            cx = 0,
            cy = 0,
            midAngle = 0,
            outerRadius = 0,
            percent = 0,
            payload,
          }) => {
            const slice = payload as StatusPieChartDatum;
            const radian = Math.PI / 180;
            const labelRadius = Number(outerRadius) + 14;
            const x = Number(cx) + labelRadius * Math.cos(-midAngle * radian);
            const y = Number(cy) + labelRadius * Math.sin(-midAngle * radian);
            const textAnchor = x >= Number(cx) ? "start" : "end";

            return (
              <text x={x} y={y} fill="currentColor" textAnchor={textAnchor}>
                <tspan x={x} dy="0" className="fill-foreground text-[12px] font-medium">
                  {slice.label} ({slice.count})
                </tspan>
                <tspan x={x} dy="1.2em" className="fill-muted-foreground text-[11px]">
                  {formatCurrencyBrl(slice.valueBrl)} • {percentFormatter.format(percent)}
                </tspan>
              </text>
            );
          }}
        />
      </PieChart>
    </ChartContainer>
  );
}
