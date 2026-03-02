import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense } from "react";

// Eager load: landing page (first paint)
import Katail from "./pages/Katail";

// Lazy load: all other pages (code-split into separate chunks)
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const StoreFront = lazy(() => import("./pages/StoreFront"));
const Presentation = lazy(() => import("./pages/Presentation"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Home = lazy(() => import("./pages/Home"));

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
        <Route path="/" component={Katail} />
        <Route path="/auth" component={Auth} />
        <Route path="/admin" component={Admin} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/loja/:slug" component={StoreFront} />
        <Route path="/apresentacao" component={Presentation} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
