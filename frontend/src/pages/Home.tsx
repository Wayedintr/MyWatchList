import { PopularShows } from "@/components/popular-shows";
import { ShowsInProgress } from "@/components/shows-in-progress";
import { Button } from "@/components/ui/button";
import { UserActivity } from "@/components/user-activity";
import { useAuth } from "@/contexts/auth-provider";
import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();

  useEffect(() => {
    // Scroll to top smoothly
    scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="container py-8 flex flex-col md:flex-row-reverse gap-8">
      <div className="w-full space-y-5">
        {user && (
          <div>
            <p className="text-2xl font-bold mb-3">Shows in progress</p>
            <ShowsInProgress />
          </div>
        )}

        <div>
          <p className="text-2xl font-bold mb-3">Popular TV Shows</p>
          <PopularShows type="tv" limit={15} />
        </div>

        <div>
          <p className="text-2xl font-bold mb-3">Popular Movies</p>
          <PopularShows type="movie" limit={15} />
        </div>
      </div>

      {!user && (
        <div className="w-full max-h-60 flex flex-col items-center justify-center">
          <p className="text-lg font-bold mb-3">Login to manage your shows and connect with others</p>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      )}

      {user && (
        <div className="w-full">
          <p className="text-2xl font-bold mb-3">Activity</p>
          <UserActivity user_id={user?.id} includeFollows={true} />
        </div>
      )}
    </div>
  );
}
