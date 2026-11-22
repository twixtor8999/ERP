import { useSearchParams } from "react-router-dom";
import { WholesaleExpensesView } from "../components/WholesaleExpensesView";
import { WholesaleInwardExpensesView } from "../components/WholesaleInwardExpensesView";

export function ExpensesPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || searchParams.get("view") || "expenses";

  if (tab === "inward" || tab === "inexp") {
    return <WholesaleInwardExpensesView />;
  }

  return <WholesaleExpensesView />;
}
