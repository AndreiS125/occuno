"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE_URL = (() => {
  const trimmed = RAW_API_URL.replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
})();

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    const complete = async () => {
      try {
        // Clean any URL fragment if present (backend shouldn't send tokens in hash anymore)
        if (typeof window !== "undefined" && window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname);
        }

        // 1) Try to verify session using cookie-based access token
        let res = await fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" });
        if (res.ok) {
          setMessage("Signed in! Redirecting...");
          window.location.replace("/dashboard");
          return;
        }

        // 2) Try to refresh access token via refresh cookie, then retry /me
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (refreshRes.ok) {
          res = await fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" });
          if (res.ok) {
            setMessage("Signed in! Redirecting...");
            window.location.replace("/dashboard");
            return;
          }
        }

        setMessage("Sign-in failed. Redirecting to login...");
        router.replace("/login?error=oauth_invalid_session");
      } catch (e) {
        console.error("OAuth callback error", e);
        setMessage("Sign-in failed. Redirecting to login...");
        router.replace("/login?error=oauth_exception");
      }
    };

    complete();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white bg-black">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Occuno</h1>
        <p className="text-gray-300">{message}</p>
      </div>
    </div>
  );
}
