import React, { useState } from "react";
import { X, ArrowLeft, Check } from "lucide-react";

// --- Mock data for demo purposes ---
const initialFormData = {
  accountName: "Josh Inc.",
  companyNumber: "09135007323",
  companyWebsite: "joshenc.com",
  industry: "Agriculture",
  billingAddress: "#1 Pilar Las Pinas City",
  shippingAddress: "#3 BNW ASS-CBN",

  firstName: "Josh",
  lastName: "Vergara",
  department: "Administration",
  title: "CEO",
  workPhone: "09253677323",
  email: "josh@joshinc.com",
  mobile1: "09253677323",
  mobile2: "0907452874",

  dealName: "Josh Deal",
  dealAmount: "60.00",
  stage: "Prospecting",
  territory: "Cavite",
  description: "Initial lead conversion deal.",
  dealTitle: "New Client Agreement",
};

// --- Form Field Component ---
const FormField = ({ label, value, name, className = "" }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-xs text-gray-500 mb-1">{label}</label>
    <input
      type="text"
      name={name}
      defaultValue={value}
      readOnly
      className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50"
    />
  </div>
);

// --- Step Components ---
const AccountStep = ({ data }) => (
  <div className="space-y-6 p-4">
    <h3 className="text-lg font-semibold text-gray-700">Account Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <FormField label="Company Number" name="companyNumber" value={data.companyNumber} />
      <FormField label="Company Website" name="companyWebsite" value={data.companyWebsite} />
      <FormField label="Industry" name="industry" value={data.industry} />
    </div>

    <FormField label="Billing Address" name="billingAddress" value={data.billingAddress} className="col-span-3" />
    <FormField label="Shipping Address" name="shippingAddress" value={data.shippingAddress} className="col-span-3" />
  </div>
);

const ContactStep = ({ data }) => (
  <div className="space-y-6 p-4">
    <h3 className="text-lg font-semibold text-gray-700">Contact Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="First Name" name="firstName" value={data.firstName} />
      <FormField label="Last Name" name="lastName" value={data.lastName} />
      <FormField label="Department" name="department" value={data.department} />
      <FormField label="Title" name="title" value={data.title} />
      <FormField label="Work Phone" name="workPhone" value={data.workPhone} />
      <FormField label="Email" name="email" value={data.email} />
      <FormField label="Mobile Number 1" name="mobile1" value={data.mobile1} />
      <FormField label="Mobile Number 2" name="mobile2" value={data.mobile2} />
    </div>
  </div>
);

const DealStep = ({ data }) => (
  <div className="space-y-6 p-4">
    <h3 className="text-lg font-semibold text-gray-700">Deal</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Deal Name" name="dealName" value={data.dealName} />
      <div className="flex">
        <FormField label="Deal Amount" name="dealAmount" value={data.dealAmount} className="flex-grow" />
        <div className="flex flex-col justify-end ml-1">
          <span className="text-sm font-medium text-gray-600 border border-gray-300 bg-gray-100 p-2 rounded-r-lg h-10 flex items-center">
            PHP
          </span>
        </div>
      </div>
      <FormField label="Stage" name="stage" value={data.stage} />
      <FormField label="Territory" name="territory" value={data.territory} />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Description" name="description" value={data.description} />
      <FormField label="Title" name="dealTitle" value={data.dealTitle} />
    </div>
  </div>
);

// --- Main Component (Fixed-size Popup) ---
export default function TManagerLeadsConvert({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  if (!isOpen) return null;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      setCurrentStep(1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const tabs = [
    { id: 1, name: "Account" },
    { id: 2, name: "Contact" },
    { id: 3, name: "Deal" },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <AccountStep data={initialFormData} />;
      case 2:
        return <ContactStep data={initialFormData} />;
      case 3:
        return <DealStep data={initialFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      {/* Fixed-size modal */}
      <div className="bg-white rounded-xl shadow-2xl w-[800px] h-[600px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Convert Lead</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{initialFormData.accountName}</h1>
          </div>
          <button
            onClick={onClose} // removed handleCancel
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentStep(tab.id)}
              className={`flex-1 py-3 px-6 text-sm font-medium transition ${
                currentStep === tab.id
                  ? "bg-white text-gray-800 border-b-2 border-indigo-600"
                  : "bg-gray-600 text-white hover:bg-gray-700"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">{renderStepContent()}</div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 flex items-center"
            >
              Cancel
            </button>
          )}
          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              className="px-5 py-2 text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="px-5 py-2 text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition"
            >
              Convert
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
