import * as React from "react";
import { useNavigate } from "react-router-dom"; // ✅ add this at the top
import { FiBriefcase, FiArrowLeft, FiEye, FiEyeOff, FiCheck } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { HiArrowLeft } from "react-icons/hi";
import api from '../api.js'
import useAuth from "../hooks/useAuth.js";
import {jwtDecode} from "jwt-decode";
import LoadingScreen from "../components/LoadingScreen.jsx";

// Helper for Tailwind class names
const cn = (...i) => i.flat().filter(Boolean).join(" ");

import * as countryCodesList from "country-codes-list";

const allCountries = countryCodesList.all();

// Create an array like [{ code: "+63", name: "Philippines" }, ...]
const COUNTRY_CODES = allCountries.map(country => ({
  code: `+${country.countryCallingCode}`,
  name: country.countryCode
}));

const STEPS = [
  { id: 1, title: "Your Account", subtitle: "Personal & Login Details" },
  { id: 2, title: "Company Setup", subtitle: "Business Information" },
];
// Inside your Signup component
const BackButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/")}
      className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer"
    >
      <HiArrowLeft className="size-4 mr-1" /> Back to Home
    </button>
  );
};

// Input Component
const InputComponent = React.memo(({ label, id, placeholder, type = 'text', value, onChange, isVisible, onTogglePass, error, isSelect, options }) => {
  const isPass = id.toLowerCase().includes('password');
  const inputType = isPass ? (isVisible ? 'text' : 'password') : type;

  const inputClasses = cn(
    "w-full bg-gray-50 border px-4 py-2.5 rounded-lg text-gray-800 transition shadow-inner placeholder-gray-400 focus:outline-none cursor-pointer",
    isPass ? "pr-10" : "",
    error
      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/50"
      : "border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
  );


  return (
    <div className="flex flex-col space-y-2">

      <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer">{label}</label>
      <div className="relative">
        {isSelect ? (
          <select id={id} value={value} onChange={onChange} required className={inputClasses}>
            {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
          </select>
        ) : (
          <input id={id} type={inputType} placeholder={placeholder} value={value} onChange={onChange} required className={inputClasses} />
        )}
        {isPass && (
          <button type="button" onClick={() => onTogglePass(id)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-700 hover:text-gray-900 focus:outline-none z-10 transition-colors cursor-pointer"
            aria-label={isVisible ? "Hide password" : "Show password"}
          >
            {isVisible ? <FiEyeOff className="size-5" /> : <FiEye className="size-5" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600 font-semibold">{error}</p>}
    </div>
  );
});
const Input = InputComponent;

// Step Indicator
const StepIndicator = React.memo(({ currentStep, totalSteps }) => (
  <div className="flex justify-between items-center mb-10 w-full max-w-xs mx-auto">
    {STEPS.map((step) => (
      <React.Fragment key={step.id}>
        <div className="flex flex-col items-center cursor-pointer">
          <div className={cn(
            "size-10 flex items-center justify-center rounded-full font-bold transition-all duration-300",
            step.id === currentStep ? "bg-amber-500 text-white shadow-lg" :
              step.id < currentStep ? "bg-green-500 text-white" :
                "bg-gray-100 text-gray-500 border-2 border-gray-300"
          )}>
            {step.id < currentStep ? <FiCheck className="size-5" /> : step.id}
          </div>
          <span className={cn(
            "mt-2 text-xs font-medium hidden sm:block",
            step.id === currentStep ? "text-amber-600" : "text-gray-500"
          )}>
            {step.title}
          </span>
        </div>
        {step.id < totalSteps && (
          <div className="flex-1 h-0.5 mx-1 transition-colors duration-300 bg-gray-300"></div>
        )}
      </React.Fragment>
    ))}
  </div>
));


// Step 1 Content
const Step1Content = React.memo(({ formData, handleChange, handleCodeChange, handleTogglePass, isPassVisible, formError, termsAccepted, handleTerms, isButtonDisabled, handleSubmit, handleGoogleLogin }) => (
  <>    

    <div className="flex items-center my-6">
      <div className="flex-grow border-t border-gray-300"></div>
      <span className="flex-shrink mx-4 text-sm text-gray-500">OR</span>
      <div className="flex-grow border-t border-gray-300"></div>
    </div>

    <div className="space-y-6">
      <div className="md:flex md:space-x-4 space-y-6 md:space-y-0">
        <div className="md:w-1/2"><Input label="First Name" id="first_name" placeholder="John" value={formData.first_name} onChange={handleChange} /></div>
        <div className="md:w-1/2"><Input label="Last Name" id="last_name" placeholder="Doe" value={formData.last_name} onChange={handleChange} /></div>
      </div>

      <div className="flex flex-col space-y-2">
        <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 cursor-pointer">Contact Number</label>
        <div className="flex space-x-2">
          <select id="countryCode" value={formData.countryCode} onChange={handleCodeChange} className="flex-shrink-0 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-lg text-gray-800 transition shadow-inner focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 focus:outline-none cursor-pointer">
            {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.name} {c.code}</option>)}
          </select>
          <input id="phone_number" type="tel" placeholder="0000000000" maxLength={10} value={formData.phone_number} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg text-gray-800 transition shadow-inner placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 focus:outline-none cursor-pointer" />
        </div>
      </div>

      <Input label="Email Address" id="email" type="email" placeholder="you@company.com" value={formData.email} onChange={handleChange} />
      <Input label="Password" id="password" placeholder="Min 8 characters" value={formData.password} onChange={handleChange} isVisible={isPassVisible.password} onTogglePass={handleTogglePass} />
      <Input label="Confirm Password" id="confirmPassword" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} isVisible={isPassVisible.confirmPassword} onTogglePass={handleTogglePass} error={formError} />

      <div className="flex items-start pt-2">
        <input id="terms" type="checkbox" checked={termsAccepted} onChange={handleTerms} className="size-4 mt-1 rounded text-amber-500 border-gray-300 focus:ring-amber-500 cursor-pointer" />
        <label htmlFor="terms" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
          I accept the <a href="#" className="text-amber-600 hover:text-amber-700 font-semibold">Terms</a> and <a href="#" className="text-amber-600 hover:text-amber-700 font-semibold">Policy</a>.
        </label>
      </div>
    </div>

    <button type="submit" onClick={handleSubmit} disabled={isButtonDisabled} className="w-full mt-8 inline-flex items-center justify-center rounded-lg h-12 px-6 text-white font-bold tracking-wide transition-all duration-300 bg-secondary hover:bg-tertiary shadow-lg shadow-tertiary disabled:shadow-none focus-visible:outline-none cursor-pointer">
      Continue to Company Details
    </button>
  </>
));

// Step 2 Content
const Step2Content = React.memo(({ companyData, handleCodeChange1, handleSubmit, handleCompanyChange, formError, isSubmitted, isButtonDisabled, setStep, setIsSubmitted, setFormError }) => (
  <>
    <div className="space-y-6">
      <Input label="Company Name" id="company_name" placeholder="Acme Corp" value={companyData.company_name} onChange={handleCompanyChange} />

      <div className="flex flex-col space-y-2">
        <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 cursor-pointer">Company Number</label>
        <div className="flex space-x-2">
          <select id="countryCode" value={companyData.countryCode} onChange={handleCodeChange1} className="flex-shrink-0 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-lg text-gray-800 transition shadow-inner focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 focus:outline-none cursor-pointer">
            {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.name} {c.code}</option>)}
          </select>
          <input id="company_number" type="tel" placeholder="0000000000" maxLength={10} value={companyData.company_number} onChange={handleCompanyChange} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg text-gray-800 transition shadow-inner placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 focus:outline-none cursor-pointer" />
        </div>
      </div>

      {/* <div className="flex flex-row">
        <select id="countryCode" value={companyData.countryCode} onChange={handleCodeChange1} className="flex-shrink-0 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-lg text-gray-800 transition shadow-inner focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 focus:outline-none cursor-pointer">
            {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.name} {c.code}</option>)}
          </select>
      <Input label="Company Number" id="company_number" type="tel" placeholder="e.g., 555-123-4567" value={companyData.company_number} onChange={handleCompanyChange} />
      </div>      */}


      <Input label="Company Website" id="company_website" type="url" placeholder="https://www.acme.com" value={companyData.company_website} onChange={handleCompanyChange} />
    </div>

    {formError && (
      <div className="p-3 text-sm rounded-lg bg-red-100 text-red-700 border border-red-300 font-medium my-6">
        {formError}
      </div>
    )}
    {isSubmitted && (
      <div className="p-3 text-sm rounded-lg bg-green-100 text-green-700 border border-green-300 font-medium my-6">
        Account and Company Setup simulated successfully! Welcome aboard.
      </div>
    )}

    <div className="flex space-x-4 mt-8">
      <button type="button" onClick={() => { setStep(1); setIsSubmitted(false); setFormError(null); }}
        className="flex-1 inline-flex items-center justify-center rounded-lg h-12 px-6 text-gray-700 font-bold tracking-wide border border-gray-300 bg-white hover:bg-tertiary hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:outline-none cursor-pointer">
        <FiArrowLeft className="size-4 mr-2" /> Back
      </button>

      <button onClick={handleSubmit} type="submit" disabled={isButtonDisabled}
        className="flex-1 inline-flex items-center justify-center rounded-lg h-12 px-6 text-white font-bold tracking-wide transition-all duration-300 bg-tertiary hover:bg-accent hover:text-secondary shadow-xl shadow-amber-500/30 disabled:shadow-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:outline-none cursor-pointer">
        Create Account
      </button>
    </div>
  </>
));

