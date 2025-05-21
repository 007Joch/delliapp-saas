
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserSwitcherProvider } from "@/context/UserSwitcherContext";
import { CartProvider } from "@/context/CartContext";
import UserSwitcher from "@/components/UserSwitcher";
import Header from "@/components/Header";
import Index from "./pages/Index";
import OrderManagement from "./pages/OrderManagement";
import OrderTracking from "./pages/OrderTracking";
import KitchenManagement from "./pages/KitchenManagement";
import ProductManagement from "./pages/ProductManagement";
import UserManagement from "./pages/UserManagement";
import ApiManagement from "./pages/ApiManagement";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Cart from "./components/Cart";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserSwitcherProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/order-management" element={<OrderManagement />} />
              <Route path="/kitchen-management" element={<KitchenManagement />} />
              <Route path="/order-tracking/:orderId?" element={<OrderTracking />} />
              <Route path="/product-management" element={<ProductManagement />} />
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/api-management" element={<ApiManagement />} />
              <Route path="/login" element={<Login />} />
              {/* Redirect to home if just logged in */}
              <Route path="/auth/callback" element={<Navigate to="/" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <UserSwitcher />
            <Cart />
          </BrowserRouter>
        </CartProvider>
      </UserSwitcherProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
