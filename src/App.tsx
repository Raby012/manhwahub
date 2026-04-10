import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import ManhwaDetail from "./pages/ManhwaDetail";
import Reader from "./pages/Reader";
import Bookmarks from "./pages/Bookmarks";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LayoutWithNav({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LayoutWithNav><Index /></LayoutWithNav>} />
          <Route path="/browse" element={<LayoutWithNav><Browse /></LayoutWithNav>} />
          <Route path="/manhwa/:id" element={<LayoutWithNav><ManhwaDetail /></LayoutWithNav>} />
          <Route path="/bookmarks" element={<LayoutWithNav><Bookmarks /></LayoutWithNav>} />
          <Route path="/history" element={<LayoutWithNav><History /></LayoutWithNav>} />
          <Route path="/read/:manhwaId/:chapterId" element={<Reader />} />
          <Route path="*" element={<LayoutWithNav><NotFound /></LayoutWithNav>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
