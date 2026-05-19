import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Assets from "./pages/Assets";
import PerformInventoryCheck from "./pages/PerformInventoryCheck";
import InventorySummary from "./pages/InventorySummary";
import NearbyAssets from "./pages/NearbyAssets";
import WorkOrder from "./pages/WorkOrder";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import GlobalLoading from "./components/GlobalLoading";
import GlobalSnackbar from "./components/GlobalSnackbar";
import GlobalConfirmDialog from "./components/GlobalConfirmDialog";

import '@fontsource/montserrat';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/700.css';

function App() {
  return (
    <BrowserRouter>
      <GlobalLoading />
      <GlobalSnackbar />
      <GlobalConfirmDialog />

      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/work-orders" element={<WorkOrder />} />
            <Route path="/inventory" element={<Assets />} />
            <Route path="/assets/nearby" element={<NearbyAssets />} />
            <Route path="/inventory/perform/:id" element={<PerformInventoryCheck />} />
            <Route path="/inventory/perform" element={<PerformInventoryCheck />} />
            <Route path="/inventory/summary/:id" element={<InventorySummary />} />
            <Route path="/inventory/summary" element={<InventorySummary />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;