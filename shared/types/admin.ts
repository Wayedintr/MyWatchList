export interface ManagedUser {
  username: string;
  password: string;
  mail: string;
  role: string;
  id: number;
}

export interface AddUserRequest {
  user: ManagedUser;
}

export interface AddUserResponse {
  message: string;
  user?: ManagedUser;
}

export interface UserListRequest {
  page: number;
  query?: string;
}

export interface UserListResponse {
  message: string;
  users?: ManagedUser[];
  pagination?: {
    totalPages: number;
    currentPage: number;
  };
}

export interface DeleteUserRequest {
  user_id: number;
}

export interface DeleteUserResponse {
  message: string;
  success: boolean;
}

export interface ModifyUserRequest {
  user: ManagedUser;
}

export interface ModifyUserResponse {
  message: string;
  success: boolean;
}

export interface ChangeUserPasswordRequest {
  user_id: number;
  new_password: string;
}

export interface ChangeUserPasswordResponse {
  message: string;
  success: boolean;
}

export interface RemoveAllShowsResponse {
  message: string;
  success: boolean;
}
