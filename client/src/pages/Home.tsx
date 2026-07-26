// This page is no longer used — App.tsx shows LoginPage directly when unauthenticated.
// Keeping this file as a redirect safety net.
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/"); }, []);
  return null;
}
