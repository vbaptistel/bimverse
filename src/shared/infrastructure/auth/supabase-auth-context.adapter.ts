import type {
  AuthContextPort,
  AuthUserContext,
} from "@/shared/application/ports/auth-context.port";
import { AuthorizationError } from "@/shared/domain/errors";
import type { Role } from "@/shared/domain/types";
import { env } from "@/shared/infrastructure/env";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server-client";

function isRole(value: string | undefined): value is Role {
  return value === "admin" || value === "comercial";
}

export class SupabaseAuthContextAdapter implements AuthContextPort {
  async getCurrentUser(): Promise<AuthUserContext> {
    const bypassUser = env.devBypassUserId();
    const bypassRole = env.devBypassRole();

    if (bypassUser && isRole(bypassRole)) {
      return {
        userId: bypassUser,
        role: bypassRole,
        email: "dev-bypass@local",
      };
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new AuthorizationError("Usuário não autenticado");
    }

    const rawRole = user.user_metadata.role as string | undefined;
    const role: Role = isRole(rawRole) ? rawRole : "comercial";

    return {
      userId: user.id,
      role,
      email: user.email,
    };
  }
}
