import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/Combobox";
import { Input } from "@/components/ui/input";
import { show as showApi } from "@/lib/api";
import { Show as ShowType, ShowRequest, ShowResponse } from "@shared/types/show";

interface ShowProps {
  is_movie: boolean;
}

export default function Show({ is_movie }: ShowProps) {
  const { show_id } = useParams<{ show_id: string }>();
  const [data, setData] = useState<ShowType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>("");
  const [episodeProgress, setEpisodeProgress] = useState<number>(0);

  useEffect(() => {
    setLoading(true);

    showApi({ show_id: show_id ? show_id : -1, type: is_movie ? "movie" : "tv" } as ShowRequest)
      .then((response: ShowResponse) => {
        if (response.show) {
          setData(response.show);
          setError(null);
        } else {
          setData(null);
          setError(response.message);
        }
      })
      .catch((err) => {
        setError(err);
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [show_id, is_movie]);

  //--------------------------------------------------------------When I refraesh the page, the data inserted 2 times---------------------------------------------------------------

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!data) {
    return <p>No data available.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Label>{data.title || data.original_title}</Label>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <img
          src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
          alt={data.title || data.original_title || ""}
          style={{ width: "30%", borderRadius: "8px" }}
        />
        <p>
          <strong>Tagline:</strong> {data.tagline}
        </p>
        <p>
          <strong>Overview:</strong> {data.overview}
        </p>
        <p>
          <strong>Release Date:</strong> {data.release_date}
        </p>
        <p>
          <strong>Runtime:</strong> {data.runtime} minutes
        </p>
        <p>
          <strong>Vote Average:</strong> {data.vote_average} / 10
        </p>
        <p>
          <strong>Vote Count:</strong> {data.vote_count}
        </p>
        <p>
          <strong>Status:</strong> {data.status}
        </p>
        <p>
          <strong>Original Language:</strong> {data.original_language}
        </p>
        <p>
          <strong>Origin Country:</strong> {data.origin_country}
        </p>
        <p>
          <strong>Genres:</strong> {data.genres.join(", ")}
        </p>

        <Combobox
          initialValue={"Plan To Watch"}
          mandatory
          elements={[
            { value: "Plan To Watch", label: "Plan To Watch" },
            { value: "Watching", label: "Watching" },
            { value: "Completed", label: "Completed" },
            { value: "Dropped", label: "Dropped" },
            { value: "On Hold", label: "On Hold" },
          ]}
          onChange={(value) => setSelectedType(value)}
          disableSearch
        ></Combobox>

        <Combobox
          placeholder="Score"
          mandatory
          elements={[
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
            { value: "5", label: "5" },
            { value: "6", label: "6" },
            { value: "7", label: "7" },
            { value: "8", label: "8" },
            { value: "9", label: "9" },
            { value: "10", label: "10" },
          ]}
          onChange={(value) => setSelectedScore(value)}
          disableSearch
        ></Combobox>

        {!is_movie && (
          <Combobox
            initialValue={""}
            placeholder="Season"
            elements={data.seasons.map((season) => ({
              value: season.season_number?.toString(),
              label: `Season ${season.season_number}`,
            }))}
            onChange={(value) => setSelectedSeason(value)}
            disableSearch
          ></Combobox>
        )}

        {selectedSeason !== "" ? (
          <div>
            {/* Episode Tracker */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <label style={{ marginRight: "8px" }}>Episodes:</label>
              <Input
                type="number"
                value={episodeProgress}
                onChange={(e) => {
                  const value = Math.min(
                    Math.max(parseInt(e.target.value, 10), 0),
                    data.seasons[Number(selectedSeason)]?.episode_count || 0
                  );
                  setEpisodeProgress(value);
                }}
                style={{
                  width: "50px",
                  textAlign: "center",
                  marginRight: "4px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
              / {data.seasons[Number(selectedSeason)]?.episode_count || "0"}
              <button
                onClick={() => {
                  if (episodeProgress < (data.seasons[Number(selectedSeason)]?.episode_count || 0)) {
                    setEpisodeProgress(episodeProgress + 1);
                  }
                }}
                style={{
                  marginLeft: "8px",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                +
              </button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
