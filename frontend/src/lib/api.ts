import { LoginRequest, LoginResponse, RegisterRequest, UserPublicResponse, UserResponse } from "@shared/types/auth";
import { DeleteUserActivityRequest, GetUserActivityRequest, GetUserActivityResponse } from "@shared/types/user";
import {
  ListGetRequest,
  ListGetResponse,
  ListRequest,
  ListResponse,
  SearchRequest,
  SearchResponse,
  ShowRequest,
  ShowResponse,
  userShowRequest,
  userShowResponse,
  userStatsRequest,
  userStatsResponse,
  userFollowRequest,
  userFollowResponse,
} from "@shared/types/show";

const API_BASE_URL = process.env.API_URL || "http://localhost:3000"; // Default to empty string if not set

// Generic API Handler
const apiRequest = async <T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> => {
  try {
    let url = `${API_BASE_URL}${endpoint}`;

    // If the method is GET, serialize the body as query parameters
    if ((method === "GET" || method === "DELETE") && body) {
      const queryString = new URLSearchParams(body as Record<string, string>).toString();
      url += `?${queryString}`;
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      // Only include body for non-GET methods
      body: method !== "GET" && method !== "DELETE" && body ? JSON.stringify(body) : undefined,
      credentials: "include", // Include cookies for authentication
    });

    const data: T = await response.json();

    if (!response.ok) {
      throw new Error((data as any).message || "Request failed");
    }

    return data;
  } catch (error: any) {
    console.error(`API Request failed: ${endpoint}`, error.message || error);
    throw new Error(error.message || "An unknown error occurred");
  }
};

// Login Function
export const login = async (loginRequest: LoginRequest): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>("/auth/login", "POST", loginRequest);
};

// Register Function
export const register = async (registerRequest: RegisterRequest): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>("/auth/register", "POST", registerRequest);
};

// Logout Function
export const logout = async (): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>("/auth/logout", "GET");
};

// Authenticated User Function
export const me = async (): Promise<UserResponse> => {
  return apiRequest<UserResponse>("/auth/me", "GET");
};

// Public user info
export const user = async (username: string): Promise<UserPublicResponse> => {
  return apiRequest<UserPublicResponse>(`/user/info?username=${username}`, "GET");
};

// Show info
export const show = async (showRequest: ShowRequest): Promise<ShowResponse> => {
  return apiRequest<ShowResponse>(`/show/info`, "GET", showRequest);
};

export const search = async (searchRequest: SearchRequest): Promise<SearchResponse> => {
  return apiRequest<SearchResponse>(`/show/search`, "GET", searchRequest);
};

export const list = async (listRequest: ListRequest): Promise<ListResponse> => {
  return apiRequest<ListResponse>(`/show/list`, "POST", listRequest);
};

export const listget = async (listGetRequest: ListGetRequest): Promise<ListGetResponse> => {
  return apiRequest<ListGetResponse>(`/show/listget`, "GET", listGetRequest);
};

export const usershows = async (userShowRequest: userShowRequest): Promise<userShowResponse> => {
  return apiRequest<userShowResponse>(`/user/shows`, "GET", userShowRequest);
};

export const userstats = async (userStatsRequest: userStatsRequest): Promise<userStatsResponse> => {
  return apiRequest<userStatsResponse>(`/user/statistics`, "GET", userStatsRequest);
};

export const userfollow = async (userFollowRequest: userFollowRequest): Promise<userFollowResponse> => {
  return apiRequest<userFollowResponse>(`/user/follow`, "POST", userFollowRequest);
};

export const userActivity = async (
  getUserActivityRequest: GetUserActivityRequest
): Promise<GetUserActivityResponse> => {
  return apiRequest<GetUserActivityResponse>(`/user/activity`, "GET", getUserActivityRequest);
};

export const deleteUserActivity = async (
  deleteUserActivityRequest: DeleteUserActivityRequest
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/user/delete-activity`, "DELETE", deleteUserActivityRequest);
};
