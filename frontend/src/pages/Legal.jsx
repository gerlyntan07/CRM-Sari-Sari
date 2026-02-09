import React, { useEffect } from "react";
import { Link } from "react-router-dom";

// --- Legal Header ---
const LegalHeader = () => (
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

// --- Legal Page ---
const Legal = () => {
  useEffect(() => {
    document.title = "Legal - Sari-Sari CRM";
  }, []);

  const legalSections = [
    {
      title: "Terms",
      description: "Our terms of service and conditions of use.",
      link: "#",
    },
    {
      title: "Privacy",
      description: "How we protect and handle your personal data.",
      link: "#",
    },
    {
      title: "SLA",
      description: "Service level agreements and guarantees.",
      link: "#",
    },
    {
      title: "Compliance",
      description: "Our compliance standards and certifications.",
      link: "#",
    },
  ];

  return (
    <div className="font-inter">
      <LegalHeader />
      <main className="bg-paper-white min-h-screen py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold text-secondary mb-4">Legal</h1>
          <p className="text-lg text-secondary mb-12">
            Important legal information and policies
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {legalSections.map((section, i) => (
              <div
                key={i}
                className="p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-2xl font-semibold text-secondary mb-2">
                  {section.title}
                </h3>
                <p className="text-gray-600 mb-4">{section.description}</p>
                <a
                  href={section.link}
                  className="text-accent font-semibold hover:text-secondary transition-colors"
                >
                  Read More →
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Legal;
