import { incrementShow, userShowList } from "@/lib/api";
import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Link } from "react-router-dom";
import { Image } from "./skeleton-img";
import { showShort } from "@shared/types/show";
import { useAuth } from "@/contexts/auth-provider";

export function ShowsInProgress({ className, ...props }: {} & React.HTMLAttributes<HTMLDivElement>) {
  const { user } = useAuth();
  const [showList, setShowList] = useState<showShort[]>([]);
  const [_, setLoading] = useState(true); // Tracks loading state

  useEffect(() => {
    setLoading(true);
    try {
      userShowList({ user_id: user?.id!, list_type: "Watching" }).then((res) => {
        if (res.show_list) {
          setShowList(res.show_list);
        }
      });
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Card
      className={`rounded-md grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 p-5 ${className || ""}`}
      {...props}
    >
      {showList.map((show) => (
        <div key={show.show_id} className="relative w-full aspect-[4/5] rounded-md overflow-clip group cursor-pointer">
          <Link to={`/show/${show.is_movie ? "movie" : "tv"}/${show.show_id}`}>
            <Image
              src={`https://image.tmdb.org/t/p/w500/${show.poster_path}`}
              alt={show.title!}
              className="object-cover w-full h-full absolute inset-0 group-hover:scale-105 transition-transform"
            />
          </Link>

          <div
            onClick={() => {
              console.log("show");
              incrementShow({
                show_id: show.show_id,
                type: show.is_movie ? "movie" : "tv",
              }).then((res) => {
                if (res.tv_episode_number) {
                  setShowList((prevList) => {
                    return prevList.map((s) => {
                      if (s.show_id === show.show_id) {
                        return {
                          ...s,
                          user_show_info: { ...s.user_show_info, episode_number: res.tv_episode_number },
                        };
                      }
                      return s;
                    });
                  });
                } else if (res.movie_completed) {
                  setShowList((prevList) => {
                    return prevList.map((s) => {
                      if (s.show_id === show.show_id) {
                        return { ...s, user_show_info: { ...s.user_show_info, list_type: "Completed" } };
                      }
                      return s;
                    });
                  });
                }
              });
            }}
            className="absolute bottom-0 left-0 right-0 h-fit py-1.5 bg-black/70 dark:text-foreground text-background font-semibold text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {show.is_movie
              ? show.user_show_info?.list_type
              : (show.user_show_info?.episode_number ?? "0") + "+/" + (show.user_show_info?.episode_count ?? "?")}
          </div>
        </div>
      ))}
    </Card>
  );
}
