import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acesso Bimverse</CardTitle>
          <CardDescription>
            Estrutura inicial da tela de login. Integração com Supabase Auth será conectada na próxima etapa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="comercial@bimverse.com.br" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>

            <Button type="button">Entrar</Button>
          </form>

          <p className="mt-4 text-sm text-[#5b6d84]">
            Ambiente de estruturação de telas. Para navegar: <Link href="/dashboard" className="font-medium text-[#0f766e]">abrir dashboard</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
