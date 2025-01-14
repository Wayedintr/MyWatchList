import { Comment } from "./show";

export interface LoginRequest {
  mail: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user?: User;
}

export interface RegisterRequest {
  mail: string;
  password: string;
  username: string;
}

export interface User {
  id: number;
  mail: string;
  username: string;
  role: string;
}

export interface UserResponse {
  message: string;
  user?: User;
}

export interface UserPublic {
  username: string;
  user_id: number;
  comments: Comment[];
}

export interface UserPublicResponse {
  message: string;
  user?: UserPublic;
}

export interface UserFriendsRequest {
  username: string;
}

export interface UserFriendsResponse {
  message: string;
  friends?: UserPublic[];
}

export interface JWTPayload {
  id: string;
  mail: string;
  role: string;
}
