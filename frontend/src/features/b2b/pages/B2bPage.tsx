import { useSearchParams } from "react-router-dom";
import { WholesaleCustomerCartsView } from "../components/WholesaleCustomerCartsView";
import { WholesaleB2bOrdersListView } from "../components/WholesaleB2bOrdersListView";

export function B2bPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  if (tab === "orders") {
    return <WholesaleB2bOrdersListView />;
  }

  return <WholesaleCustomerCartsView />;
}
