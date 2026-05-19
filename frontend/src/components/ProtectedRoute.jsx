import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store";

export default function ProtectedRoute() {
  const { token } = useAuthStore();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}