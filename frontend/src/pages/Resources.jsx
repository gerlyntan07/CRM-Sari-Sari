import React, { useEffect } from "react";
import { Link } from "react-router-dom";

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
      description: "Understand our security practices and certifications.",
      link: "#",
    },
    {
      title: "Support",
      description: "Get help from our support team and knowledge base.",
      link: "#",
    },
  ];

  return (
    <div className="font-inter">
      <ResourcesHeader />
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
                <a
                  href={resource.link}
                  className="text-accent font-semibold hover:text-secondary transition-colors"
                >
                  Learn More →
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Resources;
