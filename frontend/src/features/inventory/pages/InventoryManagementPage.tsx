import { useSearchParams } from "react-router-dom";
import { WholesaleStockMovementView } from "../components/WholesaleStockMovementView";
import { WholesaleRealtimeInventoryView } from "../components/WholesaleRealtimeInventoryView";
import { WholesalePunchOrdersView } from "../components/WholesalePunchOrdersView";
import { WholesaleDailyStockAuditView } from "../components/WholesaleDailyStockAuditView";
import { WholesaleDailyAuditReportView } from "../components/WholesaleDailyAuditReportView";
import { WholesalePhysicalStocksView } from "../components/WholesalePhysicalStocksView";
import { WholesaleLiveInventoryVsSalesView } from "../components/WholesaleLiveInventoryVsSalesView";
import { WholesaleStockSplitView } from "../components/WholesaleStockSplitView";

export function InventoryManagementPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || searchParams.get("view") || "movement";

  switch (tab) {
    case "movement":
    case "imove":
    case "idaily":
      return <WholesaleStockMovementView />;

    case "realtime":
    case "ireal":
      return <WholesaleRealtimeInventoryView />;

    case "punch":
      return <WholesalePunchOrdersView />;

    case "audit":
    case "saud":
      return <WholesaleDailyStockAuditView />;

    case "report":
    case "saudr":
      return <WholesaleDailyAuditReportView />;

    case "physical":
    case "supr":
    case "physr":
      return <WholesalePhysicalStocksView />;

    case "livesales":
    case "livs":
      return <WholesaleLiveInventoryVsSalesView />;

    case "split":
      return <WholesaleStockSplitView />;

    default:
      return <WholesaleStockMovementView />;
  }
}
