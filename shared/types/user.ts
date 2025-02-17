export interface WatchActivity {
  activity_id: number;
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
  user_id: number;
  limit: number;
  offset?: number;
  include_follows?: string;
}

export interface GetUserActivityResponse {
  message: string;
  activity?: WatchActivity[];
}

export interface DeleteUserActivityRequest {
  activity_id: number;
}

export interface DeleteUserActivityResponse {
  message: string;
  success: boolean;
}

export interface DeleteShowCommentRequest {
  comment_id: number;
}

export interface DeleteShowCommentResponse {
  message: string;
  success: boolean;
}

export interface IncrementShowEpisodeRequest {
  show_id: number;
  type: "movie" | "tv";
}

export interface IncrementShowEpisodeResponse {
  message: string;
  tv_episode_number?: number;
  movie_completed?: boolean;
}

export interface MakeUserCommentRequest {
  target_user_id: number;
  comment: string;
}

export interface MakeUserCommentResponse {
  message: string;
  success: boolean;
  comment_id: number;
}

export interface DeleteUserCommentRequest {
  comment_id: number;
}

export interface DeleteUserCommentResponse {
  message: string;
  success: boolean;
}
