import { CompaniesCrud } from "@/components/companies/companies-crud";
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
    <CompaniesCrud
      key={openCreateOnLoad ? "companies-crud-new" : "companies-crud-default"}
      initialCompanies={initialCompanies}
      initialError={initialError}
      openCreateOnLoad={openCreateOnLoad}
    />
  );
}
