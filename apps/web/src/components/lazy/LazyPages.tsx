import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthGuard } from "../auth/AuthGuard";
import { AdminRoute } from "../auth/AdminRoute";
import { LoadingState } from "../common/LoadingState";

// Lazy load all pages
const Auth = lazy(() => import("../../pages/Auth"));
const Home = lazy(() => import("../../pages/Home"));
const Dashboard = lazy(() => import("../../pages/Dashboard"));
const Import = lazy(() => import("../../pages/Import"));
const Catalogue = lazy(() => import("../../pages/Catalogue"));
const Orders = lazy(() => import("../../pages/Orders"));
const Integrations = lazy(() => import("../../pages/Integrations"));
const Settings = lazy(() => import("../../pages/Settings"));
const Admin = lazy(() => import("../../pages/Admin"));
const NotFound = lazy(() => import("../../pages/NotFound"));

const LazyPages = () => {
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/import"
          element={
            <AuthGuard>
              <Import />
            </AuthGuard>
          }
        />
        <Route
          path="/catalogue"
          element={
            <AuthGuard>
              <Catalogue />
            </AuthGuard>
          }
        />
        <Route
          path="/orders"
          element={
            <AuthGuard>
              <Orders />
            </AuthGuard>
          }
        />
        <Route
          path="/integrations"
          element={
            <AuthGuard>
              <Integrations />
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default LazyPages;