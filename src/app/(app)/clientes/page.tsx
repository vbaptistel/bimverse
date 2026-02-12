import { CustomersCrud } from "@/components/customers/customers-crud";
import { listCustomersAction } from "@/modules/customers/interface";

export const dynamic = "force-dynamic";

interface CustomersPageProps {
  searchParams: Promise<{
    new?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const openCreateOnLoad = params.new === "1";
  const result = await listCustomersAction({ status: "all" });
  const initialCustomers = result.success ? result.data : [];
  const initialError = result.success ? null : result.error;

  return (
    <CustomersCrud
      key={openCreateOnLoad ? "customers-crud-new" : "customers-crud-default"}
      initialCustomers={initialCustomers}
      initialError={initialError}
      openCreateOnLoad={openCreateOnLoad}
    />
  );
}
