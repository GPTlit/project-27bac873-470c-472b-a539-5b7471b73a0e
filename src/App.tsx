import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConsentDialog } from "@/components/ConsentDialog";
import { DevicePermissionPrompt } from "@/components/DevicePermissionPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Categories from "./pages/Categories";
import Category from "./pages/Category";
import BookDetail from "./pages/BookDetail";
import BookReader from "./pages/BookReader";
import History from "./pages/History";
import Downloads from "./pages/Downloads";
import Upload from "./pages/Upload";
import AdminPanel from "./pages/AdminPanel";
import About from "./pages/About";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import AuthorChat from "./pages/AuthorChat";
import Eterke from "./pages/Eterke";
import Store from "./pages/Store";
import Profile from "./pages/Profile";
import Copyright from "./pages/Copyright";
import Privacy from "./pages/Privacy";
import Feed from "./pages/stories/Feed";
import Explore from "./pages/stories/Explore";
import Write from "./pages/stories/Write";
import WriteStory from "./pages/stories/WriteStory";
import WritePart from "./pages/stories/WritePart";
import StoryPage from "./pages/stories/StoryPage";
import ReadPart from "./pages/stories/ReadPart";
import AuthorProfile from "./pages/stories/AuthorProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ConsentDialog />
              <DevicePermissionPrompt />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                {/* Public routes - viewable without login */}
                <Route path="/" element={<Index />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/category/:name" element={<Category />} />
                <Route path="/book/:id" element={<BookDetail />} />
                <Route path="/search" element={<Search />} />
                <Route path="/about" element={<About />} />
                <Route path="/copyright" element={<Copyright />} />
                <Route path="/privacy" element={<Privacy />} />
                {/* Stories — public browsing */}
                <Route path="/explore" element={<Explore />} />
                <Route path="/story/:id" element={<StoryPage />} />
                <Route path="/u/:username" element={<AuthorProfile />} />
                {/* Protected routes - require authentication */}
                <Route path="/book/:id/read" element={<ProtectedRoute><BookReader /></ProtectedRoute>} />
                <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                <Route path="/write" element={<ProtectedRoute><Write /></ProtectedRoute>} />
                <Route path="/write/:id" element={<ProtectedRoute><WriteStory /></ProtectedRoute>} />
                <Route path="/write/:id/parts/:partId" element={<ProtectedRoute><WritePart /></ProtectedRoute>} />
                <Route path="/story/:id/read/:partId" element={<ProtectedRoute><ReadPart /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/downloads" element={<ProtectedRoute><Downloads /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                <Route path="/admin-upload-mrt" element={<Navigate to="/admin-panel" replace />} />
                <Route path="/admin-panel" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
                <Route path="/author-chat" element={<ProtectedRoute><AuthorChat /></ProtectedRoute>} />
                <Route path="/eterke" element={<ProtectedRoute><Eterke /></ProtectedRoute>} />
                <Route path="/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
