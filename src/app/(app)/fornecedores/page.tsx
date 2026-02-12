import { SuppliersCrud } from "@/components/suppliers/suppliers-crud";
import { listSuppliersAction } from "@/modules/suppliers/interface";

export const dynamic = "force-dynamic";

interface SuppliersPageProps {
  searchParams: Promise<{
    new?: string;
  }>;
}

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const params = await searchParams;
  const openCreateOnLoad = params.new === "1";
  const result = await listSuppliersAction({ status: "all" });
  const initialSuppliers = result.success ? result.data : [];
  const initialError = result.success ? null : result.error;

  return (
    <SuppliersCrud
      key={openCreateOnLoad ? "suppliers-crud-new" : "suppliers-crud-default"}
      initialSuppliers={initialSuppliers}
      initialError={initialError}
      openCreateOnLoad={openCreateOnLoad}
    />
  );
}
