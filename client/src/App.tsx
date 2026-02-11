import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader } from "@/components/Loader";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Matches from "@/pages/Matches";
import Scores from "@/pages/Scores";
import MatchDetail from "@/pages/MatchDetail";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <ScrollToTop />
          <Loader />
          <Toaster />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/scores" element={<Scores />} />
            <Route path="/match/:matchId" element={<MatchDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
