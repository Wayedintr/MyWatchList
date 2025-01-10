import { deleteUserActivity, userActivity as userActivityApi } from "@/lib/api";
import { WatchActivity } from "@shared/types/user";
import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { timeAgo } from "@/lib/utils";
import { Image } from "./skeleton-img";
import { Ellipsis, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-provider";

export function UserActivity({
  user_id,
  className,
  limit = 10,
  includeFollows = false,
  ...props
}: { user_id: number; limit?: number; includeFollows?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  const { user } = useAuth();
  const [userActivity, setUserActivity] = useState<WatchActivity[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true); // Tracks if more data is available
  const [loading, setLoading] = useState(false); // Tracks loading state

  const loadActivities = async (newOffset: number) => {
    setLoading(true);
    try {
      const res = await userActivityApi({
        user_id,
        offset: newOffset,
        limit,
        include_follows: includeFollows ? "true" : "false",
      });
      if (res.activity) {
        setUserActivity((prev) => [...prev, ...res.activity!]);
        setHasMore(res.activity.length === limit); // Check if more data is available
      }
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities(0); // Load initial data
  }, [user_id]);

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    loadActivities(newOffset);
  };

  return (
    <div className={`flex flex-col gap-4 ${className || ""}`} {...props}>
      {userActivity.map((activity, index) => (
        <>
          <Card className="p-0 gap-4 flex overflow-clip rounded-md h-32" key={index}>
            <div className="relative">
              <Link to={`/show/${activity.type}/${activity.show_id}`} className="absolute top-0 left-0 w-full h-full" />
              <Image
                src={`https://image.tmdb.org/t/p/w200${activity.image_path}`}
                alt={activity.show_name!}
                className="h-full w-24 object-cover"
              />
            </div>

            <div className="flex flex-col items-start p-2">
              <Button variant={"link"} className="p-0 h-fit" asChild>
                <Link to={`/user/${activity.username}`}>{activity.username}</Link>
              </Button>

              <p className="text-muted-foreground text-sm">{activityText(activity)}</p>
              {activity.episode_name && (
                <p className="text-muted-foreground text-xs opacity-70">{activity.episode_name}</p>
              )}
            </div>

            <div className="flex-grow justify-end flex p-2">
              <div className="flex gap-2">
                <p className="text-muted-foreground text-xs font-semibold">{timeAgo(activity.date)}</p>
                {activity.username === user?.username && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size={"icon"}
                        className="rounded-full w-5 h-5 bg-transparent hover:bg-transparent text-muted-foreground hover:text-foreground"
                      >
                        <Ellipsis style={{ strokeWidth: 3 }} />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent>
                      <DropdownMenuItem
                        className="text-xs font-semibold"
                        onClick={() => {
                          deleteUserActivity({
                            activity_id: activity.activity_id,
                          }).then((res) => {
                            if (res.success) {
                              setUserActivity((prev) =>
                                prev.filter((item) => item.activity_id !== activity.activity_id)
                              );
                            }
                          });
                        }}
                      >
                        <X /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </Card>
        </>
      ))}

      {hasMore && (
        <Button variant={"outline"} className="self-center mt-4" onClick={handleLoadMore} disabled={loading}>
          {loading ? "Loading..." : "Load More"}
        </Button>
      )}
    </div>
  );
}

function activityText(activity: WatchActivity) {
  const { list_type, type, show_name, season_number, episode_number, season_name, show_id } = activity;

  switch (list_type) {
    case "Plan To Watch":
      return (
        <span>
          Is planning to watch{" "}
          <Button variant={"link"} className="p-0 h-fit" asChild>
            <Link to={`/show/${type}/${show_id}`}>{show_name}</Link>
          </Button>
        </span>
      );
    case "Watching":
      if (type === "tv" && season_number && episode_number) {
        return (
          <span>
            Watched {season_name ?? "Season " + season_number}, Episode {episode_number} of{" "}
            <Button variant={"link"} className="p-0 h-fit" asChild>
              <Link to={`/show/${type}/${show_id}`}>{show_name}</Link>
            </Button>
          </span>
        );
      }
      return (
        <span>
          Started watching{" "}
          <Button variant={"link"} className="p-0 h-fit" asChild>
            <Link to={`/show/${type}/${show_id}`}>{show_name}</Link>
          </Button>
        </span>
      );
    case "Completed":
      return (
        <span>
          Completed{" "}
          <Button variant={"link"} className="p-0 h-fit" asChild>
            <Link to={`/show/${type}/${show_id}`}>{show_name}</Link>
          </Button>
        </span>
      );
    case "Dropped":
      return (
        <span>
          Dropped{" "}
          <Button variant={"link"} className="p-0 h-fit" asChild>
            <Link to={`/show/${type}/${show_id}`}>{show_name}</Link>
          </Button>
        </span>
      );
    case "On Hold":
      return (
        <span>
          Put{" "}
          <Button variant={"link"} className="p-0 h-fit" asChild>
            <Link to={`/show/${type}/${show_id}`}>{show_name}</Link>
          </Button>{" "}
          on hold
        </span>
      );
    default:
      return (
        <span>
          Activity on{" "}
          <Button variant={"link"} className="p-0 h-fit" asChild>
            <Link to={`/show/${type}/${show_id}`}>{show_name}</Link>
          </Button>
        </span>
      );
  }
}
