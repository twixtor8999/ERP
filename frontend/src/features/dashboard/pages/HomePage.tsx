import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function HomePage() {
  const navigate = useNavigate();
  const [pageSearch, setPageSearch] = useState("");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      toast.success("System Up to Date", {
        description: "AI Smart Bazar v5.08 is running the latest enterprise build.",
      });
    }, 600);
  };

  return (
    <div className="space-y-4 max-w-4xl pb-12">
      {/* Top Header matching reference app */}
      <div className="space-y-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d1b4c]">
          Home Page
        </h1>

        {/* Search in this page... input with 480px max-width */}
        <div className="relative max-w-[480px]">
          <Search className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
          <Input
            type="text"
            placeholder="Search in this page..."
            value={pageSearch}
            onChange={(e) => setPageSearch(e.target.value)}
            className="pl-9 bg-white border-slate-300 text-slate-800 text-sm h-10 rounded-lg shadow-2xs focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {/* Card 1: Welcome to Ai Smart Bazar (max-w-[620px]) */}
      <Card className="max-w-[620px] border border-slate-200/90 shadow-2xs bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0d1b4c] tracking-tight">
              Welcome to Ai Smart Bazar
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-normal">
              Billing, GST, inventory, customers and reports in one app.
            </p>
          </div>

          <div>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-[#132038] hover:bg-[#0c1626] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-sm transition"
            >
              Open Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: App version v5.08 (max-w-[620px]) */}
      <Card className="max-w-[620px] border border-slate-200/90 shadow-2xs bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex items-center gap-3 flex-wrap">
          <span className="text-xs sm:text-sm text-slate-700 font-medium">
            App version <b className="font-bold text-slate-900">v5.08</b>
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckUpdate}
            disabled={isCheckingUpdate}
            className="border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 h-8 px-2.5"
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Check for update</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
