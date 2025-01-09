export interface WatchActivity {
  username: string;
  show_id: number;
  type: "movie" | "tv";
  date: string;
  list_type: "Plan To Watch" | "Watching" | "Completed" | "Dropped" | "On Hold" | "" | null;
  season_number?: number;
  episode_number?: number;
  image_path: string;
  season_name: string | null;
  episode_name: string | null;
  show_name: string | null;
}

export interface GetUserActivityRequest {
  username: string;
  offset?: number;
  limit?: number;
}

export interface GetUserActivityResponse {
  message: string;
  activity?: WatchActivity[];
}

export interface DeleteUserActivityRequest {
  show_id: number;
  type: "movie" | "tv";
  date: string;
}
