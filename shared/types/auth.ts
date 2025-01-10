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
}

export interface UserResponse {
  message: string;
  user?: User;
}

export interface UserPublic {
  username: string;
  user_id: number;
}

export interface UserPublicResponse {
  message: string;
  user?: UserPublic;
}

export interface JWTPayload {
  id: string;
  mail: string;
}
