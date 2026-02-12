"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LayoutGrid,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/shared/infrastructure/supabase/browser-client";

const highlights: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
    {
      title: "Pipeline centralizado",
      description: "Acompanhe propostas, revisoes e etapas comerciais em um unico lugar.",
      icon: LayoutGrid,
    },
    {
      title: "Historico rastreavel",
      description: "Cada mudanca fica registrada para facilitar auditoria e alinhamento da equipe.",
      icon: ShieldCheck,
    },
  ];

function resolveNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

function toFriendlyAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Credenciais invalidas. Confira e-mail e senha.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Seu e-mail ainda nao foi confirmado.";
  }

  return "Nao foi possivel autenticar agora. Tente novamente.";
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nextPath = resolveNextPath(searchParams.get("next"));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage("Preencha e-mail e senha para continuar.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const friendlyMessage = toFriendlyAuthError(error.message);
        setErrorMessage(friendlyMessage);
        toast.error(friendlyMessage);
        setIsSubmitting(false);
        return;
      }

      toast.success("Login realizado com sucesso.");
      router.replace(nextPath);
      router.refresh();
    } catch {
      setErrorMessage("Erro inesperado ao entrar. Tente novamente em instantes.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 p-4 font-[family-name:var(--font-ibm-plex-sans)] sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(45,212,191,0.2),transparent_45%),radial-gradient(circle_at_88%_90%,rgba(6,182,212,0.22),transparent_42%)]" />

      <div className="relative mx-auto grid min-h-[calc(100dvh-64px)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-[0_36px_90px_-36px_rgba(15,23,42,0.95)] lg:grid-cols-[1.15fr_0.85fr]">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 right-[-3rem] size-80 rounded-full bg-cyan-200/20 blur-2xl" />

          <div className="relative animate-in fade-in-0 slide-in-from-left-5 duration-700">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">Bimverse Comercial</p>
            <h2 className="mt-6 max-w-md font-[family-name:var(--font-sora)] text-5xl font-semibold leading-[1.05]">
              Gestao inteligente de propostas BIM
            </h2>
            <p className="mt-5 max-w-md text-lg text-cyan-50/95">
              Plataforma unica para conduzir propostas com previsibilidade e foco em conversao.
            </p>
          </div>

          <ul className="relative space-y-4">
            {highlights.map((item, index) => {
              const Icon = item.icon;
              const delayClass =
                index === 0 ? "delay-150" : index === 1 ? "delay-300" : "delay-500";

              return (
                <li
                  key={item.title}
                  className={`flex items-start gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm animate-in fade-in-0 slide-in-from-left-4 duration-700 ${delayClass}`}
                >
                  <span className="mt-1 rounded-lg bg-white/20 p-2">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-cyan-50/85">{item.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="relative flex items-center justify-center bg-slate-50 p-6 sm:p-10 lg:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(13,148,136,0.14),transparent_38%),radial-gradient(circle_at_84%_95%,rgba(14,116,144,0.16),transparent_40%)]" />

          <div className="relative w-full max-w-md space-y-7 animate-in fade-in-0 slide-in-from-right-4 duration-700">
            <div className="rounded-2xl border border-teal-100 bg-white/90 p-4 text-sm text-slate-600 lg:hidden">
              Acesso unico para toda a equipe comercial. Entre com seu e-mail corporativo.
            </div>

            <header className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                Login corporativo
              </p>
              <h1 className="font-[family-name:var(--font-sora)] text-3xl font-semibold text-slate-900 sm:text-4xl">
                Bem-vindo de volta
              </h1>
              <p className="text-sm text-slate-600">
                Entre com suas credenciais para acessar o sistema comercial.
              </p>
            </header>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">
                  E-mail corporativo
                </Label>
                <InputGroup className="h-11 rounded-xl border-slate-200 bg-white">
                  <InputGroupAddon>
                    <InputGroupText>
                      <Mail className="size-4 text-slate-500" aria-hidden />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu.email@bimverse.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isSubmitting}
                    className="h-full rounded-xl text-base text-slate-900 placeholder:text-slate-400"
                  />
                </InputGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">
                  Senha
                </Label>
                <InputGroup className="h-11 rounded-xl border-slate-200 bg-white">
                  <InputGroupAddon>
                    <InputGroupText>
                      <KeyRound className="size-4 text-slate-500" aria-hidden />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    className="h-full rounded-xl text-base text-slate-900 placeholder:text-slate-400"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setPasswordVisible((prevState) => !prevState)}
                      className="size-7 rounded-md text-slate-500 hover:text-slate-700"
                      disabled={isSubmitting}
                    >
                      {isPasswordVisible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              {errorMessage ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={isSubmitting || !email.trim() || !password}
                className="h-11 w-full rounded-xl bg-teal-700 text-base font-semibold text-white hover:bg-teal-600"
              >
                {isSubmitting ? "Entrando..." : "Entrar no sistema"}
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </form>

            <p className="text-xs text-slate-500">
              Precisa de ajuda? Entre em contato com o TI pelo e-mail{" "}
              <a
                className="font-semibold text-teal-700 hover:text-teal-600"
                href="mailto:ti@bimverse.com"
              >
                ti@bimverse.com
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<main className="min-h-screen bg-slate-950 font-[family-name:var(--font-ibm-plex-sans)]" />}
    >
      <LoginContent />
    </Suspense>
  );
}
