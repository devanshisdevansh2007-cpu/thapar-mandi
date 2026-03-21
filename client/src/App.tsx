import { Switch, Route } from "wouter";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ChatPage from "@/pages/chat";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Landing } from "@/pages/Landing";
import { Auth } from "@/pages/Auth";
import { Dashboard } from "@/pages/Dashboard";
import { Marketplace } from "@/pages/Marketplace";
import { Sell } from "@/pages/Sell";
import { ItemDetails } from "@/pages/ItemDetails";
import { MyListings } from "@/pages/MyListings";
import MessagesPage from "@/pages/messages";
import AdminPage from "@/pages/AdminPage"; // ✅ ADDED

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={() => <Auth isLogin={true} />} />
      <Route path="/signup" component={() => <Auth isLogin={false} />} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />

      {/* Protected Routes */}
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/marketplace" component={() => <ProtectedRoute component={Marketplace} />} />
      <Route path="/sell" component={() => <ProtectedRoute component={Sell} />} />
      <Route path="/item/:id" component={() => <ProtectedRoute component={ItemDetails} />} />
      <Route path="/my-listings" component={() => <ProtectedRoute component={MyListings} />} />

      {/* ✅ ADMIN ROUTE */}
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />

      <Route
        path="/messages/:chatId"
        component={() => <ProtectedRoute component={ChatPage} />}
      />
      <Route
        path="/messages"
        component={() => <ProtectedRoute component={MessagesPage} />}
      />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
