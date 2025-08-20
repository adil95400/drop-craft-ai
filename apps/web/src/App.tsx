import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { AuthGuard } from "./components/auth/AuthGuard";
import { AdminRoute } from "./components/auth/AdminRoute";
import { LoadingState } from "./components/common/LoadingState";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import "./App.css";

// Lazy load pages for better performance
const LazyPages = lazy(() => import("./components/lazy/LazyPages"));

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-background">
          <Suspense fallback={<LoadingState />}>
            <Routes>
              <Route path="/*" element={<LazyPages />} />
            </Routes>
          </Suspense>
        </div>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;