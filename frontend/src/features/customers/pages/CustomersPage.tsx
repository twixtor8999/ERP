import { useSearchParams } from "react-router-dom";
import { WholesaleNewCustomerView } from "../components/WholesaleNewCustomerView";
import { WholesaleCustomersListView } from "../components/WholesaleCustomersListView";
import { WholesaleRoutePlannerView } from "../components/WholesaleRoutePlannerView";

export function CustomersPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  if (tab === "new") {
    return <WholesaleNewCustomerView />;
  }

  if (tab === "routes" || tab === "rplan" || tab === "planner") {
    return <WholesaleRoutePlannerView />;
  }

  // Default to customers list
  return <WholesaleCustomersListView />;
}
