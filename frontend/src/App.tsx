import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Board from "./pages/Board";
import Astar from "./pages/Astar";
import Connections from "./pages/Connections";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route wrapper - redirects to onboarding if not connected
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isConnected = localStorage.getItem("astar_connected") === "true";
  
  if (!isConnected) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Board />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/astar"
            element={
              <ProtectedRoute>
                <Layout>
                  <Astar />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <Layout>
                  <Connections />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
