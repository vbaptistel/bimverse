import { ShieldCheck, UserCog } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UsersAdminPage() {
  return (
    <>
      <PageHeader
        badge="Admin"
        title="Usuários e Permissões"
        description="Controle de acesso para perfis admin e comercial."
        action={<Button variant="secondary">Convidar usuário</Button>}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCog size={16} /> Perfis disponíveis</CardTitle>
            <CardDescription>Permissões de alto nível para o MVP.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg bg-[#f5f8fb] p-3">
              <p className="font-medium text-[#0b1220]">Admin</p>
              <p className="text-[#5b6d84]">Gerencia cadastros, usuários e configurações.</p>
            </div>
            <div className="rounded-lg bg-[#f5f8fb] p-3">
              <p className="font-medium text-[#0b1220]">Comercial</p>
              <p className="text-[#5b6d84]">Opera propostas, revisões, anexos e fornecedores.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck size={16} /> Usuários cadastrados</CardTitle>
            <CardDescription>Base para integração com auth e perfis reais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-dashed border-[#c9d5e2] bg-[#f8fbff] p-4 text-sm text-[#5b6d84]">
              Nenhum usuário adicional cadastrado.
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
