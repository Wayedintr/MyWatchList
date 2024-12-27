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
  id: string;
  mail: string;
  username: string;
}

export interface UserResponse {
  message: string;
  user?: User;
}

export interface UserPublic {
  username: string;
}

export interface UserPublicResponse {
  message: string;
  user?: UserPublic;
}

export interface JWTPayload {
  id: string;
  mail: string;
}
