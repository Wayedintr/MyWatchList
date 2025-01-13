import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import { Image } from "@/components/skeleton-img";
import { Card } from "@/components/ui/card";

export default function Search() {
  const [params] = useSearchParams();
  const [searchRequest, setSearchRequest] = useState<SearchRequestType>({
    query: params.get("query") || "",
    type: params.get("type") === "movie" ? "movie" : "tv",
    page: Number(params.get("page")) || 1,
  });
  const [result, setResult] = useState({} as SearchApiResponse);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchRequest({
      query: params.get("query") || "",
      type: params.get("type") === "movie" ? "movie" : "tv",
      page: Number(params.get("page")) || 1,
    });

    handleSearch();
  }, [params]);

  const handleSearch = async () => {
    if (!searchRequest.query.trim()) return;
    setLoading(true);
    setError(null);

    const searchParams = new URLSearchParams();
    Object.entries(searchRequest).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, String(value));
      }
    });
    window.history.replaceState({}, "", `?${searchParams.toString()}`);

    searchApi(searchRequest)
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

  const handlePaginationClick = (page: number) => {
    setSearchRequest({ ...searchRequest, page });
  };

  const getVisiblePages = (current: number, total: number) => {
    const pages = [];
    const visibleRange = 2; // Number of pages to show before/after the current page

    // Always include the first page
    pages.push(1);

    // Add ellipsis if the range doesn't include the second page
    if (current - visibleRange > 2) {
      pages.push("...");
    }

    // Add pages around the current page
    for (let i = Math.max(2, current - visibleRange); i <= Math.min(total - 1, current + visibleRange); i++) {
      pages.push(i);
    }

    // Add ellipsis if the range doesn't include the second-to-last page
    if (current + visibleRange < total - 1) {
      pages.push("...");
    }

    // Always include the last page
    if (total > 1) {
      pages.push(total);
    }

    return pages;
  };

  useEffect(() => {
    handleSearch();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [searchRequest.page]);

  return (
    <div className="flex flex-col items-center mt-8 mx-4 md:mx-8 lg:mx-16 xl:mx-40">
      <h1 className="text-xl font-bold mb-4">Search for Movies or TV Shows</h1>
      <form
        className="flex items-center mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <Input
          type="text"
          value={searchRequest.query || ""}
          onChange={(e) => setSearchRequest({ ...searchRequest, query: e.target.value })}
          placeholder="Enter show name"
          className="w-[40rem] mr-4"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>
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

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 mb-4">
        {result?.results &&
          result.results.map((result) => (
            <Link to={`/show/${params.get("type") === "movie" ? "movie" : "tv"}/${result.id}`}>
              <Card key={result.id} className="cursor-pointer overflow-clip rounded-md min-h-[22rem]">
                <Image
                  src={`https://image.tmdb.org/t/p/w200${result.poster_path}`}
                  alt={result.title || result.name}
                  className="w-full aspect-[2/3] object-cover"
                />
                <h2 className="font-bold w-full text-center p-2.5">
                    {result.title || result.name}{" "}
                    <span className="font-semibold text-muted-foreground">
                      ({(result.release_date || result.first_air_date)?.split("-")[0]})
                    </span>
                </h2>
              </Card>
            </Link>
          ))}
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem
            className={`cursor-pointer select-none ${result.page === 1 ? "opacity-50 pointer-events-none" : ""}`}
          >
            <PaginationPrevious onClick={() => handlePaginationClick(result.page - 1 >= 1 ? result.page - 1 : 1)} />
          </PaginationItem>
          {getVisiblePages(result.page, result.total_pages).map((page, index) =>
            page === "..." ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page} className="cursor-pointer select-none">
                <PaginationLink isActive={page === result.page} onClick={() => handlePaginationClick(page as number)}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem
            className={`cursor-pointer select-none ${
              result.page === result.total_pages ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <PaginationNext
              onClick={() =>
                handlePaginationClick(result.page + 1 <= result.total_pages ? result.page + 1 : result.total_pages)
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
