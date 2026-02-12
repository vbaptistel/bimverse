import Link from "next/link";
import { Plus } from "lucide-react";

import { CompaniesCrud } from "@/components/companies/companies-crud";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { listCompaniesAction } from "@/modules/companies/interface";

export const dynamic = "force-dynamic";

interface CompaniesPageProps {
  searchParams: Promise<{
    new?: string;
  }>;
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const params = await searchParams;
  const openCreateOnLoad = params.new === "1";
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
            <Link href="/empresas?new=1">
              <Plus size={14} /> Nova empresa
            </Link>
          </Button>
        }
      />

      <CompaniesCrud
        key={openCreateOnLoad ? "companies-crud-new" : "companies-crud-default"}
        initialCompanies={initialCompanies}
        initialError={initialError}
        openCreateOnLoad={openCreateOnLoad}
      />
    </>
  );
}
