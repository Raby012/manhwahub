import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Home from "./pages/Home";
import SearchPage from "./pages/SearchPage";
import MangaDetail from "./pages/MangaDetail";
import Reader from "./pages/Reader";
import NovelsHome from "./pages/NovelsHome";
import NovelDetail from "./pages/NovelDetail";
import NovelReader from "./pages/NovelReader";
import Bookmarks from "./pages/Bookmarks";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
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
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/search" element={<Layout><SearchPage /></Layout>} />
          <Route path="/manga/:source/:id" element={<Layout><MangaDetail /></Layout>} />
          <Route path="/manga/:source/:id/chapter/:chapterId" element={<Reader />} />
          <Route path="/novels" element={<Layout><NovelsHome /></Layout>} />
          <Route path="/novels/:slug" element={<Layout><NovelDetail /></Layout>} />
          <Route path="/novels/:slug/chapter/:chapterSlug" element={<Layout><NovelReader /></Layout>} />
          <Route path="/bookmarks" element={<Layout><Bookmarks /></Layout>} />
          <Route path="/history" element={<Layout><History /></Layout>} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
