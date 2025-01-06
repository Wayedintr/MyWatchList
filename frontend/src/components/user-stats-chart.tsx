import React, { useEffect, useState } from "react";
import { Pie, PieChart, Label as RechartsLabel } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { userstats } from "@/lib/api";
import { userStats, userStatsRequest, userStatsResponse } from "@shared/types/show";
import { TrendingUp } from "lucide-react";

const chartConfig = {
  watching: {
    label: "Watching",
    color: "hsl(var(--chart-1))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-2))",
  },
  dropped: {
    label: "Dropped",
    color: "hsl(var(--chart-3))",
  },
  on_hold: {
    label: "On Hold",
    color: "hsl(var(--chart-4))",
  },
  plan_to_watch: {
    label: "Plan to Watch",
    color: "hsl(var(--chart-5))",
  },
};

export default function UserStatsChart({ username }: { username: string }) {
  const [stats, setStats] = useState<userStats | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchStats = async () => {
      try {
        const statsRes = await userstats({ username } as userStatsRequest);
        if (statsRes.stats) {
          setStats(statsRes.stats);
        }
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      }
    };

    fetchStats();
  }, [username]);

  if (!stats) {
    return <p>Loading stats...</p>;
  }

  const chartData = [
    {
      name: chartConfig.watching.label,
      count: stats.watching_count,
      fill: chartConfig.watching.color,
    },
    {
      name: chartConfig.completed.label,
      count: stats.completed_count,
      fill: chartConfig.completed.color,
    },
    {
      name: chartConfig.dropped.label,
      count: stats.dropped_count,
      fill: chartConfig.dropped.color,
    },
    {
      name: chartConfig.on_hold.label,
      count: stats.on_hold_count,
      fill: chartConfig.on_hold.color,
    },
    {
      name: chartConfig.plan_to_watch.label,
      count: stats.plan_to_watch_count,
      fill: chartConfig.plan_to_watch.color,
    },
  ];

  const totalEntries = stats.total_entries || 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>User Statistics</CardTitle>
        <CardDescription>Watching habits overview</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
              strokeWidth={5}
            >
              <RechartsLabel
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalEntries}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total Entries
                        </tspan>
                      </text>
                    );
                  }
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
        <div className="leading-none text-muted-foreground">
          Showing statistics for {username}
        </div>
      </CardFooter>
    </Card>
  );
}
