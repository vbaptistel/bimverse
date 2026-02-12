"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrencyBrl } from "@/shared/domain/currency";

type GroupByMode = "status" | "customer";

export interface ValueOverTimeSeriesPoint {
  period: string;
  label: string;
  values: Record<string, number>;
}

export interface ValueOverTimeSeriesSegment {
  key: string;
  label: string;
  color: string;
}

export interface ValueOverTimeSeries {
  points: ValueOverTimeSeriesPoint[];
  segments: ValueOverTimeSeriesSegment[];
  emptyMessage: string;
}

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatCompactCurrencyBrl(value: number): string {
  if (value === 0) {
    return "R$ 0";
  }

  return compactCurrencyFormatter.format(value);
}

export function ValueOverTimeAreaChart({
  byStatus,
  byCustomer,
}: {
  byStatus: ValueOverTimeSeries;
  byCustomer: ValueOverTimeSeries;
}) {
  const [groupBy, setGroupBy] = useState<GroupByMode>("status");
  const activeSeries = groupBy === "status" ? byStatus : byCustomer;

  const chartConfig = useMemo<ChartConfig>(() => {
    return activeSeries.segments.reduce((accumulator, segment) => {
      accumulator[segment.key] = {
        label: segment.label,
        color: segment.color,
      };

      return accumulator;
    }, {} as ChartConfig);
  }, [activeSeries.segments]);

  const segmentLabelMap = useMemo(() => {
    return new Map(activeSeries.segments.map((segment) => [segment.key, segment.label]));
  }, [activeSeries.segments]);

  const chartData = useMemo<Array<Record<string, number | string>>>(() => {
    return activeSeries.points.map((point) => {
      const values = activeSeries.segments.reduce<Record<string, number>>((accumulator, segment) => {
        accumulator[segment.key] = point.values[segment.key] ?? 0;
        return accumulator;
      }, {});

      return {
        period: point.period,
        label: point.label,
        ...values,
      };
    });
  }, [activeSeries.points, activeSeries.segments]);

  const hasData =
    activeSeries.segments.length > 0 &&
    chartData.some((point) =>
      activeSeries.segments.some((segment) => Number(point[segment.key] ?? 0) > 0),
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Agrupar por</p>
        <ButtonGroup>
          <Button
            type="button"
            size="sm"
            variant={groupBy === "status" ? "default" : "outline"}
            onClick={() => setGroupBy("status")}
          >
            Status
          </Button>
          <Button
            type="button"
            size="sm"
            variant={groupBy === "customer" ? "default" : "outline"}
            onClick={() => setGroupBy("customer")}
          >
            Cliente
          </Button>
        </ButtonGroup>
      </div>

      {hasData ? (
        <ChartContainer config={chartConfig} className="h-[22rem] w-full aspect-auto">
          <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={92}
              tickFormatter={(value) => formatCompactCurrencyBrl(Number(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(value) => `Mês: ${String(value)}`}
                  formatter={(value, name) => (
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {segmentLabelMap.get(String(name)) ?? String(name)}
                      </span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {formatCurrencyBrl(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent className="flex-wrap justify-start gap-3 pt-3" />} />
            {activeSeries.segments.map((segment) => (
              <Area
                key={segment.key}
                dataKey={segment.key}
                stackId="total"
                type="monotone"
                stroke={`var(--color-${segment.key})`}
                fill={`var(--color-${segment.key})`}
                fillOpacity={0.28}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          {activeSeries.emptyMessage}
        </div>
      )}
    </div>
  );
}
