import * as React from "react";

// --- Utility function for merging Tailwind classes ---
function cn(...inputs) {
  return inputs.flat().filter(Boolean).join(" ");
}

// --- Message Toast Component (for non-alert feedback) ---
const MessageToast = ({ message, type, onClose }) => {
  if (!message) return null;

  const typeClasses = {
    error: "bg-red-600 border-red-700",
    success: "bg-green-600 border-green-700",
  }[type] || `bg-blue-600 border-blue-700`;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={cn("px-4 py-3 rounded-xl shadow-2xl text-white border-b-4 transition-all duration-300", typeClasses)}
        role="alert" aria-live="assertive"
      >
        <div className="flex justify-between items-center">
          <p className="font-semibold text-sm">{message}</p>
          <button onClick={onClose} className="ml-4 text-white opacity-75 hover:opacity-100 transition" aria-label="Close notification">
            <svg className="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Simple Input Field Component (No forwardRef needed) ---
const InputField = ({ label, id, placeholder, type = 'text', value, onChange, className = '' }) => (
  <div className="flex flex-col space-y-2">
    <label htmlFor={id} className="text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={cn(
        'w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg text-gray-800 transition shadow-inner ' +
        'placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none', 
        className
      )}
      required
    />
  </div>
);


// --- Main Application Component ---
const SignUpForm = () => {
  const [formData, setFormData] = React.useState({
    firstName: '', lastName: '', contactNumber: '', email: '', password: '', confirmPassword: '',
  });
  const [message, setMessage] = React.useState(null);
  const [messageType, setMessageType] = React.useState('info'); 
  const [passwordError, setPasswordError] = React.useState(null);

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000); 
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setPasswordError(null);
  };

  const handleSubmitSafe = (e) => {
    e.preventDefault();
    setMessage(null);
    setPasswordError(null);
    
    const { password, confirmPassword } = formData;
    
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      showMessage("Password too short.", 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError("Passwords must match.");
      showMessage("Passwords do not match.", 'error');
      return;
    }
    
    // --- Submission Mock ---
    console.log("--- Form Submission Success (Data logged to console) ---", formData);
    showMessage(`Success! Account created for ${formData.email}.`, 'success');
    
    // Reset passwords
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
  };
  
  // Inlined Button Component logic
  const Button = ({ children, className }) => (
    <button
        type="submit"
        className={cn(
            "inline-flex items-center justify-center rounded-lg h-12 px-6 text-base font-bold tracking-wide transition-all disabled:opacity-50 " +
            "bg-gray-900 text-white hover:bg-gray-800 shadow-xl focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none",
            className
        )}
    >
        {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col items-center pt-16 pb-12 text-gray-800">
      
      <MessageToast message={message} type={messageType} onClose={() => setMessage(null)} />

      {/* --- Sign Up Card --- */}
      <main className="w-full max-w-lg px-4">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-6 md:p-10">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Create Account</h1>
            <p className="text-base text-gray-500 mt-2 max-w-sm mx-auto">
              Join thousands of users transforming their business
            </p>
          </header>

          <form onSubmit={handleSubmitSafe} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="First Name" id="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} />
              <InputField label="Last Name" id="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} />
            </div>

            <InputField label="Contact Number" id="contactNumber" type="tel" placeholder="(555) 123-4567" value={formData.contactNumber} onChange={handleChange} />
            <InputField label="Email" id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} />
            <InputField label="Password (min 8)" id="password" type="password" placeholder="Create a password" value={formData.password} onChange={handleChange} />
            <InputField label="Confirm Password" id="confirmPassword" type="password" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} />

            {/* Validation Error Message */}
            {passwordError && (
                <p className="text-sm text-red-500 -mt-4" aria-live="polite">{passwordError}</p>
            )}
            
            <Button className="w-full mt-8">Create Account</Button>
          </form>

          {/* Footer Links (Simplified) */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-700">
              Already have an account? 
              <a href="#" className="font-bold text-indigo-600 hover:text-indigo-700 ml-1">Log in</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUpForm;