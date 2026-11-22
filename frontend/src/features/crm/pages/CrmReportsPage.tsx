import { useSearchParams } from "react-router-dom";
import { CrmDashboardView } from "../components/CrmDashboardView";
import { CrmSalesView } from "../components/CrmSalesView";
import { CrmOrderTotalView } from "../components/CrmOrderTotalView";
import { CrmOrderStatusView } from "../components/CrmOrderStatusView";
import { CrmCancelledOrdersView } from "../components/CrmCancelledOrdersView";
import { CrmTeamReportView } from "../components/CrmTeamReportView";

export function CrmReportsPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || searchParams.get("view") || "dashboard";

  if (tab === "sales" || tab === "crms") {
    return <CrmSalesView />;
  }

  if (tab === "order-total" || tab === "ot") {
    return <CrmOrderTotalView />;
  }

  if (tab === "order-status" || tab === "ost") {
    return <CrmOrderStatusView />;
  }

  if (tab === "cancelled" || tab === "cxl") {
    return <CrmCancelledOrdersView />;
  }

  if (tab === "team" || tab === "cteamo" || tab === "team-crm") {
    return <CrmTeamReportView />;
  }

  // Default: CRM Dashboard
  return <CrmDashboardView />;
}
