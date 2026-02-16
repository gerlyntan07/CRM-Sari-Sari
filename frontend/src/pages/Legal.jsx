import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// --- Terms of Use Modal ---
const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const termsContent = [
    {
      number: "1",
      title: "Authorized Use",
      content: [
        'Sari-Sari CRM  is an internal company platform intended to manage leads, deals, accounts, contacts, scheduling, and task workflows.',
        'Access is granted according to employment role and operational responsibilities. Users are required to safeguard their credentials and operate strictly within assigned permissions. Unauthorized access, credential sharing, or misuse of the System is prohibited and may result administrative action.'
      ]
    },
    {
      number: "2",
      title: "System Purpose",
      content: [
        "The System supports company sales operations, including:",
        "• Lead and deal pipeline management\n• Account and contact records\n• Scheduling of calls and meetings\n• Task tracking and follow-ups\n• Activity logging and reporting"
      ]
    },
    {
      number: "3",
      title: "Role-Based Responsibilities",
      content: [
        "Users are assigned permissions based on their role:",
        "Administrator — Full configuration, oversight, and system governance.",
        "Group Manager — Team supervision, reporting, and workflow monitoring.",
        "Manager — Operational coordination and performance oversight.",
        "Sales Users — Execution of sales activities and record maintenance.",
        "Users must operate strictly within assigned permissions."
      ]
    },
    {
      number: "4",
      title: "Data Integrity & Confidentiality",
      content: [
        "All information stored in the System is confidential company data.",
        "Users must:\n• Maintain accurate records\n• Protect customer and sales information\n• Avoid unauthorized disclosure or manipulation",
        "Intentional misuse may lead to disciplinary action."
      ]
    },
    {
      number: "5",
      title: "Activity Logging & Monitoring",
      content: [
        "System actions may be recorded for accountability, performance review, and security purposes. Continued use indicates consent to such monitoring."
      ]
    },
    {
      number: "6",
      title: "Acceptable Conduct",
      content: [
        "Users must not:\n• Enter false or misleading information\n• Delete or alter records without authorization\n• Attempt to bypass security measures\n• Use the System for personal or unrelated activities",
        "Professional conduct is required at all times."
      ]
    },
    {
      number: "7",
      title: "Scheduling & Task Accountability",
      content: [
        "Users are responsible for maintaining accurate scheduling records and completing assigned tasks in good faith to support operational efficiency."
      ]
    },
    {
      number: "8",
      title: "Security Responsibilities",
      content: [
        "Users must safeguard login credentials and immediately report suspicious activity. Account sharing is prohibited."
      ]
    },
    {
      number: "9",
      title: "Intellectual Property",
      content: [
        "The System, including its interface, workflows, and software components, is proprietary company property and may not be copied or redistributed without authorization."
      ]
    },
    {
      number: "10",
      title: "System Availability",
      content: [
        "The company will maintain reasonable uptime but does not guarantee uninterrupted access due to maintenance or unforeseen technical issues."
      ]
    },
    {
      number: "11",
      title: "Violations",
      content: [
        "Misuse of the System may result in:\n• Access restriction or suspension\n• Internal disciplinary action\n• Further administrative review",
        "depending on severity."
      ]
    },
    {
      number: "12",
      title: "Support & Reporting",
      content: [
        "Questions or concerns regarding System use should be directed to:",
        <strong key="dept">Sari-Sari CRM Administration</strong>,
    <a
      key="email"
      href="https://www.sari-sari.com/"
      className="font-bold text-accent hover:underline"
       target="_blank"
       rel="noopener noreferrer"
    >
      sari-sari.com
    </a>
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-secondary text-white px-8 py-6 flex items-center justify-between border-b border-accent">
          <div>
            <h2 className="text-3xl font-bold">Terms of Use</h2>
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
            These Terms of Use govern your access to and use of the Sari-Sari CRM system. 
            By accessing or using the System, you acknowledge that you have read, understood, 
            and agree to be bound by these terms.
          </p>

          <div className="space-y-6">
            {termsContent.map((section, index) => (
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
              By continuing to use Sari-Sari CRM, you acknowledge that you have read and agree 
              to these Terms of Use. If you do not agree with any part of these terms, you must 
              discontinue use of the System immediately.
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


// --- Privacy Policy Modal ---  

const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const privacyContent = [
    {
      number: "1",
      title: "Users and Roles",
      content: [
        "The system supports multiple roles with distinct access permissions:",
        "Admin – full system access and management.\nGroup Manager – oversees multiple teams and manages metrics.\nManager – manages teams and monitors pipeline progress.\nSales – accesses leads, contacts, accounts, deals, quotes, target and schedules.",
        "Access to business data is strictly limited to authorized users in your organization based on role."
      ]
    },
    {
      number: "2",
      title: "Data We Collect",
      content: [
        "We may collect the following types of data:",
        "Account Information: Names, email addresses, phone numbers, company details, and login credentials.\nBusiness Data: Leads, contacts, accounts, deals, quotes, notes, and pipeline information entered by your organization.\nScheduling Data: Tasks, meetings, and calls associated with your account or team.\nUsage Data: IP addresses, device information, login activity, and feature usage for system analytics.\nCookies & Tracking: Cookies or similar technologies for authentication, and performance monitoring."
      ]
    },
    {
      number: "3",
      title: "Purpose of Data Processing",
      content: [
        "Your data is processed only to:",
        "• Provide, operate, and maintain the CRM platform.\n• Manage user roles, permissions, and workflow operations.\n• Facilitate collaboration and sales processes within your organization. \n• Comply with legal obligations and protect the security of the platform."
      ]
    },
    {
      number: "4",
      title: "Developer Access and Confidentiality",
      content: [
        "We respect your business privacy. Our developers and internal staff cannot access business transaction information.",
        "Developer access is limited to technical maintenance, bug fixing, system monitoring, and improvements. Access is strictly controlled, logged, and does not include the ability to view or extract business-specific information."
      ]
    },
    {
      number: "5",
      title: "Data Sharing",
      content: [
        "We do not sell or trade your data. Data may be shared only with:",
        "Service Providers: Vendors who help host, operate, or maintain the CRM. They are bound by confidentiality agreements.\nLegal Requirements: Where disclosure is required by law, regulation, or legal process."
      ]
    },
    {
      number: "6",
      title: "Data Security",
      content: [
        "We implement reasonable technical, administrative, and organizational measures to protect your data from unauthorized access, disclosure, alteration, or destruction. Users must also maintain secure login credentials and account access."
      ]
    },
    {
      number: "7",
      title: "Data Retention",
      content: [
        "We retain data only as long as necessary to provide services and comply with legal obligations. Your organization's Admins may request deletion of user accounts and associated business data."
      ]
    },
    {
      number: "8",
      title: "Consent",
      content: [
        "By using our CRM, your organization consents to the collection, processing, and storage of data as described in this Privacy Policy. Admins are responsible for ensuring that all users within their organization are aware of this policy and that proper consent has been obtained where required."
      ]
    },
    {
      number: "9",
      title: "Third-Party Integrations",
      content: [
        "Our CRM may integrate with third-party tools (e.g., email, calendar, analytics). We are not responsible for the privacy practices of these third parties."
      ]
    },
    {
      number: "10",
      title: "Data Processing Agreement",
      content: [
        "By using Sari-Sari CRM, your organization acknowledges and agrees that:",
        "• Your organization is the Data Controller of all business and personal data entered into the CRM. \n• We implement technical and organizational measures to ensure data confidentiality, integrity, and security.\n• Developer access to business transaction data is strictly restricted and logged, and we will not use or disclose your organization's business data for any purpose other than providing and maintaining the CRM services."
      ]
    }
    // {
    //   number: "11",
    //   title: "Changes to This Policy",
    //   content: [
    //     "We may update this Privacy Policy periodically. Changes will take effect upon posting on the CRM platform. Users and organizations are encouraged to review it regularly."
    //   ]
    // },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-secondary text-white px-8 py-6 flex items-center justify-between border-b border-accent">
          <div>
            <h2 className="text-3xl font-bold">Privacy Policy</h2>
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
Sari-Sari CRM provides a B2B CRM platform designed to help manage businesses. Protecting your business and personal data is a top priority. This Privacy Policy explains how we collect, process, store, and protect data in compliance with applicable.
          </p>

          <div className="space-y-6">
            {privacyContent.map((section, index) => (
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
              Your privacy and data security are important to us. If you have any questions about this Privacy Policy, 
              please contact our CRM Administration team.
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

// --- SLA Modal ---  

const SlaModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const slaContent = [
    {
      number: "1",
      title: "Purpose",
      content: [
        "This Service Level Agreement (\"SLA\") defines the service standards, availability commitments, support expectations, and responsibilities associated with the use of Sari-Sari CRM, a business-to-business customer relationship management platform."
      ]
      },
    {
      number: "2",
      title: "Service Availability",
      content: [
        "We work to keep the CRM available 99.5% of the time each month so your team can manage work without interruption.",
        "Planned maintenance is announced in advance whenever possible. Emergency maintenance may happen if needed to keep the system secure and stable.",
        "Downtime caused by scheduled maintenance, internet or third-party issues, user device problems, or events outside our control is not included in availability targets."
      ]
    },
    {
      number: "3",
      title: "Performance Standards",
      content: [
        "The CRM platform is designed to:",
        "• Provide consistent access to business records and sales workflows\n• Support role-based system operations",
        "Performance may vary depending on user device, internet connection, and data volume."
      ]
    },
    {
      number: "4",
      title: "Data Protection & Confidentiality",
      content: [
        "We prioritize business data security:",
        "• Access to CRM data is restricted to authorized organizational users\n• Developers and internal staff do not access business transaction data\n• Security safeguards are implemented to protect confidentiality and integrity"
      ]
    },
    {
      number: "5",
      title: "Incident Management",
      content: [
        "If a service disruption occurs:",
        "• Issues are logged and prioritized based on severity\n• Mitigation steps are started as quickly as possible\n• Users are informed of significant incidents when appropriate"
      ]
    },
    {
      number: "6",
      title: "Customer Responsibilities",
      content: [
        "Organizations using the CRM agree to:",
        "• Maintain secure login credentials\n• Use the system in accordance with assigned roles\n• Report issues promptly\n• Ensure stable internet and device compatibility"
      ]
    },
    {
      number: "7",
      title: "Maintenance & Updates",
      content: [
        "We may perform:",
        "• Routine maintenance\n• Security updates\n• Feature improvements",
        "Maintenance may temporarily affect availability."
      ]
    },
    {
      number: "8",
      title: "Limitations",
      content: [
        "Service commitments do not apply to disruptions caused by:",
        "• User misuse or unauthorized modifications\n• Third-party service failures\n• Network or infrastructure outside our control"
      ]
    },
    {
      number: "9",
      title: "Review & Modification",
      content: [
        "This SLA may be updated to reflect service improvements or operational changes. Continued use of the CRM indicates acceptance of updates."
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-secondary text-white px-8 py-6 flex items-center justify-between border-b border-accent">
          <div>
            <h2 className="text-3xl font-bold">Service Level Agreement</h2>
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
            This Service Level Agreement defines the service standards, availability commitments, support expectations, and responsibilities associated with the use of Sari-Sari CRM.
          </p>

          <div className="space-y-6">
            {slaContent.map((section, index) => (
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
              This SLA may be updated to reflect service improvements or operational changes. Continued use of the CRM indicates acceptance of updates.
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

// --- Compliance Modal ---  

const ComplianceModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const complianceContent = [
    {
      number: "1",
      title: "Data Privacy Compliance",
      content: [
        "Our platform is built to align with applicable data protection regulations, including:",
        "• Philippine Data Privacy Act (RA 10173)\n• Applicable international privacy standards where required",
        "We support lawful collection, processing, and storage of business and personal information handled within the CRM."
      ]
    },
    {
      number: "2",
      title: "Access & Confidentiality Controls",
      content: [
        "We enforce role-based access controls to ensure that only authorized users within an organization can view or manage business data such as leads, contacts, accounts, deals, and quotes.",
        "Developer and internal access is restricted to system maintenance and operational support under controlled conditions."
      ]
    },
    {
      number: "3",
      title: "Security Practices",
      content: [
        "We implement reasonable administrative, technical, and organizational safeguards designed to:",
        "• Protect data confidentiality\n• Prevent unauthorized access\n• Maintain system integrity\n• Support operational reliability",
        "Security measures are reviewed and improved as part of ongoing system maintenance."
      ]
    },
    {
      number: "4",
      title: "Operational Compliance",
      content: [
        "The CRM follows structured operational processes to support:",
        "• System availability and maintenance standards\n• Incident management and issue resolution\n• Data handling accountability\n• Responsible service delivery"
      ]
    },
    {
      number: "5",
      title: "Continuous Improvement",
      content: [
        "Compliance and security practices are regularly evaluated to adapt to evolving regulatory expectations and technology standards."
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-secondary text-white px-8 py-6 flex items-center justify-between border-b border-accent">
          <div>
            <h2 className="text-3xl font-bold">Compliance Standards & Commitments</h2>
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
            Sari-Sari CRM is designed to support responsible business data management while aligning with recognized privacy, security, and operational best practices. We are committed to maintaining safeguards that protect customer and organizational information.
          </p>

          <div className="space-y-6">
            {complianceContent.map((section, index) => (
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
              Compliance and security practices are regularly evaluated to adapt to evolving regulatory expectations and technology standards.
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
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isSlaOpen, setIsSlaOpen] = useState(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  

  useEffect(() => {
    document.title = "Legal - Sari-Sari CRM";
  }, []);

  const legalSections = [
    {
      title: "Terms",
      description: "Our terms of service and conditions of use.",
      action: () => setIsTermsOpen(true),
    },
    {
      title: "Privacy",
      description: "How we protect and handle your personal data.",
      action: () => setIsPrivacyOpen(true),
    },
    {
      title: "Service Level Agreement (SLA)",
      description: "Service level agreements and guarantees.",
      action: () => setIsSlaOpen(true),
    },
    {
      title: "Compliance",
      description: "Our compliance standards.",
      action: () => setIsComplianceOpen(true),
    },
  ];

  return (
    <div className="font-manrope">
      <LegalHeader />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <SlaModal isOpen={isSlaOpen} onClose={() => setIsSlaOpen(false)} />
      <ComplianceModal isOpen={isComplianceOpen} onClose={() => setIsComplianceOpen(false)} />
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
                {section.action ? (
                  <button
                    onClick={section.action}
                    className="text-accent font-semibold hover:text-secondary transition-colors"
                  >
                    Read More →
                  </button>
                ) : (
                  <a
                    href={section.link}
                    className="text-accent font-semibold hover:text-secondary transition-colors"
                  >
                    Read More →
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

export default Legal;
