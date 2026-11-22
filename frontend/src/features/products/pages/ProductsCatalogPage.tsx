import { useSearchParams } from "react-router-dom";
import { WholesaleSkuListView } from "../components/WholesaleSkuListView";
import { WholesaleCreateNewSkuView } from "../components/WholesaleCreateNewSkuView";
import { WholesaleAgingStocksView } from "../components/WholesaleAgingStocksView";
import { WholesaleSkuWiseMarginView } from "../components/WholesaleSkuWiseMarginView";
import { WholesaleCategoryWiseSalesView } from "../components/WholesaleCategoryWiseSalesView";

export function ProductsCatalogPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || searchParams.get("view") || "list";

  switch (tab) {
    case "list":
    case "sku":
    case "names":
      return <WholesaleSkuListView />;

    case "create":
    case "new":
    case "sknew":
      return <WholesaleCreateNewSkuView />;

    case "aging":
    case "age":
    case "stocks":
      return <WholesaleAgingStocksView />;

    case "margin":
    case "margins":
    case "skm":
      return <WholesaleSkuWiseMarginView />;

    case "categories":
    case "category":
    case "catw":
      return <WholesaleCategoryWiseSalesView />;

    default:
      return <WholesaleSkuListView />;
  }
}
