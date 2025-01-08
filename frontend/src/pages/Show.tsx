import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/Combobox";
import { Input } from "@/components/ui/input";
import { list, listget, show as showApi } from "@/lib/api";
import { Show as ShowType, ShowRequest, ListGetRequest, UserShowInfo } from "@shared/types/show";
import { Loader2, MinusCircle, PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-provider";
import { Badge } from "@/components/ui/badge";

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
          className="object-cover hidden md:block rounded-md"
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
                  setUserShowInfo({ ...userShowInfo, list_type: value });
                }}
                disableSearch
              />
            </div>

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

                <div className="relative">
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
                  <div className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50">
                    {userShowInfo.season_number &&
                      "/" + data.seasons[Number(userShowInfo.season_number)]?.episode_count}
                  </div>
                </div>

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

      <div className="py-4 text-sm">
        <Card className="w-80">
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
      </div>
    </div>
  );
}
