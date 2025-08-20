import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthGuard } from "../auth/AuthGuard";
import { AdminRoute } from "../auth/AdminRoute";
import { LoadingState } from "../common/LoadingState";
import { MainLayout } from "../layout/MainLayout";

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
const CanvaDesigns = lazy(() => import("../../pages/CanvaDesigns"));
const CanvaCallback = lazy(() => import("../../pages/CanvaCallback"));

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
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/import"
          element={
            <AuthGuard>
              <MainLayout>
                <Import />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/catalogue"
          element={
            <AuthGuard>
              <MainLayout>
                <Catalogue />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/orders"
          element={
            <AuthGuard>
              <MainLayout>
                <Orders />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/integrations"
          element={
            <AuthGuard>
              <MainLayout>
                <Integrations />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <MainLayout>
                <Settings />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/canva-designs"
          element={
            <AuthGuard>
              <MainLayout>
                <CanvaDesigns />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/canva-callback"
          element={
            <AuthGuard>
              <CanvaCallback />
            </AuthGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <MainLayout>
                <Admin />
              </MainLayout>
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default LazyPages;