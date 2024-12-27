import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { search as searchApi } from "@/lib/api";
import { SearchApiResponse, SearchRequest as SearchRequestType, SearchResponse } from "@shared/types/show";

export default function Search() {
  const [params] = useSearchParams();
  const [searchRequest, setSearchRequest] = useState<SearchRequestType>({
    query: params.get("query") || "",
    type: params.get("type") === "movie" ? "movie" : "tv",
    page: Number(params.get("page")) || undefined,
  });
  const [result, setResult] = useState({} as SearchApiResponse);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    setSearchRequest({
      query: params.get("query") || "",
      type: params.get("type") === "movie" ? "movie" : "tv",
      page: Number(params.get("page")) || undefined,
    });

    handleSearch();
  }, [params]);

  const handleSearch = async () => {
    if (!searchRequest.query.trim()) return;
    setLoading(true);
    setError(null);

    // Set query params of the current window
    const searchParams = new URLSearchParams();
    Object.entries(searchRequest).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, String(value));
      }
    });
    window.history.replaceState({}, "", `?${searchParams.toString()}`);

    searchApi({ query: searchRequest.query, type: searchRequest.type } as SearchRequestType)
      .then((response: SearchResponse) => {
        if (response.result) {
          setResult(response.result);
          setError(null);
        } else {
          setResult({} as SearchApiResponse);
          setError(response.message);
        }
      })
      .catch((error: any) => {
        setResult({} as SearchApiResponse);
        setError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleNavigate = (type: "movie" | "tv", id: number) => {
    navigate(`/show/${type}/${id}`);
  };

  return (
    <div className="flex flex-col items-center mt-8">
      <h1 className="text-xl font-bold mb-4">Search for Movies or TV Shows</h1>
      <div className="flex items-center mb-4">
        <Input
          type="text"
          value={searchRequest.query || ""}
          onChange={(e) => setSearchRequest({ ...searchRequest, query: e.target.value })}
          placeholder="Enter movie or TV show name"
          className="w-[40rem] mr-4"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>
      <RadioGroup
        defaultValue={searchRequest.type}
        onValueChange={(value) => setSearchRequest({ ...searchRequest, type: value === "movie" ? "movie" : "tv" })}
        className="flex space-x-4"
      >
        <label className="flex items-center space-x-2">
          <RadioGroupItem value="movie" />
          <span>Movie</span>
        </label>
        <label className="flex items-center space-x-2">
          <RadioGroupItem value="tv" />
          <span>TV Show</span>
        </label>
      </RadioGroup>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {result?.results &&
          result.results.map((result) => (
            <div
              key={result.id}
              className="p-4 border rounded cursor-pointer"
              onClick={() => handleNavigate(searchRequest.type, result.id)}
            >
              <img
                src={`https://image.tmdb.org/t/p/w200${result.poster_path}`}
                alt={result.title || result.name}
                className="mb-2"
              />
              <h2 className="font-bold">{result.title || result.name}</h2>
              <p>{result.release_date || result.first_air_date}</p>
            </div>
          ))}
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
