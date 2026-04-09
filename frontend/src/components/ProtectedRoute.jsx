import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Check for username instead of token due to HttpOnly security
  const isAuthenticated = sessionStorage.getItem("username");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;