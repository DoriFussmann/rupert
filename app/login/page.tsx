"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavigationHeader from "../components/NavigationHeader";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // Create a style element to forcefully hide the layout header
    const styleElement = document.createElement('style');
    styleElement.id = 'hide-layout-header';
    styleElement.textContent = `
      body > header {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      // Remove the style element when leaving the page
      const styleElement = document.getElementById('hide-layout-header');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  return (
    <>
      <NavigationHeader />
      <div style={{ paddingTop: 'calc(2.25rem + 1rem)' }}>
        <div className="flex justify-center items-start pt-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 w-96">
            {/* Toggle Buttons */}
            <div className="flex rounded-lg overflow-hidden shadow-sm mb-6">
              <button 
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-3 px-6 font-medium text-sm transition-colors ${
                  !isSignUp 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Login
              </button>
              <button 
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-3 px-6 font-medium text-sm transition-colors ${
                  isSignUp 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form Content */}
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4 text-center">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (isSignUp) return; // sign-up not implemented here
                  try {
                    setError(null);
                    const res = await fetch("/api/auth/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, password })
                    });
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({ error: "Login failed" }));
                      throw new Error(body.error || "Login failed");
                    }
                    router.push("/admin");
                  } catch (err: any) {
                    setError(err?.message || "Login failed");
                  }
                }}
              >
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Name Field (Sign Up only) */}
                {isSignUp && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your full name"
                    />
                  </div>
                )}

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {/* Confirm Password Field (Sign Up only) */}
                {isSignUp && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  {isSignUp ? "Create Account" : "Sign In"}
                </button>

                {error && (
                  <div className="text-sm text-red-600 mt-2">{error}</div>
                )}

                {/* Test credentials for quick copy/paste */}
                {!isSignUp && (
                  <div className="mt-3 text-sm text-gray-600">
                    <div className="font-mono select-all">admin@example.com</div>
                    <div className="font-mono select-all">admin123</div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
