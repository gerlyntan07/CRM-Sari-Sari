import * as React from "react";
import { useNavigate } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import api from "../api";
import useAuth from "../hooks/useAuth";
import { jwtDecode } from "jwt-decode";
import LoadingScreen from "../components/LoadingScreen";
// --- Back Button ---
const BackButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/")}
      className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition mb-3 cursor-pointer"
    >
      <HiArrowLeft className="size-4 mr-1" /> Back to Home
    </button>
  );
};

// --- Input ---
const InputField = ({ label, id, placeholder, type = "text", value, onChange, isPassVisible, onTogglePass }) => {
  const isPass = id.toLowerCase().includes("password");
  const inputType = isPass ? (isPassVisible ? "text" : "password") : type;

  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg text-gray-800 transition shadow-inner placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 focus:outline-none cursor-pointer"
        />
        {isPass && (
          <button
            type="button"
            onClick={onTogglePass}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-700 hover:text-gray-900 focus:outline-none z-10 transition-colors cursor-pointer"
            aria-label={isPassVisible ? "Hide password" : "Show password"}
          >
            {isPassVisible ? <FiEyeOff className="size-5" /> : <FiEye className="size-5" />}
          </button>
        )}
      </div>
    </div>
  );
};

// --- Main Login Form ---
const Login = () => {
  const [formData, setFormData] = React.useState({ email: "", password: "" });
  const [isPassVisible, setIsPassVisible] = React.useState(false);
  const [loginErr, setLoginErr] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { isLoggedIn, login, userRole } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = "Login | Sari-Sari CRM";
  }, []);

  React.useEffect(() => {
    if (isLoggedIn) {
      if (userRole === "CEO" || userRole === "Admin") {
        navigate("/admin");
      } else if (userRole === "Group Manager") {
        navigate("/group-manager");
      } else if (userRole === "Manager") {
        navigate("/manager");
      } else if (userRole === "Marketing") {
        navigate("/marketing");
      } else if (userRole === "Sales") {
        navigate("/sales");
      }
    }
  }, [isLoggedIn, navigate, userRole]);


  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginErr(null);
    try {
      const res = await api.post(`/auth/login`, formData);
      login(res.data);
      setLoginErr(null);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setLoginErr(err.response.data.detail);
      } else {
        setLoginErr("Something went wrong. Please try again.");
      }
    }
  };

  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('googleLoginBtn'),
          { theme: 'outline', size: 'large', text: "signin_with" }
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleCallback = async (response) => {
    setIsLoading(true);
    try {
      const user = jwtDecode(response.credential);      

      // Send the ID token to backend for verification
      const res = await api.post("/auth/google", { id_token: response.credential });

      login(res.data); // use your existing login hook    
    } catch (error) {
      console.error("Google login failed:", error);
      setLoginErr("Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full bg-gray-100 font-sans text-gray-800 flex flex-col items-center">
      <div className="w-full py-6 px-4 sm:px-12 lg:px-20 max-w-7xl">
        <div className="flex items-center text-gray-800">
          <span className="text-xl font-extrabold tracking-wider">CRM</span>
        </div>
      </div>

      {isLoading && (
        <LoadingScreen isLoading={isLoading} />
      )}

      <main className="w-full max-w-lg font-inter mx-auto px-4 pt-6 pb-12">
        <BackButton />

        <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-6 md:p-10">
          <header className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Login</h1>
            <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
              Sign in to access your dashboard.
            </p>
          </header>

          <div id="googleLoginBtn"></div>

          {/* Separator */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-sm text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 cursor-pointer">
            <InputField
              label="Email"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />

            <InputField
              label="Password"
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              isPassVisible={isPassVisible}
              onTogglePass={() => setIsPassVisible((prev) => !prev)}

            />

            {loginErr && (
              <div className="bg-red-100 border border-red-300 py-2 px-3 text-red-600">
                {loginErr}
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center rounded-lg h-12 px-6 text-white font-bold tracking-wide transition-all disabled:opacity-50 bg-secondary text-gray-900 hover:bg-tertiary shadow-xl focus-visible:ring-2 focus-visible:ring-amber-500/50 cursor-pointer"
            >
              Log In
            </button>

            <div className="text-center mt-1">
              <a href="/forgot-password" className="text-sm font-medium text-amber-600 hover:text-amber-700 cursor-pointer">
                Forgot Password?
              </a>
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-700">
              Don't have an account?
              <a href="/signup" className="font-bold text-amber-600 hover:text-amber-700 ml-1 cursor-pointer">Sign Up</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
