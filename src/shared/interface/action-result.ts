import { DomainError } from "@/shared/domain/errors";

export type ActionResult<T> =
  | {
    success: true;
    data: T;
  }
  | {
    success: false;
    error: string;
    code?: string;
  };

export function toActionFailure(error: unknown): ActionResult<never> {
  if (error instanceof DomainError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }

  console.error(error);

  return {
    success: false,
    error: "Erro inesperado durante o processamento da ação",
    code: "INTERNAL_ERROR",
  };
}
