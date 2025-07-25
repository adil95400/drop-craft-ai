import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Home from "./Home";
import Dashboard from "./Dashboard";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Simulate authentication check
  useEffect(() => {
    // For demo purposes, show home page by default
    // In real app, this would check auth status
    const authStatus = localStorage.getItem("isAuthenticated");
    setIsAuthenticated(authStatus === "true");
  }, []);

  // For demo, redirect to dashboard if user is "authenticated"
  const handleLogin = () => {
    localStorage.setItem("isAuthenticated", "true");
    setIsAuthenticated(true);
  };

  // Show dashboard if authenticated, otherwise show home
  if (isAuthenticated) {
    return <Dashboard />;
  }

  return <Home />;
};

export default Index;
