import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./components/CartContext";
import { lazy, Suspense } from "react";

// Lazy load: all pages (code-split into separate chunks)
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const StoreFront = lazy(() => import("./pages/StoreFront"));
const Presentation = lazy(() => import("./pages/Presentation"));
const Checkout = lazy(() => import("./pages/Checkout"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">A carregar...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Auth} />
        <Route path="/katail" component={Auth} />
        <Route path="/katail/auth" component={Auth} />
        <Route path="/katail/admin" component={Admin} />
        <Route path="/katail/checkout" component={Checkout} />
        <Route path="/katail/loja/:slug" component={StoreFront} />
        <Route path="/katail/apresentacao" component={Presentation} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;
