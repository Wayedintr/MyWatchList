import { useState, useEffect } from "react";
import { useParams, Link, NavLink } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import UserStatsChart from "@/components/user-stats-chart";
import { UserPublic as UserType } from "@shared/types/auth";
import { user as userApi, userfollow, usershows, userstats } from "@/lib/api";
import { showShort, userFollowRequest, userShowRequest, userStats, userStatsRequest } from "@shared/types/show";

export default function User() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState({} as UserType);
  const [error, setError] = useState<boolean | null>(false);
  const [ShowList, setShowList] = useState<showShort[]>([]);
  const [stats, setStats] = useState({} as userStats);
  const [isFollowed, setIsFollowed] = useState(false); // State for follow status
  const [isHovered, setIsHovered] = useState(false); // State for hover status

  const handleFollow = () => {
    if (!isFollowed) {
      // Follow the user
      userfollow({ followed_username: username, is_following: true } as userFollowRequest);
    }
    setIsFollowed((prev) => !prev); // Toggle follow status
  };

  useEffect(() => {
    if (!username) return;

    setError(null);

    const fetchUser = async () => {
      try {
        const userRes = await userApi(username);
        if (userRes.user) {
          setUser(userRes.user);
        } else {
          setError(true);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch user");
      }
    };

    const fetchShows = async () => {
      const showRes = await usershows({ username } as userShowRequest);
      if (showRes.show_list) {
        setShowList(showRes.show_list);
      } else {
        setShowList([]);
      }
    };

    const fetchStats = async () => {
      const statsRes = await userstats({ username } as userStatsRequest);
      if (statsRes.stats) {
        setStats(statsRes.stats);
      } else {
        setStats({} as userStats);
      }
    };

    fetchStats();
    fetchUser();
    fetchShows();
  }, [username]);

  if (error) {
    return (
      <div className="bg-background text-foreground flex-grow flex items-center justify-center h-[80vh]">
        <div className="space-y-4">
          <h2 className="text-8xl mb-4">404</h2>
          <h1 className="text-3xl font-semibold">Oops! User not found</h1>
          <p className="text-sm text-muted-foreground">We are sorry, but the page you requested was not found</p>
          <NavLink to="/" className={buttonVariants()}>
            Back to Home
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Label>{user.username}</Label>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Avatar>
          <AvatarImage src={`https://github.com/${user.username}.png?size=120`} alt={user.username} />
          <AvatarFallback>
            <Label>{user?.username?.substring(0, 2)}</Label>
          </AvatarFallback>
        </Avatar>
        <UserStatsChart username={user.username} />
        {ShowList.map((show) => (
          <ShowCard key={show.show_id} show={show} />
        ))}
        <Button
          variant={isFollowed ? "default" : "outline"} // Adjust variant dynamically
          className={`mt-4 w-full ${
            isFollowed
              ? isHovered
                ? "bg-red-500 text-white hover:bg-red-600" // Red for "Unfollow" hover
                : "bg-green-500 text-white" // Green for "Followed"
              : "hover:bg-gray-100" // Optional hover effect for "Follow"
          }`}
          onClick={handleFollow}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isFollowed && isHovered ? "Unfollow" : isFollowed ? "Followed" : "Follow"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ShowCard({ show }: { show: showShort }) {
  if (!show.poster_path || !show.title || !show.show_id) {
    return JSON.stringify(show);
  }
  const type = show.is_movie ? "movie" : "tv";
  const id = show.show_id;

  return (
    <div className="max-h-36 flex gap-5 py-5">
      <img src={`https://image.tmdb.org/t/p/w200${show.poster_path}`} alt={show.title} className="m-0 h-36" />
      <div>
        <Link to={`/show/${type}/${id}`} className="font-semibold text-lg">
          {show.title}
        </Link>
        {/*@ts-ignore */}
        <p>{show.list_type}</p>
        {/*@ts-ignore */}
        <p>Score:{show.score}</p>
        {/*@ts-ignore */}
        <p>Season:{show.season_number}</p>
        <p>
          {/*@ts-ignore */}
          {show.episode_number}/{show.episode_count}
        </p>
      </div>
    </div>
  );
}
