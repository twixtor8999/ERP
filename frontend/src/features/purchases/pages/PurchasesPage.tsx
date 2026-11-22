import { useSearchParams } from "react-router-dom";
import { WholesalePurchaseListView } from "../components/WholesalePurchaseListView";
import { WholesaleNewPurchaseView } from "../components/WholesaleNewPurchaseView";
import { WholesaleAutoPoView } from "../components/WholesaleAutoPoView";
import { WholesalePurchaseReturnView } from "../components/WholesalePurchaseReturnView";
import { WholesaleVendorsView } from "../components/WholesaleVendorsView";

export function PurchasesPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "list";

  if (tab === "new") {
    return <WholesaleNewPurchaseView />;
  }

  if (tab === "autopo" || tab === "apo") {
    return <WholesaleAutoPoView />;
  }

  if (tab === "returns" || tab === "prt") {
    return <WholesalePurchaseReturnView />;
  }

  if (tab === "vendor" || tab === "ven") {
    return <WholesaleVendorsView />;
  }

  return <WholesalePurchaseListView />;
}
