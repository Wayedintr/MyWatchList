export interface Show {
  show_id: number;
  is_movie: boolean;
  adult: boolean | null;
  backdrop_path: string | null;
  origin_country: string | null;
  original_language: string | null;
  original_title: string | null;
  overview: string | null;
  popularity: number | null;
  poster_path: string | null;
  release_date: string | null;
  runtime: number | null;
  status: string | null;
  tagline: string | null;
  title: string | null;
  vote_average: number | null;
  vote_count: number | null;
  episode_run_time: number[] | null;
  in_production: boolean | null;
  number_of_episodes: number | null;
  number_of_seasons: number | null;

  seasons: Season[];
}

export interface ShowRequest {
  show_id: number;
  type: "movie" | "tv";
}

export interface ShowResponse {
  message: string;
  show?: Show;
}

export interface Season {
  air_date: string | null;
  episode_count: number | null;
  name: string | null;
  overview: string | null;
  poster_path: string | null;
  season_number: number | null;
  vote_average: number | null;

  episodes: Episode[];
}

export interface Episode {
  name: string | null;
  overview: string | null;
  vote_average: number | null;
  vote_count: number | null;
  air_date: string | null;
  episode_number: number | null;
  season_number: number | null;
  runtime: number | null;
  still_path: string | null;
}

export interface SearchRequest {
  query: string;
  type: "movie" | "tv";
  page?: number;
}

export interface SearchResponse {
  message: string;
  result?: SearchApiResponse;
}

export interface SearchApiResponse {
  page: number;
  results: any[];
  total_pages: number;
  total_results: number;
}
