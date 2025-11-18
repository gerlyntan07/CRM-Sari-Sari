import React, { useState } from "react";
import { X, ArrowLeft, Check } from "lucide-react";
import api from "../api.js";
import { toast } from "react-toastify";
import * as countryCodesList from "country-codes-list";

const allCountries = countryCodesList.all();

// Create an array like [{ code: "+63", name: "Philippines" }, ...]
const COUNTRY_CODES = allCountries.map(country => ({
  code: `+${country.countryCallingCode}`,
  name: country.countryCode
}));
// --- Form Field Component ---
const FormField = ({ label, value, name, placeholder, readOnly, onChange, className = "" }) => (

  <div className={`flex flex-col ${className}`}>
    <label className="text-xs text-gray-700 mb-1">{label}</label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      readOnly={readOnly || false}
      placeholder={placeholder}
      className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50"
    />
  </div>
);

// --- Step Components ---
const AccountStep = ({ data, handleAccountChange, setAccountData }) => (
  <div className="space-y-6 p-4">
    <h3 className="text-lg font-semibold text-gray-700">Account Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* <FormField label="Company Number" name="phone_number" placeholder='09xxxxxxxxx' onChange={handleAccountChange} value={data.phone_number} /> */}

      <div className={`flex flex-col`}>
        <label className="text-xs text-gray-700 mb-1">Company Number</label>

        <div className="w-full border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50 gap-3 flex flex-row">
          <select name="countryCode" value={data.countryCode} onChange={handleAccountChange} className="outline-none cursor-pointer py-2 border-r border-gray-400 w-20">
            {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
          <input
            type="text"
            name='phone_number'
            value={data.phone_number}
            onChange={handleAccountChange}
            placeholder='9xxxxxxxxx'
            className="w-full outline-none"
          />
        </div>
      </div>

      <div className={`flex flex-col`}>
        <label className="text-xs text-gray-700 mb-1">Company Website</label>
        <input
          type="url"
          name='website'
          value={data.website}
          onChange={handleAccountChange}
          className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50"
        />
      </div>

      <FormField label="Industry" name="industry" onChange={handleAccountChange} value={data.industry} />
      <div className="flex flex-col">
        <label className="text-xs text-gray-700 mb-1">Status</label>
        <select name="status" onChange={handleAccountChange} value={data.status} className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50">
          <option value="Prospect">Prospect</option>
          <option value="Customer">Customer</option>
          <option value="Partner">Partner</option>
          <option value="Former">Former</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
    </div>

    <FormField label="Billing Address" name="billing_address" onChange={handleAccountChange} value={data.billing_address} className="col-span-3" />

    <div className={`flex flex-col`}>
      <label className="text-xs text-gray-700 mb-1">Shipping Address
        <button
          type="button"
          onClick={() => setAccountData((prev) => ({
            ...prev,
            shipping_address: prev.billing_address
          }))}
          className="ml-2 text-blue-500 hover:underline"
        >
          same as billing address
        </button>
      </label>
      <input
        type="text"
        name='shipping_address'
        value={data.shipping_address}
        onChange={handleAccountChange}
        className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50"
      />
    </div>
  </div>
);

const ContactStep = ({ data, handleContactChange }) => (
  <div className="space-y-6 p-4">
    <h3 className="text-lg font-semibold text-gray-700">Contact Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="First Name" name="first_name" readOnly={true} onChange={handleContactChange} value={data.first_name} />
      <FormField label="Last Name" name="last_name" readOnly={true} onChange={handleContactChange} value={data.last_name} />
      <FormField label="Department" name="department" readOnly={true} onChange={handleContactChange} value={data.department} />
      <FormField label="Title" name="title" readOnly={true} onChange={handleContactChange} value={data.title} />
      <FormField label="Work Phone" name="work_phone" readOnly={true} onChange={handleContactChange} value={data.work_phone} />
      <FormField label="Email" name="email" readOnly={true} onChange={handleContactChange} value={data.email} />
      <FormField label="Mobile Number 1" name="mobile_phone_1" readOnly={true} onChange={handleContactChange} value={data.mobile_phone_1} />
      <FormField label="Mobile Number 2" name="mobile_phone_2" readOnly={true} onChange={handleContactChange} value={data.mobile_phone_2} />

      <div className="flex flex-col w-full col-span-2">
        <label className="text-xs text-gray-700 mb-1">Notes</label>
        <textarea
          type="text"
          name='notes'
          value={data.notes}
          onChange={handleContactChange}
          rows={3}
          className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50"
        />
      </div>
    </div>
  </div>
);

