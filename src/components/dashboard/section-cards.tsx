import { CircleHelp, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SectionCards({
  cards,
}: {
  cards: {
    title: string;
    titleTip?: string;
    value: string;
    description?: string;
    trend?: "up" | "down";
    trendValue?: string;
    footerText?: string;
  }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <span className="inline-flex items-center gap-1.5">
                {card.title}
                {card.titleTip != null && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center text-muted-foreground"
                        aria-label={`Detalhes sobre ${card.title}`}
                      >
                        <CircleHelp className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>{card.titleTip}</TooltipContent>
                  </Tooltip>
                )}
              </span>
            </CardTitle>
            {card.trend != null && card.trendValue != null && (
              <CardAction>
                <Badge
                  variant={card.trend === "up" ? "default" : "secondary"}
                  className="gap-1 font-normal"
                >
                  {card.trend === "up" ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {card.trendValue}
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.description != null && (
              <CardDescription className="mt-1 text-xs">
                {card.description}
              </CardDescription>
            )}
          </CardContent>
          {card.footerText != null && (
            <CardFooter className="border-t bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
              {card.footerText}
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
