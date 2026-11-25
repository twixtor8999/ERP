import { useSearchParams } from "react-router-dom";
import { WholesaleNewVehicleView } from "../components/WholesaleNewVehicleView";
import { WholesaleVehiclesListView } from "../components/WholesaleVehiclesListView";
import { WholesaleVehicleTripsView } from "../components/WholesaleVehicleTripsView";
import { WholesaleDieselRateView } from "../components/WholesaleDieselRateView";
import { WholesaleCreateTripView } from "../components/WholesaleCreateTripView";

export function VehiclesPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  if (tab === "new") {
    return <WholesaleNewVehicleView />;
  }

  if (tab === "trips") {
    return <WholesaleVehicleTripsView />;
  }

  if (tab === "create-trip") {
    return <WholesaleCreateTripView />;
  }

  if (tab === "diesel" || tab === "dsl") {
    return <WholesaleDieselRateView />;
  }

  // Default to Vehicles List (?tab=list)
  return <WholesaleVehiclesListView />;
}