const DealStep = ({ data, handleDealChange }) => (
  <div className="space-y-6 p-4">
    <h3 className="text-lg font-semibold text-gray-700">Deal</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField className="col-span-2" label="Deal Name" name="name" onChange={handleDealChange} readOnly={false} value={data.name} />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex">
        <FormField label="Deal Amount" name="amount" onChange={handleDealChange} value={data.amount} className="flex-grow" />
        <div className="flex flex-col justify-end ml-1">
          <span className="text-sm font-medium text-gray-600 border border-gray-300 bg-gray-100 p-2 rounded-r-lg h-10 flex items-center">
            PHP
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-700 mb-1">Status</label>
        <select name="stage" onChange={handleDealChange} value={data.stage} className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50">
          <option value="PROSPECTING">PROSPECTING</option>
          <option value="QUALIFICATION">QUALIFICATION</option>
          <option value="PROPOSAL">PROPOSAL</option>
          <option value="NEGOTIATION">NEGOTIATION</option>
          <option value="CLOSED_WON">CLOSED_WON</option>
          <option value="CLOSED_LOST">CLOSED_LOST</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      <div className="flex flex-col w-full col-span-2">
        <label className="text-xs text-gray-700 mb-1">Description</label>
        <textarea
          type="text"
          name='description'
          value={data.description}
          onChange={handleDealChange}
          rows={3}
          className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50"
        />
      </div>
    </div>
  </div>
);

// --- Main Component (Fixed-size Popup) ---
export default function AdminLeadsConvert({ setSelectedLead, fetchLeads, isOpen, onClose, lead, accountData, contactData, dealData, setAccountData, setContactData, setDealData }) {

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountData((prev) => ({ ...prev, [name]: value }));
  }

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactData((prev) => ({ ...prev, [name]: value }));
  }

  const handleDealChange = (e) => {
    const { name, value } = e.target;
    setDealData((prev) => ({ ...prev, [name]: value }));
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const finalAccountData = {
        ...accountData,
        phone_number: `${accountData.countryCode} ${accountData.phone_number}`
      }
      const res = await api.post(`/accounts/convertedLead`, finalAccountData);
      const accInsertId = res.data.id;

      const finalContactData = {
        ...contactData,
        account_id: accInsertId
      }
      const res1 = await api.post(`/contacts/convertedLead`, finalContactData);
      const contactInsertId = res1.data.id;

      const handleProbability = () => {
        switch (dealData.stage) {
          case 'PROSPECTING':
            return 10;
          case 'QUALIFICATION':
            return 25;
          case 'PROPOSAL':
            return 60;
          case 'NEGOTIATION':
            return 80;
          case 'CLOSED_WON':
            return 100;
          case 'CLOSED_LOST':
            return 0;
          default:
            return 0;
        }
      };

      const finalDealData = {
        ...dealData,
        account_id: accInsertId,
        primary_contact_id: contactInsertId,
        probability: handleProbability(),
      }
      const res2 = await api.post(`/deals/convertedLead`, finalDealData);

      const res3 = await api.put(`/leads/convert/${lead.id}`);

      if (setSelectedLead) {
        setSelectedLead(prev => ({
          ...prev,
          status: res3.data.status
        }));
      }

      fetchLeads(); // Refresh the leads list after conversion
      toast.success("Lead converted successfully!");
      onClose();
    } catch (error) {
      console.error("Error during conversion:", error);
    }
  }

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
        return <AccountStep data={accountData} handleAccountChange={handleAccountChange} setAccountData={setAccountData} />;
      case 2:
        return <ContactStep data={contactData} handleContactChange={handleContactChange} />;
      case 3:
        return <DealStep data={dealData} handleDealChange={handleDealChange} />;
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
            <h1 className="text-2xl font-bold text-gray-900 mt-1">meow</h1>
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
              className={`flex-1 py-3 px-6 text-sm font-medium transition ${currentStep === tab.id
                ? "bg-white text-gray-800 border-b-2 border-indigo-600"
                : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-6">{renderStepContent()}</div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
          )}
          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800 transition text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800 transition text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Convert
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
