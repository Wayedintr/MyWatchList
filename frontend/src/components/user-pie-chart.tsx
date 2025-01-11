"use client";

import { TrendingUp } from "lucide-react";
import { Pie, PieChart, Label } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

// Props type definition
interface PieChartComponentProps {
  stats: {
    watching: number;
    planToWatch: number;
    completed: number;
    onHold: number;
    dropped: number;
  };
}

const chartConfig = {
  watching: {
    label: "Watching",
    color: "hsl(var(--chart-1))",
  },
  planToWatch: {
    label: "Plan to Watch",
    color: "hsl(var(--chart-2))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-3))",
  },
  onHold: {
    label: "On Hold",
    color: "hsl(var(--chart-4))",
  },  
  dropped: {
    label: "Dropped",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function Component({ stats }: PieChartComponentProps) {
  // Prepare chart data based on stats prop
  const chartData = [
  { category: "Watching", count: parseInt(String(stats.watching), 10), fill: "var(--color-watching)" },
  { category: "Plan to Watch", count: parseInt(String(stats.planToWatch), 10), fill: "var(--color-plan-to-watch)" },
  { category: "Completed", count: parseInt(String(stats.completed), 10), fill: "var(--color-completed)" },
  { category: "On Hold", count: parseInt(String(stats.onHold), 10), fill: "var(--color-on-hold)" },
  { category: "Dropped", count: parseInt(String(stats.dropped), 10), fill: "var(--color-dropped)" },
  ];


  console.log(stats);
  console.log(chartData);

  const totalEntries = chartData.reduce((sum, entry) => sum + entry.count, 0);

  if (totalEntries === 0) {
    return <div className="text-center">No data available for the pie chart.</div>;
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>User's Watch List</CardTitle>
        <CardDescription>Summary of activity</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="category"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox) {
                    const { cx, cy } = viewBox as { cx: number; cy: number };
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} y={cy} className="fill-foreground text-3xl font-bold">
                          {totalEntries}
                        </tspan>
                        <tspan x={cx} y={cy + 24} className="fill-muted-foreground">
                          Total Entries
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">Showing activity distribution for the user</div>
      </CardFooter>
    </Card>
  );
}
