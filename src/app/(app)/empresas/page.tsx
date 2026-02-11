import { Plus } from "lucide-react";

import { CompaniesCrud } from "@/components/companies/companies-crud";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { listCompaniesAction } from "@/modules/companies/interface";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const result = await listCompaniesAction({ status: "all" });
  const initialCompanies = result.success ? result.data : [];
  const initialError = result.success ? null : result.error;

  return (
    <>
      <PageHeader
        badge="Cadastro"
        title="Empresas"
        description="Gerencie clientes para manter sequencial de propostas por empresa."
        action={
          <Button asChild>
            <a href="#company-form">
              <Plus size={14} /> Nova empresa
            </a>
          </Button>
        }
      />

      <CompaniesCrud
        initialCompanies={initialCompanies}
        initialError={initialError}
      />
    </>
  );
}
