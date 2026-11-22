import { useSearchParams, useNavigate } from "react-router-dom";
import { WholesaleNewVehicleView } from "../components/WholesaleNewVehicleView";
import { WholesaleVehiclesListView } from "../components/WholesaleVehiclesListView";
import { WholesaleVehicleTripsView } from "../components/WholesaleVehicleTripsView";
import { WholesaleDieselRateView } from "../components/WholesaleDieselRateView";
import { WholesaleCreateTripModal } from "../components/WholesaleCreateTripModal";

export function VehiclesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get("tab");

  if (tab === "new") {
    return <WholesaleNewVehicleView />;
  }

  if (tab === "trips") {
    return <WholesaleVehicleTripsView />;
  }

  if (tab === "create-trip") {
    return (
      <div className="relative">
        <WholesaleVehicleTripsView />
        <WholesaleCreateTripModal
          isOpen={true}
          onClose={() => navigate("/vehicles?tab=trips")}
        />
      </div>
    );
  }

  if (tab === "diesel" || tab === "dsl") {
    return <WholesaleDieselRateView />;
  }

  // Default to Vehicles List (?tab=list)
  return <WholesaleVehiclesListView />;
}
