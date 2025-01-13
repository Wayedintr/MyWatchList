import { useState, useEffect } from "react";
import { useParams, Link, NavLink } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UserPublic, UserPublic as UserType } from "@shared/types/auth";
import { user as userApi, userfollow, userFollowController, userFriends, usershows, userstats } from "@/lib/api";
import {
  showShort,
  userFollowRequest,
  userFollowsRequest,
  UserShowListRequest,
  userStats,
  userStatsRequest,
} from "@shared/types/show";
import { useAuth } from "@/contexts/auth-provider";
import { Component as PieChartComponent } from "@/components/user-pie-chart";

export default function User() {
  const { username } = useParams<{ username: string }>();
  const [currentUser, setUser] = useState({} as UserType);
  const [error, setError] = useState<boolean | null>(false);
  const [ShowList, setShowList] = useState<showShort[]>([]);
  const [stats, setStats] = useState({} as userStats);
  const [isFollowed, setIsFollowed] = useState(false); // State for follow status
  const [isHovered, setIsHovered] = useState(false); // State for hover status
  const [FriendsList, setFriendsList] = useState<UserPublic[]>([]);
  const { user } = useAuth();

  const handleFollow = () => {
    userfollow({ followed_username: username, is_following: isFollowed } as userFollowRequest);
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
      const showRes = await usershows({ username } as UserShowListRequest);
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

    const checkFollow = async () => {
      try {
        const followRes = await userFollowController({ username } as userFollowsRequest);
        const follows = followRes.follows;
        setIsFollowed(follows);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchFriends = async () => {
      try {
        const friendsRes = await userFriends({ username: username } as userFollowsRequest);
        if (friendsRes.friends) {
          setFriendsList(friendsRes.friends);
        } else {
          setError(true);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch friends");
      }
    };

    fetchFriends();
    checkFollow();
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
      <CardContent>
        {/* Profile Text at the Top */}
        <div className="text-left mb-4 mt-4">
          <Label className="text-xl font-semibold">{currentUser?.username}'s Profile</Label>
        </div>

        {/* Horizontal Line */}
        <hr className="border-t-2 mb-6" />

        {/* Flex container for profile layout */}
        <div className="flex items-start gap-10">
          {/* Pie Chart on the Left */}

          {/* Profile Photo and Friends Section on the Left */}
          <div className="flex-shrink-0">
            <Avatar className="w-40 h-40 rounded-full overflow-hidden shadow-lg">
              <AvatarImage src={`https://github.com/${currentUser.username}.png?size=240`} alt={currentUser.username} />
              <AvatarFallback>
                <Label className="text-3xl">{currentUser?.username?.substring(0, 2)}</Label>
              </AvatarFallback>
            </Avatar>

            {/* Friends Section */}
            <div className="mt-4">
              <Label className="text-lg font-semibold">Following</Label>
              <hr className="border-t-2 mt-2 mb-4" />

              {/* Friends List */}
              <div className="flex gap-4 flex-wrap">
                {FriendsList.map((friend) => (
                  <Link key={friend.username} to={`/user/${friend.username}`}>
                    <Avatar className="w-12 h-12 rounded-full overflow-hidden">
                      <AvatarImage src={`https://github.com/${friend.username}.png?size=120`} alt={friend.username} />
                      <AvatarFallback>
                        <Label className="text-xl">{friend.username?.substring(0, 2)}</Label>
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* User Details and Show List on the Right */}
          <div className="flex-grow space-y-3">
            {/* Username */}
            <CardHeader>
              <CardTitle>
                <Label className="text-2xl font-bold">{currentUser.username}'s Watch List</Label>
              </CardTitle>
            </CardHeader>

            {/* Horizontal Line under Watch List */}
            <hr className="border-t-2 mt-2 mb-4" />

            {/* Show List */}
            <div>
              {ShowList.map((show) => (
                <ShowCard key={show.show_id} show={show} />
              ))}
            </div>

            {/* Follow Button */}
            {user && currentUser.username !== user?.username && (
              <Button
                variant={isFollowed ? "default" : "outline"}
                className={`w-full ${
                  isFollowed
                    ? isHovered
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-green-500 text-white"
                    : "hover:bg-gray-100"
                }`}
                onClick={handleFollow}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {isFollowed && isHovered ? "Unfollow" : isFollowed ? "Followed" : "Follow"}
              </Button>
            )}
          </div>

          <div className="flex-shrink-0">
            <PieChartComponent
              stats={{
                watching: stats.watching_count,
                planToWatch: stats.plan_to_watch_count,
                completed: stats.completed_count,
                onHold: stats.on_hold_count,
                dropped: stats.dropped_count,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ShowCard({ show }: { show: showShort }) {
  if (!show.poster_path || !show.title || !show.show_id) {
    return JSON.stringify(show);
  }
  console.log(show);
  const type = show.is_movie ? "movie" : "tv";
  const id = show.show_id;
  return (
    <Link
      to={`/show/${type}/${id}`}
      className="block max-w-xs bg-background rounded-lg shadow-md overflow-hidden transform transition-all hover:scale-105 hover:shadow-2xl mb-6"
    >
      <div className="flex flex-col md:flex-row">
        {/* Show Poster */}
        <img
          src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
          alt={show.title}
          className="w-full md:w-32 h-48 object-cover object-center"
        />

        <div className="p-4 flex-grow flex flex-col justify-between">
          {/* Show Title */}
          <h2 className="text-lg font-medium text-primary hover:text-accent transition-all mb-2">{show.title}</h2>

          {/* Show Info */}
          <div className="text-sm text-gray-300 flex-grow">
            <p className="mb-1 text-gray-300">
              {/*@ts-ignore */}
              List: <span className="font-medium text-gray-400">{show.user_show_info?.list_type}</span>
            </p>
            <p className="mb-1 text-gray-300">
              {/*@ts-ignore */}
              Score: <span className="font-medium text-gray-400">{show.user_show_info?.score}/10</span>
            </p>
            <p className="mb-1 text-gray-300">
              Season:{" "}
              <span className="font-medium text-gray-400">
                {/*@ts-ignore */}
                {show.user_show_info?.season_number ? show.user_show_info?.season_number : "0"}/{show.user_show_info?.number_of_seasons}
              </span>
            </p>
            <p>
              Episodes:{" "}
              <span className="font-medium text-gray-400">
                {/*@ts-ignore */}
                {show.user_show_info?.episode_number ? show.user_show_info?.episode_number : "0"}/{show.user_show_info?.episode_count ?? 0}
              </span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
