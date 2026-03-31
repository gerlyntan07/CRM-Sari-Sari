import * as React from "react";
import { useNavigate } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../api";

const BackButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition mb-3 cursor-pointer"
    >
      <HiArrowLeft className="size-4 mr-1" /> Back
    </button>
  );
};

// --- Input Field ---
const InputField = ({
  label,
  id,
  placeholder,
  type = "text",
  value,
  onChange,
  icon: Icon,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && <Icon className="absolute left-3 text-gray-500 size-5" />}
        <input
          id={id}
          type={isPassword ? "text" : type}
          style={isPassword && !showPassword ? { WebkitTextSecurity: "disc" } : undefined}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          className="w-full bg-gray-50 border border-gray-200 pl-10 pr-10 py-2.5 rounded-lg text-gray-800 transition shadow-inner placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 focus:outline-none cursor-pointer"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 text-gray-500"
          >
            {showPassword ? (
              <FiEyeOff className="size-5" />
            ) : (
              <FiEye className="size-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// --- OTP Input with Auto-Focus ---
const OtpInput = ({ otp, setOtp }) => {
  const inputRefs = React.useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    
    // Only allow digits
    if (!(/\d/.test(value) || value === "")) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus to next input if digit entered
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Backspace: move to previous input and clear
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
    
    // Arrow keys for navigation
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").split("").slice(0, 6);
    
    if (digits.length > 0) {
      const newOtp = [...otp];
      digits.forEach((digit, index) => {
        newOtp[index] = digit;
      });
      setOtp(newOtp);
      
      // Focus on the last filled input or the next empty one
      const lastIndex = Math.min(digits.length, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {[...Array(6)].map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength="1"
          className="w-12 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg transition hover:border-gray-400 focus:outline-none"
          value={otp[i] || ""}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
};

const ForgotPass = () => {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [otpTimer, setOtpTimer] = React.useState(60); // 1 minute timer
  const [otpExpired, setOtpExpired] = React.useState(false);

  // Timer effect for OTP expiration
  React.useEffect(() => {
    let interval;
    if (step === 2 && otpTimer > 0 && !otpExpired) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setOtpExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer, otpExpired]);

  // Step 1: Send email and request OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !email.includes("@")) {
      const errMsg = "Please enter a valid email address";
      setError(errMsg);
      toast.error(errMsg, {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await api.post("/auth/forgot-password", { email });
      console.log("Forgot password response:", response.data);
      setOtpTimer(60); // Reset timer to 60 seconds
      setOtpExpired(false);
      
      toast.success("Verification code sent to your email!", {
        position: "top-right",
        autoClose: 2000,
      });
      
      setStep(2);
    } catch (err) {
      console.error("Forgot password error:", err);
      const errorMessage = err.response?.data?.detail;
      
      // Handle specific error scenarios
      if (errorMessage?.includes("not found") || errorMessage?.includes("does not exist")) {
        const errMsg = "Email not found in system. Please check and try again.";
        setError(errMsg);
        toast.error(errMsg, {
          position: "top-right",
          autoClose: 3000,
        });
      } else if (errorMessage?.includes("rate limit") || errorMessage?.includes("too many")) {
        const errMsg = "Too many requests. Please wait a few minutes before trying again.";
        setError(errMsg);
        toast.error(errMsg, {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        const errMsg = errorMessage || "Failed to send verification code. Please try again.";
        setError(errMsg);
        toast.error(errMsg, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Request new OTP
  const handleRequestNewOtp = async () => {
    setLoading(true);
    setError("");
    setOtp(["", "", "", "", "", ""]); // Clear OTP boxes
    
    try {
      await api.post("/auth/forgot-password", { email });
      console.log("New OTP requested");
      setOtpTimer(60); // Reset to 60 seconds
      setOtpExpired(false); // Clear expired state
      // Don't show error, just silently refresh the OTP
    } catch (err) {
      console.error("Request new OTP error:", err);
      const errorMessage = err.response?.data?.detail;
      
      // Handle error scenarios
      if (errorMessage?.includes("not found") || errorMessage?.includes("does not exist")) {
        setError("Email not found. Please try again.");
        setStep(1); // Go back to email step
      } else if (errorMessage?.includes("rate limit") || errorMessage?.includes("too many")) {
        setError("Too many requests. Please wait a few minutes before trying again.");
      } else {
        setError(errorMessage || "Failed to send new code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    
    // Validate OTP format
    if (!otpString || otpString.length !== 6) {
      const errMsg = "Please enter all 6 digits";
      setError(errMsg);
      toast.error(errMsg, {
        position: "top-right",
        autoClose: 2000,
      });
      return;
    }
    
    // Check if OTP is all digits
    if (!/^\d{6}$/.test(otpString)) {
      const errMsg = "OTP must contain only numbers";
      setError(errMsg);
      toast.error(errMsg, {
        position: "top-right",
        autoClose: 2000,
      });
      return;
    }

    // Check if OTP has expired
    if (otpExpired) {
      const errMsg = "Code has expired. Please request a new verification code.";
      setError(errMsg);
      toast.error(errMsg, {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await api.post("/auth/verify-otp", {
        email,
        otp: otpString,
      });
      console.log("OTP verify response:", response.data);
      
      // Verification successful
      toast.success("Code verified! Proceeding to password reset...", {
        position: "top-right",
        autoClose: 2000,
      });
      
      setResetToken(response.data.reset_token);
      setOtp(["", "", "", "", "", ""]); // Clear OTP input
      setStep(3); // Proceed to password reset
    } catch (err) {
      console.error("OTP verification error:", err);
      const errorMessage = err.response?.data?.detail;
      
      // Handle specific error scenarios
      if (errorMessage?.includes("Invalid") || errorMessage?.includes("does not match")) {
        const errMsg = "Invalid verification code. Please check and try again.";
        setError(errMsg);
        toast.error(errMsg, {
          position: "top-right",
          autoClose: 3000,
        });
      } else if (errorMessage?.includes("expired")) {
        const errMsg = "Code has expired. Please request a new verification code.";
        setError(errMsg);
        toast.error(errMsg, {
          position: "top-right",
          autoClose: 3000,
        });
        setOtpExpired(true);
      } else if (errorMessage?.includes("User not found")) {
        const errMsg = "Email not found in system. Please try again.";
        setError(errMsg);
        toast.error(errMsg, {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        const errMsg = errorMessage || "Failed to verify code. Please try again.";
        setError(errMsg);
        toast.error(errMsg, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate both password fields are filled
    if (!password || !confirmPassword) {
      setError("Please fill in both password fields");
      return;
    }
    
    // Check password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    // Check passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!resetToken) {
      setError("Reset token is missing. Please start over.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await api.post("/auth/reset-password", {
        email,
        reset_token: resetToken,
        new_password: password,
      });
      console.log("Password reset response:", response.data);
      
      // Success toast notification
      toast.success("Password reset successfully! Redirecting to login...", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Redirect to login after toast shows
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      console.error("Password reset error:", err);
      const errorMessage = err.response?.data?.detail;
      
      // Handle specific error scenarios
      if (errorMessage?.includes("token") || errorMessage?.includes("expired")) {
        const errMsg = "Reset token has expired. Please request a new verification code.";
        toast.error(errMsg, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setError(errMsg);
        setTimeout(() => {
          setStep(1);
          setEmail("");
          setOtp(["", "", "", "", "", ""]);
          setResetToken("");
          setPassword("");
          setConfirmPassword("");
        }, 2000);
      } else if (errorMessage?.includes("not found")) {
        const errMsg = "User not found. Please try again.";
        toast.error(errMsg, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setError(errMsg);
        setStep(1);
        setEmail("");
      } else if (errorMessage?.includes("must be at least")) {
        const errMsg = "Password must be at least 8 characters long";
        toast.error(errMsg, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setError(errMsg);
      } else {
        const errMsg = errorMessage || "Failed to reset password. Please try again.";
        toast.error(errMsg, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 font-sans text-gray-800 flex flex-col items-center">
      <div className="w-full py-6 px-4 sm:px-12 lg:px-20 max-w-7xl">
        <div className="flex items-center text-gray-800">
          <span className="text-xl font-extrabold tracking-wider">CRM</span>
        </div>
      </div>

      <main className="w-full max-w-lg font-inter mx-auto px-4 pt-6 pb-12">
        <BackButton onClick={handleBackClick} />

        <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-6 md:p-10">
          {error && step !== 2 && step !== 3 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <header className="text-center mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Forgot Password
                </h1>
                <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                  Enter your email and we'll send you a verification code.
                </p>
              </header>

              <form onSubmit={handleEmailSubmit} className="space-y-4 cursor-pointer">
                <InputField
                  label="Email Address"
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={FiMail}
                />

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center rounded-lg h-12 px-6 text-white font-bold tracking-wide transition-all bg-secondary text-gray-900 hover:bg-tertiary shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Verification Code"}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <header className="text-center mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Enter Verification Code
                </h1>
                <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                  We've sent a 6-digit code to <strong>{email}</strong>.
                </p>
                <p className={`text-xs mt-3 transition-colors ${
                  otpExpired 
                    ? "text-red-500 font-semibold" 
                    : otpTimer <= 10 
                    ? "text-red-500 font-bold" 
                    : "text-gray-400"
                }`}>
                  {otpExpired ? "Code expired" : `Expires in ${otpTimer}s`}
                </p>
              </header>

              <form onSubmit={otpExpired ? (e) => { e.preventDefault(); handleRequestNewOtp(); } : handleOtpSubmit} className="space-y-4">
                <OtpInput otp={otp} setOtp={setOtp} />

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading || (!otpExpired && otp.join("").length !== 6)}
                  className="w-full inline-flex items-center justify-center rounded-lg h-12 px-6 text-white font-bold tracking-wide transition-all bg-secondary text-gray-900 hover:bg-tertiary shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (otpExpired ? "Sending..." : "Verifying...") : (otpExpired ? "Send New Code" : "Verify Code")}
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <header className="text-center mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Reset Password
                </h1>
                <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                  Enter your new password below.
                </p>
              </header>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <InputField
                  label="New Password"
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={FiLock}
                />

                <InputField
                  label="Confirm Password"
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={FiLock}
                />

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center rounded-lg h-12 px-6 text-white font-bold tracking-wide transition-all bg-secondary text-gray-900 hover:bg-tertiary shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ForgotPass;