// Main Component
const Signup = () => {
  const REQUIRED_FIELDS_STEP_1 = ['first_name', 'email', 'password'];
  const REQUIRED_FIELDS_STEP_2 = ['company_name', 'company_number', 'company_website'];

  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    first_name: '', last_name: '',
    countryCode: "+63",
    phone_number: '', email: '',
    password: '', confirmPassword: '',
    role: 'CEO'
  });
  const [companyData, setCompanyData] = React.useState({
    company_name: '', company_number: '', company_website: '', countryCode: "+63",
  })
  const [isPassVisible, setIsPassVisible] = React.useState({});
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [formError, setFormError] = React.useState(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const { login } = useAuth();
  const [subscription, setSubscription] = React.useState({
    plan_name: 'Free',
    price: 0.00,    
  })
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    document.title = "Sign Up | Sari-Sari CRM";
  }, []);

  React.useEffect(() => {
    const initializeGoogle = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("googleSignupBtn"),
          { theme: "outline", size: "large", text: "signup_with" }
        );
      } else {
        console.error("Google API not loaded properly.");
      }
    };

    // If script already loaded, initialize immediately
    if (window.google && window.google.accounts) {
      initializeGoogle();
      return;
    }

    // Otherwise, append script dynamically
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);
  }, []);

  // ✅ When user signs up with Google
  const handleGoogleCallback = (response) => {
    setIsLoading(true);
  try {
    const userObject = jwtDecode(response.credential);
    console.log("Google user:", userObject);

    setFormData((prev) => ({
      ...prev,
      email: userObject.email,
      first_name: userObject.given_name || "",
      last_name: userObject.family_name || "",
      password: userObject.password || "",
      profilePicture: userObject.picture || "",
      googleId: userObject.sub,
      auth_provider: "google",  // 👈 important flag
      id_token: response.credential,
    }));

    // Go to Step 2 automatically
    setStep(2);
  } catch (error) {
    console.error("Google login error:", error);
  } finally{
    setIsLoading(false);
  }
};


  const handleChange = React.useCallback((e) => {
    const { id, value } = e.target;
    setIsSubmitted(false);
    setFormData(p => {
      const nextData = { ...p, [id]: value };
      if (step === 1 && (id === 'password' || id === 'confirmPassword')) {
        const { password, confirmPassword } = nextData;
        const newError = (password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword)
          ? "Password doesn't match. Please try again."
          : null;
        setFormError(prevError => (prevError !== newError ? newError : prevError));
      }
      return nextData;
    });
  }, [step]);

  const handleCompanyChange = React.useCallback((e) => {
    const { id, value } = e.target;
    setIsSubmitted(false);
    setCompanyData(p => {
      const nextData = { ...p, [id]: value };
      return nextData;
    });
  }, []);

  const handleCodeChange = React.useCallback((e) => setFormData(p => ({ ...p, countryCode: e.target.value })), []);
  const handleCodeChange1 = React.useCallback((e) => setCompanyData(p => ({ ...p, countryCode: e.target.value })), []);
  const handleTogglePass = React.useCallback((fieldId) => setIsPassVisible(p => ({ ...p, [fieldId]: !p[fieldId] })), []);
  const handleTerms = React.useCallback((e) => setTermsAccepted(e.target.checked), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(false);
    setFormError(null);
    setIsLoading(true);

    if (step === 1) {
      const allRequiredFilled = REQUIRED_FIELDS_STEP_1.every(field => formData[field].trim() !== '');
      if (!allRequiredFilled || !termsAccepted) {
        setFormError("Please fill in all required fields and accept the terms.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError("The passwords you entered do not match. Please try again.");
        return;
      }

      if (formData.auth_provider === 'google') {
        setStep(2);
        return;
      }

      try {
        const res1 = await api.post(`/auth/email-check`, { email: formData.email });
        if (res1.data.detail === "No existing email") {
          setFormError(null);
          setStep(2);
        }
      } catch (err) {
        if (err.response && err.response.data && err.response.data.detail) {
          setFormError(err.response.data.detail);
        } else {
          setFormError("Something went wrong. Please try again.");
        }
      } finally{
        setIsLoading(false);
      }
    } else if (step === 2) {
      const allRequiredFilled = REQUIRED_FIELDS_STEP_2.every(
        field => (companyData[field] || '').trim() !== ''
      );
      if (!allRequiredFilled) {
        setFormError("Please fill in all required company details.");
        return;
      }


      try {
        // Remove confirmPassword before sending to backend
        const { confirmPassword, ...cleanedFormData } = formData;
        const companyPayload1 = {
            ...companyData,            
            company_number: `${companyData.countryCode} ${companyData.company_number}`,
          };          
        const resCompany = await api.post(`/company/create`, companyPayload1);
        const companyID = resCompany.data.id;

        // Add +63 prefix
        const finalFormData = {
          ...cleanedFormData,
          company_id: companyID,
          phone_number: `${cleanedFormData.countryCode} ${cleanedFormData.phone_number}`,
        };

        console.log("📤 Sending payload:", finalFormData);

        if(cleanedFormData.auth_provider === 'google'){                    

          const resGoogle = await api.post(`/auth/google`, finalFormData);          

          const subsPayload = {
            ...subscription,
            company_id: companyID,
            status: "Active",
          }

          const resSubscription = await api.post(`/subscription/subscribe`, subsPayload);          

          setFormError(null);
          setIsSubmitted(true);
          login(resGoogle.data);
        } else {
          const res2 = await api.post(`/auth/signup`, finalFormData);     

          const subsPayload = {
            ...subscription,
            company_id: companyID,
            status: "Active",
          }

          const resSubscription = await api.post(`/subscription/subscribe`, subsPayload);    

          setFormError(null);
          setIsSubmitted(true);
          login(res2.data);
        }              
      } catch (err) {
        if (err.response?.data?.detail) {
          const detail = err.response.data.detail;

          // Handle both string and object-based errors
          if (Array.isArray(detail)) {
            // FastAPI validation errors
            const message = detail.map(e => e.msg).join(', ');
            setFormError(message);
          } else if (typeof detail === "object") {
            setFormError(detail.msg || JSON.stringify(detail));
          } else {
            setFormError(detail);
          }
        } else {
          setFormError("Something went wrong. Please try again.");
        }
      } finally{
        setIsLoading(false);
      }
    }
  };

  // --- Inside Signup component ---

  // 1️⃣ GOOGLE LOGIN HANDLER
  // --- Inside Signup component ---

// STEP 1️⃣: Handle Google button click
const handleGoogleLogin = React.useCallback(() => {
  try {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response) => {
        const { credential } = response; // Google token        

        // Store Google user details locally — not yet saved to DB
        setFormData((prev) => ({
          ...prev,
          first_name: credential.given_name || "",
          last_name: credential.family_name || "",
          email: credential.email || "",
          profile_picture: credential.picture || "",
          auth_provider: "google",
          id_token: credential, // save token for later use in Step 2 submit
        }));

        // Move to company info step
        setStep(2);
      },
    });

    // Trigger the Google popup
    window.google.accounts.id.prompt();
  } catch (err) {
    console.error("Google login error:", err);
    setFormError("Google login failed. Please try again.");
  }
}, [setFormData, setFormError, setStep]);




  const isButtonDisabled = React.useMemo(() => {
    if (step === 1) {
      const allRequiredFilled = REQUIRED_FIELDS_STEP_1.every(
        field => (formData[field] || '').trim() !== ''
      );
      return !termsAccepted || !!formError || !allRequiredFilled;
    }

    if (step === 2) {
      const allRequiredFilled = REQUIRED_FIELDS_STEP_2.every(
        field => (companyData[field] || '').trim() !== ''
      );
      return !allRequiredFilled;
    }

    return true;
  }, [step, termsAccepted, formError, formData, REQUIRED_FIELDS_STEP_1, REQUIRED_FIELDS_STEP_2]);


  const currentStepInfo = STEPS.find(s => s.id === step);

  return (
    <div className="min-h-screen w-full bg-gray-100 font-sans text-gray-800 flex flex-col items-center">

      <div className="w-full py-6 px-4 sm:px-12 lg:px-20 max-w-7xl">
        <div className="flex items-center text-gray-800">
          <FiBriefcase className="size-6 text-amber-500 mr-2" />
          <span className="text-xl font-extrabold tracking-wider">CRM</span>
        </div>
      </div>      

      {isLoading && (
        <LoadingScreen isLoading={isLoading} />
      )}

      <div className="w-full max-w-lg px-4 pt-6">
        <BackButton />
      </div>

      <main className="w-full max-w-lg font-inter mx-auto px-4 pt-3 pb-12">

        <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-6 md:p-10">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{currentStepInfo.title}</h1>
            <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">{currentStepInfo.subtitle}</p>
          </header>

          <StepIndicator currentStep={step} totalSteps={STEPS.length} />

          {step === 1 && (
            <div id="googleSignupBtn"></div>
          )}          

          <form className="mt-8">
            {step === 1 && (
              <Step1Content
                formData={formData}
                handleChange={handleChange}
                handleCodeChange={handleCodeChange}
                handleTogglePass={handleTogglePass}
                isPassVisible={isPassVisible}
                formError={formError}
                termsAccepted={termsAccepted}
                handleTerms={handleTerms}
                isButtonDisabled={isButtonDisabled}
                handleSubmit={handleSubmit}
                handleGoogleLogin={handleGoogleLogin}
              />
            )}
            {step === 2 && (
              <Step2Content
                handleSubmit={handleSubmit}
                companyData={companyData}
                handleCompanyChange={handleCompanyChange}
                formError={formError}
                isSubmitted={isSubmitted}
                isButtonDisabled={isButtonDisabled}
                setStep={setStep}
                setIsSubmitted={setIsSubmitted}
                setFormError={setFormError}
                handleCodeChange1={handleCodeChange1}
              />
            )}

            {step === 1 && (
              <div className="text-center mt-6">
                <p className="text-sm text-gray-700">
                  Already have an account?
                  <a href="/login" className="font-bold text-amber-600 hover:text-amber-700 ml-1 cursor-pointer">Log in</a>
                </p>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default Signup;
