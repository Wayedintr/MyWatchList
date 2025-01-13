import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/Combobox";
import { Input } from "@/components/ui/input";
import { deleteShowComment, list, listget, makeShowComment, show as showApi } from "@/lib/api";
import {
  Show as ShowType,
  ShowRequest,
  ListGetRequest,
  UserShowInfo,
  Season,
  Episode,
  Comment,
} from "@shared/types/show";
import { Clock, Dot, Loader2, MinusCircle, PlusCircle, Send, Star, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image } from "@/components/skeleton-img";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { timeAgo } from "@/lib/utils";

interface ShowProps {
  is_movie: boolean;
}

export default function Show({ is_movie }: ShowProps) {
  const { user } = useAuth();
  const { show_id } = useParams<{ show_id: string }>();
  const [data, setData] = useState<ShowType | null>(null);
  const [userShowInfo, setUserShowInfo] = useState<UserShowInfo>({
    episode_count: 0,
    episode_number: null,
    list_type: null,
    season_number: null,
    score: null,
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [comment, setComment] = useState<string>("");

  const infoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchShowData = async () => {
      return showApi({ show_id: show_id ? show_id : -1, type: is_movie ? "movie" : "tv" } as ShowRequest);
    };

    const fetchListData = async () => {
      if (!user) {
        return;
      }
      return listget({ show_id: show_id ? show_id : -1, is_movie: is_movie } as ListGetRequest);
    };

    setLoading(true);
    setError(null);

    Promise.all([fetchShowData(), fetchListData()])
      .then(([showData, listData]) => {
        if (showData.show) {
          console.log(showData.message);
          setData(showData.show);
        } else {
          setError(showData.message);
        }

        if (listData?.show_user_info) {
          console.log(listData);
          setUserShowInfo(listData.show_user_info);
        }
      })
      .catch((err) => {
        setError(err.message || "An error occurred");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [show_id, is_movie]);

  useEffect(() => {
    if (!loading) {
      list({
        is_movie: is_movie,
        show_id: show_id ? parseInt(show_id) : -1,
        user_show_info: userShowInfo,
      }).then((res) => {
        console.log(res);
      });
    }
  }, [userShowInfo, loading]);

  const handleCommentSubmit = () => {
    makeShowComment({
      comment: comment,
      show_id: show_id ? parseInt(show_id) : -1,
      type: is_movie ? "movie" : "tv",
    }).then((res) => {
      if (res.success) {
        const newComment: Comment = {
          comment: comment,
          comment_id: res.comment_id,
          date: new Date().toISOString(),
          username: user?.username!,
        };

        setData((prevData) => {
          if (prevData) {
            return {
              ...prevData,
              comments: [newComment, ...(prevData.comments ?? [])],
            };
          }
          return prevData;
        });
      }
    });
  };

  const handleCommentDelete = (comment_id: number) => {
    deleteShowComment({ comment_id: comment_id }).then((res) => {
      if (res.success) {
        setData((prevData) => {
          if (prevData) {
            return {
              ...prevData,
              comments: prevData.comments?.filter((comment) => comment.comment_id !== comment_id),
            };
          }
          return prevData;
        });
      }
    });
  };

  if (loading || !data) {
    if (error) {
      return <div>Error: {error}</div>;
    }
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Loader2 className="animate-spin w-32 h-32" />
      </div>
    );
  }
  return (
    <div className="container">
      <img
        src={`https://image.tmdb.org/t/p/w500${data.backdrop_path}`}
        className="absolute w-screen left-0 h-screen md:h-[30rem] opacity-30 blur-sm object-cover -z-50"
        style={{
          height: infoContainerRef.current?.offsetHeight ?? "30rem",
        }}
      />

      <div className="min-h-[30rem] md:h-[30rem] flex py-4 gap-10" ref={infoContainerRef}>
        <img
          src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
          className="object-cover hidden md:block rounded-md aspect-[2/3] w-80 shrink-0"
        />

        <div className="flex flex-col pb-1 gap-10">
          <div>
            <h1 className="text-4xl font-bold">
              {data.title}{" "}
              <span className="text-muted-foreground font-semibold">{`(${data.release_date?.split("-")[0]})`}</span>
            </h1>
            <h2 className="text-sm text-muted-foreground">{data.original_title}</h2>
            <div className="space-x-1">
              {data.genres.map((genre, index) => (
                <Badge key={index} className="cursor-default">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          <div
            className={`flex-grow flex flex-col md:flex-row items-start md:items-center gap-2 ${
              !user && "pointer-events-none select-none opacity-80"
            }`}
          >
            <div className="flex flex-col gap-1">
              <Label className="font-bold ml-0.5">Status</Label>
              <Combobox
                value={userShowInfo.list_type}
                elements={[
                  { value: "Plan To Watch", label: "Plan To Watch" },
                  { value: "Watching", label: "Watching" },
                  { value: "Completed", label: "Completed" },
                  { value: "Dropped", label: "Dropped" },
                  { value: "On Hold", label: "On Hold" },
                ]}
                onChange={(value) => {
                  if (value === "Completed") {
                    // Lock season and episode numbers to the last available values
                    const lastSeason = data.seasons[data.seasons.length - 1];
                    const lastEpisode = lastSeason.episode_count;
                
                    setUserShowInfo({
                      ...userShowInfo,
                      list_type: value,
                      season_number: lastSeason.season_number,
                      episode_number: lastEpisode,
                    });
                  } else if (value === "Plan To Watch") {
                    // Lock season and episode numbers to null
                    setUserShowInfo({
                      ...userShowInfo,
                      list_type: value,
                      season_number: null,
                      episode_number: null,
                    });
                  } else {
                    // Update status without modifying season or episode
                    setUserShowInfo({
                      ...userShowInfo,
                      list_type: value,
                    });
                  }
                }}
                disableSearch
              />
            </div>

            {!is_movie && userShowInfo.list_type !== "Plan To Watch" && (
              <>
                <div className="flex flex-col gap-1">
                  <Label className="font-bold ml-0.5">Season</Label>
                  <Combobox
                    value={userShowInfo.season_number?.toString()}
                    elements={data.seasons.map((season) => ({
                      value: season.season_number?.toString(),
                      label: season.name || `Season ${season.season_number}`,
                    }))}
                    onChange={(value) => {
                      setUserShowInfo({ ...userShowInfo, season_number: value });
                    }}
                    disableSearch
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="font-bold text-center">Episode</Label>
                  <div className="h-10 gap-2 flex items-center">
                    <button
                      className="rounded-full h-5 w-5 hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
                      onClick={() => {
                        if (userShowInfo.episode_number && userShowInfo.episode_number > 0) {
                          setUserShowInfo({ ...userShowInfo, episode_number: userShowInfo.episode_number - 1 });
                        }
                      }}
                      disabled={!userShowInfo.season_number}
                    >
                      <MinusCircle className="w-full h-full" />
                    </button>

                    <Input
                      type="number"
                      value={userShowInfo.season_number ? userShowInfo.episode_number?.toString() || 0 : ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          const clamped = Math.min(
                            value,
                            data.seasons[Number(userShowInfo.season_number)]?.episode_count || 0
                          );
                          setUserShowInfo({ ...userShowInfo, episode_number: clamped });
                        } else {
                          setUserShowInfo({ ...userShowInfo, episode_number: null });
                        }
                      }}
                      className="bg-background w-20 text-left peer pe-9"
                      disabled={!userShowInfo.season_number}
                    />

                    <button
                      className="rounded-full h-5 w-5 hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
                      onClick={() => {
                        if (
                          userShowInfo.episode_number &&
                          userShowInfo.episode_number <
                            (data.seasons[Number(userShowInfo.season_number)]?.episode_count || Infinity)
                        ) {
                          setUserShowInfo({ ...userShowInfo, episode_number: userShowInfo.episode_number + 1 });
                        } else if (!userShowInfo.episode_number) {
                          setUserShowInfo({ ...userShowInfo, episode_number: 1 });
                        }
                      }}
                      disabled={!userShowInfo.season_number}
                    >
                      <PlusCircle className="w-full h-full" />
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="flex-grow flex justify-end">
              <div className="flex flex-col gap-1">
                <Label className="font-bold ml-0.5">Score</Label>
                <Combobox
                  value={userShowInfo.score?.toString()}
                  elements={Array.from({ length: 10 }, (_, i) => ({
                    value: (i + 1).toString(),
                    label: (i + 1).toString(),
                  }))}
                  onChange={(value) => {
                    setUserShowInfo({ ...userShowInfo, score: value });
                  }}
                  placeholder="Rate..."
                  disableSearch
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold">Overview</label>
            <p>{data.overview}</p>
          </div>
        </div>
      </div>

      <div className="py-4 text-sm flex gap-4 min-h-[30rem] flex-col md:flex-row">
        <Card className="w-full md:w-80 shrink-0">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold border-b pb-1 w-fit">Information</CardTitle>
          </CardHeader>
          <CardContent>
            {data.status && (
              <p className="font-semibold text-muted-foreground">
                Status: <span className="font-normal">{data.status}</span>
              </p>
            )}
            {data.episode_run_time && (
              <p className="font-semibold text-muted-foreground">
                Rating: <span className="font-normal">{data.vote_average}/10</span>
              </p>
            )}
            {data.episode_run_time && (
              <p className="font-semibold text-muted-foreground">
                Episode Run Time: <span className="font-normal">{data.episode_run_time} minutes</span>
              </p>
            )}
          </CardContent>
        </Card>

        {!is_movie && (
          <Card className="w-full h-fit">
            <CardContent className="py-4">
              <Tabs defaultValue={data.seasons[0]?.name!}>
                <TabsList className="w-full flex-wrap h-fit justify-start">
                  {data.seasons.map((season: Season, index) => (
                    <TabsTrigger key={index} value={season.name!}>
                      {season.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {data.seasons.map((season: Season, index) => (
                  <TabsContent key={index} value={season.name!}>
                    <ScrollArea className="h-96 pr-4 mt-2">
                      {season.episodes.map((episode: Episode, index) => (
                        <Card
                          key={index}
                          className={`w-full bg-background h-32 overflow-clip flex ${index !== 0 && "mt-2"}`}
                        >
                          <div className="h-full w-60 shrink-0 relative">
                            <Image
                              src={`https://image.tmdb.org/t/p/w500${
                                episode.still_path || season.poster_path || data.poster_path
                              }`}
                              alt={episode.name!}
                              className="h-full w-full object-cover shrink-0 absolute top-0 left-0"
                            />
                            <div className="relative p-1 space-x-1">
                              {episode.vote_average && (
                                <Badge className="space-x-1">
                                  <Star className="w-3 h-3 shrink-0" />
                                  <p>{episode.vote_average}</p>
                                </Badge>
                              )}
                              {episode.runtime && (
                                <Badge className="space-x-1">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <p>{episode.runtime} min</p>
                                </Badge>
                              )}
                              {episode.air_date && (
                                <Badge>
                                  {new Intl.DateTimeFormat("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }).format(new Date(episode.air_date!))}
                                </Badge>
                              )}
                            </div>

                            {((userShowInfo.season_number as number) > season.season_number! ||
                              ((userShowInfo.season_number as number) === season.season_number! &&
                                (userShowInfo.episode_number as number) > episode.episode_number!)) && (
                              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                                <Badge className="bg-accent">Watched</Badge>
                              </div>
                            )}
                          </div>

                          <div className="py-1 px-2 space-y-1">
                            <p className="font-semibold">
                              Episode {episode.episode_number} - {episode.name}
                            </p>
                            <ScrollArea type="always" className="h-24 pr-4">
                              <p className="text-muted-foreground">{episode.overview}</p>
                            </ScrollArea>
                          </div>
                        </Card>
                      ))}
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="py-4 text-sm">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold border-b pb-1 w-fit">Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={user ? "Leave a comment..." : "Sign in to leave a comment..."}
                className="max-h-60"
                disabled={!user}
              />
              <Button size={"icon"} disabled={comment === "" || !user} onClick={handleCommentSubmit}>
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <div className="mr-12">
              {data.comments.map((comment: Comment, index) => (
                <div key={index} className="space-y-1 border-b p-3">
                  <div className="flex items-center">
                    <Button variant={"link"} asChild className="font-semibold p-0">
                      <Link to={`/user/${comment.username}`}>{comment.username}</Link>
                    </Button>
                    <Dot className="text-muted-foreground w-4 h-4 shrink-0 mt-0.5" />
                    <text className="text-muted-foreground">{timeAgo(comment.date)}</text>
                    <div className="flex-grow flex justify-end">
                      {user?.username === comment.username && (
                        <Button
                          size={"icon"}
                          variant={"destructive"}
                          className="w-4 h-4"
                          onClick={() => handleCommentDelete(comment.comment_id)}
                        >
                          <X className="w-2 h-2" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <p>{comment.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
