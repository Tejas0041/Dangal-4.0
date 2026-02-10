import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <Card className="w-full max-w-md mx-4 bg-zinc-900 border-white/10">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-white">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-400 mb-6">
            The page you're looking for doesn't exist.
          </p>
          
          <Link to="/">
            <button className="w-full py-3 bg-primary text-black font-bold uppercase tracking-wider hover:bg-yellow-400 transition-colors">
              Back to Home
            </button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
