import { Link } from "react-router-dom";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
        <h2 className="text-xl font-semibold">Page Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The page or ERP resource you requested does not exist or has been relocated.
        </p>
        <Button asChild className="gap-2">
          <Link to="/dashboard">
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
