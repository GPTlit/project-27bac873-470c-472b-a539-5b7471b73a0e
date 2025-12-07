import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Categories from "./pages/Categories";
import Category from "./pages/Category";
import BookDetail from "./pages/BookDetail";
import BookReader from "./pages/BookReader";
import History from "./pages/History";
import Downloads from "./pages/Downloads";
import Upload from "./pages/Upload";
import AdminUpload from "./pages/AdminUpload";
import About from "./pages/About";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:name" element={<Category />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/book/:id/read" element={<BookReader />} />
          <Route path="/history" element={<History />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/admin-upload-mrt" element={<AdminUpload />} />
          <Route path="/about" element={<About />} />
          <Route path="/search" element={<Search />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
