// Define Backend DTOs (Data Transfer Objects)
export interface AuthResponseDTO {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface UserDTO {
  id: string;
  email: string;
  role: string;
}

// Define Frontend Models
export interface AuthState {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// Transformation
export const AuthContract = {
  toAuthState(dto: AuthResponseDTO): AuthState {
    return {
      accessToken: dto.access_token,
      refreshToken: dto.refresh_token,
      user: {
        id: dto.user.id,
        email: dto.user.email,
        role: dto.user.role,
      },
    };
  },
};
