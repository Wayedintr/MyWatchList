import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";


interface ShowProps {
  is_movie: boolean;
}

type Show = {
  show_id: number;
  is_movie: boolean;
  adult: boolean;
  backdrop_path: string;
  origin_country: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  runtime: number;
  status: string;
  tagline: string;
  title: string;
  vote_average: number;
  vote_count: number;
  seasons: any[];
};

export default function Show({ is_movie }: ShowProps) {
  const { show_id } = useParams<{ show_id: string }>();
  const [data, setData] = useState<Show | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:3000/show/${is_movie ? "movie" : "tv"}/${show_id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        return res.json();
      })
      .then((data) => {
        setData(data);
        console.log(data);
        setError(null);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError(error.message);
      })
      .finally(() => setLoading(false));
  }, [is_movie, show_id]);

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
          alt={data.title || data.original_title}
          style={{ width: "30%", borderRadius: "8px" }}
        />
        <p><strong>Tagline:</strong> {data.tagline}</p>
        <p><strong>Overview:</strong> {data.overview}</p>
        <p><strong>Release Date:</strong> {data.release_date}</p>
        <p><strong>Runtime:</strong> {data.runtime} minutes</p>
        <p><strong>Vote Average:</strong> {data.vote_average} / 10</p>
        <p><strong>Vote Count:</strong> {data.vote_count}</p>
        <p><strong>Status:</strong> {data.status}</p>
        <p><strong>Original Language:</strong> {data.original_language}</p>
        <p><strong>Origin Country:</strong> {data.origin_country}</p>
      </CardContent>
    </Card>
  );
}
