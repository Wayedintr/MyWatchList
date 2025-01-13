import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { discoverShows } from "@/lib/api";
import { Link } from "react-router-dom";
import { Image } from "./skeleton-img";

export function PopularShows({
  className,
  type = "tv",
  limit = 20,
  ...props
}: { type?: "tv" | "movie"; limit?: number } & React.HTMLAttributes<HTMLDivElement>) {
  const [shows, setShows] = useState<any[]>([]);

  useEffect(() => {
    discoverShows({ type: type, sort_by: "popularity.desc" }).then((res) => {
      if (res.result) {
        setShows(res.result.results.slice(0, limit));
      }
    });
  }, []);

  return (
    <Card
      className={`rounded-md grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 p-5 ${className || ""}`}
      {...props}
    >
      {shows.map((show) => (
        <div key={show.id} className="relative w-full aspect-[4/5] rounded-md overflow-clip group cursor-pointer">
          <Image
            src={`https://image.tmdb.org/t/p/w500/${show.poster_path}`}
            alt={show.title!}
            className="object-cover w-full h-full absolute inset-0 group-hover:scale-105 transition-transform"
          />

          <Link to={`/show/${type}/${show.id}`}>
            <div className="absolute bottom-0 left-0 right-0 h-full py-1.5 bg-black/70 dark:text-foreground text-background font-semibold text-xs text-center flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {type === "tv" ? show.name : show.title}
            </div>
          </Link>
        </div>
      ))}
    </Card>
  );
}
