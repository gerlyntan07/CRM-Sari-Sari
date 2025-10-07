import * as React from "react";
import { useNavigate } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

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
          type={isPassword && showPassword ? "text" : type}
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

// --- OTP Input ---
const OtpInput = ({ otp, setOtp }) => (
  <div className="flex justify-between gap-2">
    {[...Array(6)].map((_, i) => (
      <input
        key={i}
        type="text"
        maxLength="1"
        className="w-12 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
        value={otp[i] || ""}
        onChange={(e) => {
          const value = e.target.value;
          if (/\d/.test(value) || value === "") {
            const newOtp = [...otp];
            newOtp[i] = value;
            setOtp(newOtp);
          }
        }}
      />
    ))}
  </div>
);

const ForgotPass = () => {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    alert("Password reset successfully!");
  };

  const handleBackClick = () => {
    if (step > 1) {
      setStep(step - 1);
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

              <form onSubmit={handleEmailSubmit} className="space-y-6 cursor-pointer">
                <InputField
                  label="Email Address"
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={FiMail}
                />

                <button className="w-full mt-3 inline-flex items-center justify-center rounded-lg h-12 px-6 text-white font-bold tracking-wide transition-all bg-secondary text-gray-900 hover:bg-tertiary shadow-xl">
                  Send OTP
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
              </header>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <OtpInput otp={otp} setOtp={setOtp} />

                <button className="w-full mt-3 inline-flex items-center justify-center rounded-lg h-12 px-6 text-white font-bold tracking-wide transition-all bg-secondary text-gray-900 hover:bg-tertiary shadow-xl">
                  Verify Code
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

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
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

                <button className="w-full mt-3 inline-flex items-center justify-center rounded-lg h-12 px-6 text-white font-bold tracking-wide transition-all bg-secondary text-gray-900 hover:bg-tertiary shadow-xl">
                  Reset Password
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
