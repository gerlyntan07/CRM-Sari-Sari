import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// --- Security Modal ---
const SecurityModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const securityContent = [
    {
      number: "1",
       title: "Enterprise Security Commitment",
      content: [
        "Sari-Sari CRM maintains a security-first architecture designed to protect business data, preserve system integrity, and support continuous operational reliability. Security controls are implemented across administrative, technical, and operational layers to reduce risk and safeguard organizational information."
      ]
    },
    {
      number: "2",
      title: "Access Governance",
      content: [
        "The platform enforces strict role-based access controls to ensure that only authorized organizational users can access CRM records, including leads, contacts, accounts, deals, quotes, and scheduling information. Permission boundaries are applied according to user roles and operational responsibilities.",
        "Internal and developer access is tightly restricted, monitored, and permitted only for essential system maintenance under controlled conditions."
      ]
    },
    {
      number: "3",
      title: "Data Protection Controls",
      content: [
        "Security measures are designed to:",
        "• Protect confidentiality of business records\n• Prevent unauthorized access or disclosure\n• Preserve data integrity\n• Maintain availability of services",
        "Safeguards are reviewed periodically and updated to address evolving threats and operational needs."
      ]
    },
    {
      number: "4",
      title: "Operational Security",
      content: [
        "We maintain structured incident management, monitoring, and maintenance processes to support secure system performance. Security events are prioritized and addressed using defined response procedures."
      ]
    },
    {
      number: "5",
      title: "Shared Responsibility",
      content: [
        "Organizations are responsible for maintaining secure credential practices, enforcing internal access policies, and promptly reporting suspected security concerns."
      ]
    },
    {
      number: "6",
      title: "Technical Security Framework",
      content: [
        "Sari-Sari CRM employs layered security controls aligned with industry best practices to protect data and platform operations."
      ]
    },
    {
      number: "7",
      title: "Access & Authentication",
      content: [
        "• Role-based authorization controls\n• Credential protection mechanisms\n• Session management safeguards"
      ]
    },
    {
      number: "8",
      title: "Data Protection",
      content: [
        "• Controlled access to stored business records\n• Logical isolation of organizational data\n• Integrity protections to prevent unauthorized modification",
        "Developer access to production environments is restricted, logged, and limited to operational necessity."
      ]
    },
    {
      number: "9",
      title: "System Security Measures",
      content: [
        "• Monitoring for abnormal system behavior\n• Controlled maintenance workflows\n• Incident response procedures\n• Secure update and deployment processes"
      ]
    },
    {
      number: "10",
      title: "Security Lifecycle",
      content: [
        "Security practices are continuously evaluated and refined to maintain resilience against emerging risks."
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-secondary text-white px-8 py-6 flex items-center justify-between border-b border-accent">
          <div>
            <h2 className="text-3xl font-bold">Security Guidelines</h2>
            {/* <p className="text-sm text-gray-300 mt-1">Last updated: February 14, 2026</p> */}
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-accent transition-colors text-4xl leading-none"
          >
            ×
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-8 py-6 scrollbar-hide">
          <p className="text-gray-700 mb-6 leading-relaxed">
            This document outlines the enterprise and technical security measures implemented to protect your business data and ensure the integrity, confidentiality, and availability of the Sari-Sari CRM platform.
          </p>

          <div className="space-y-6">
            {securityContent.map((section, index) => (
              <div key={index} className="border-l-4 border-accent pl-6 py-2">
                <h3 className="text-xl font-semibold text-secondary mb-2">
                  {section.number}. {section.title}
                </h3>
                {section.content.map((paragraph, pIndex) => (
                  <p 
                    key={pIndex} 
                    className="text-gray-700 mb-2 leading-relaxed whitespace-pre-line text-sm"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 mb-10 border-t border-gray-200">
            <p className="text-gray-600 text-xs leading-relaxed text-center">
              Security is a shared responsibility. We are committed to maintaining robust protections while working with our customers to ensure secure and responsible use of the platform.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-8 py-4 border-t border-gray-200">
          <button 
            onClick={onClose}
            className="w-full bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Security Modal ---
const SupportModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const securityContent = [
    {
      number: "1",
      title: "Support Commitment",
      content: [
        "Sari-Sari CRM provides operational support to help organizations maintain smooth and reliable use of the platform. Our goal is to resolve issues efficiently and minimize disruption to your business workflows."
      ]
    },
    {
      number: "2",
      title: "Support Coverage",
      content: [
        "Support services include assistance with:",
        "• System or feature malfunctions\n• Performance concerns\n• General platform inquiries",
        "Support does not include custom development, third-party integrations outside our platform, or user-side hardware/network issues."
      ]
    },
    {
      number: "3",
      title: "User Responsibilities",
      content: [
        "Organizations and users help maintain efficient support by:",
        "• Reporting issues promptly\n• Providing accurate information\n• Following role permissions\n• Maintaining secure account access"
      ]
    },
    {
      number: "4",
      title: "Continuous Improvement",
      content: [
        "Support feedback is used to improve system performance, reliability, and user experience."
      ]
    },
    {
      number: "5",
      title: "Support & Reporting",
      content: [
        "Users should submit support requests through designated communication channels, including:",
         <strong key="dept">Sari-Sari CRM Administration</strong>,
    <a
      key="email"
      href="https://www.sari-sari.com/"
      className="font-bold text-accent hover:underline"
       target="_blank"
       rel="noopener noreferrer"
    >
      sari-sari.com
    </a>,
        "Providing clear details helps accelerate resolution."
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-secondary text-white px-8 py-6 flex items-center justify-between border-b border-accent">
          <div>
            <h2 className="text-3xl font-bold">Support</h2>
            {/* <p className="text-sm text-gray-300 mt-1">Last updated: February 14, 2026</p> */}
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-accent transition-colors text-4xl leading-none"
          >
            ×
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-8 py-6 scrollbar-hide">
          <p className="text-gray-700 mb-6 leading-relaxed">
            Sari-Sari CRM is committed to providing responsive and effective support to help your organization succeed. Our support team is here to assist with platform access, features, performance, and general questions.
          </p>

          <div className="space-y-6">
            {securityContent.map((section, index) => (
              <div key={index} className="border-l-4 border-accent pl-6 py-2">
                <h3 className="text-xl font-semibold text-secondary mb-2">
                  {section.number}. {section.title}
                </h3>
                {section.content.map((paragraph, pIndex) => (
                  <p 
                    key={pIndex} 
                    className="text-gray-700 mb-2 leading-relaxed whitespace-pre-line text-sm"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 mb-10 border-t border-gray-200">
            <p className="text-gray-600 text-xs leading-relaxed text-center">
              We value your feedback and continuously improve our support services based on your experience. Thank you for using Sari-Sari CRM.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-8 py-4 border-t border-gray-200">
          <button 
            onClick={onClose}
            className="w-full bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Resources Header ---
const ResourcesHeader = () => (
  <header className="bg-secondary text-white py-4 border-b border-accent">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between py-3">
        <Link to="/" className="text-2xl font-bold">
          Sari-Sari <span className="text-accent">CRM</span>
        </Link>
        <nav className="flex space-x-8">
          <Link to="/resources" className="hover:text-accent transition-colors">
            Resources
          </Link>
          <Link to="/legal" className="hover:text-accent transition-colors">
            Legal
          </Link>
        </nav>
      </div>
    </div>
  </header>
);

// --- Resources Page ---
const Resources = () => {
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
  
    
  useEffect(() => {
    document.title = "Resources - Sari-Sari CRM";
  }, []);

  const resourcesData = [
    // {
    //   title: "Case Studies",
    //   description: "See how our customers are transforming their sales processes.",
    //   link: "#",
    // },
    // {
    //   title: "Webinars",
    //   description: "Learn best practices and get tips from our CRM experts.",
    //   link: "#",
    // },
    {
      title: "Security",
      description: "Understand our security practices.",
      action: () => setIsSecurityOpen(true),
    },
    {
      title: "Support",
      description: "Get help from our support team and knowledge base.",
      action: () => setIsSupportOpen(true),
    },
  ];

  return (
    <div className="font-manrope">
      <ResourcesHeader />
      <SecurityModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />


      <main className="bg-paper-white min-h-screen py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold text-secondary mb-4">Resources</h1>
          <p className="text-lg text-secondary mb-12">
            Everything you need to succeed with Sari-Sari CRM
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {resourcesData.map((resource, i) => (
              <div
                key={i}
                className="p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-2xl font-semibold text-secondary mb-2">
                  {resource.title}
                </h3>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                {resource.action ? (
                  <button
                    onClick={resource.action}
                    className="text-accent font-semibold hover:text-secondary transition-colors"
                  >
                    Learn More →
                  </button>
                ) : (
                  <a
                    href={resource.link}
                    className="text-accent font-semibold hover:text-secondary transition-colors"
                  >
                    Learn More →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Resources;
