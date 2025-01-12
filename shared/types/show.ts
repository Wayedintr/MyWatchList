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

  genres: string[];
  seasons: Season[];
  comments: Comment[];
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

export interface Comment {
  comment_id: number;
  comment: string;
  username: string;
  date: string;
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

export interface UserShowInfo {
  list_type?: "Plan To Watch" | "Watching" | "Completed" | "Dropped" | "On Hold" | "" | null;
  season_number?: number | null | "";
  episode_number?: number | null | "";
  score?: number | null | "";
  episode_count?: number | null | "";
  number_of_seasons?: number | null | "";
}

// List post
export interface ListRequest {
  show_id: number;
  is_movie: boolean;
  user_show_info: UserShowInfo;
}

export interface ListResponse {
  message: string;
}

// List get
export interface ListGetRequest {
  show_id: number;
  is_movie: boolean;
}

export interface ListGetResponse {
  message: string;
  show_user_info?: UserShowInfo;
}

export interface showShort {
  show_id: number;
  is_movie: boolean;
  poster_path: string | null;
  title: string | null;
  user_show_info?: UserShowInfo;
}

// User show list
export interface userShowRequest {
  message: string;
  username: string;
}

export interface userShowResponse {
  message: string;
  show_list?: showShort[];
}

// User stats
export interface userStatsResponse {
  message: string;
  stats?: userStats;
}

export interface userStatsRequest {
  username: string;
}

export interface userStats {
  watching_count: number;
  completed_count: number;
  dropped_count: number;
  on_hold_count: number;
  plan_to_watch_count: number;
  total_entries: number;
  total_episodes_watched: number;
}

export interface userFollowRequest {
  followed_username: string;
  is_following: boolean;
}

export interface userFollowResponse {
  message: string;
}

export interface userFollowsResponse {
  message: string;
  follows: boolean;
}

export interface userFollowsRequest {
  username: string;
}

export interface MakeShowCommentRequest {
  show_id: number;
  type: "tv" | "movie";
  comment: string;
}

export interface MakeShowCommentResponse {
  message: string;
  success: boolean;
  comment_id: number;
}

export interface UserShowListRequest {
  user_id: number;
  list_type?: "Plan To Watch" | "Watching" | "Completed" | "Dropped" | "On Hold";
  show_type?: "movie" | "tv";
}

export interface UserShowListResponse {
  message: string;
  show_list?: showShort[];
}
