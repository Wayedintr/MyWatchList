import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function Search() {
  const [queryText, setQuery] = useState("");
  const [is_movie, setIsMovie] = useState(true);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!queryText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3000/search?query=${encodeURIComponent(queryText)}&is_movie=${is_movie}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }
      const data = await response.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (id: number, type: "movie" | "tv") => {
    navigate(`/show/${type}/${id}`);
  };

  return (
    <div className="flex flex-col items-center mt-8">
      <h1 className="text-xl font-bold mb-4">Search for Movies or TV Shows</h1>
      <div className="flex items-center mb-4">
        <Input
          type="text"
          value={queryText}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter movie or TV show name"
          className="w-[40rem] mr-4"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>
      <RadioGroup
        defaultValue={"movie"}
        onValueChange={(value) => setIsMovie(value === "movie")}
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
        {results.map((result: any) => (
          <div
            key={result.id}
            className="p-4 border rounded cursor-pointer"
            onClick={() => handleNavigate(result.id, is_movie ? "movie" : "tv")}
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
