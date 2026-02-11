import type { Role } from "@/shared/domain/types";

export interface AuthUserContext {
  userId: string;
  role: Role;
  email?: string;
}

export interface AuthContextPort {
  getCurrentUser(): Promise<AuthUserContext>;
}
