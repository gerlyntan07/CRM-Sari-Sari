import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GiCheckMark } from "react-icons/gi";
import { IoIosArrowDown } from "react-icons/io";

const plans = [
  {
    name: "Free",
    monthly: "₱0",
    annual: "₱0",
    badge: "Lead Organizer",
    features: [
      "Unlimited contacts & leads",
      "Unlimited deals",
      "Essential pipeline view",
      "1 user seat",
    ],
    highlight: false,
  },
  {
    name: "Starter",
    monthly: "₱299",
    annual: "₱2,990",
    badge: "Collaboration Step",
    features: [
      "Up to 10 users",
      "Shared team calendar",
      "Activity tracking",
      "Manual workflow",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    monthly: "₱599",
    annual: "₱5,990",
    badge: "Efficiency Step",
    features: [
      "Unlimited users",
      "Automated follow-ups",
      "Bulk CSV exports/imports",
      "Custom fields",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    monthly: "₱999",
    annual: "₱8,991",
    badge: "Scale + Intelligence",
    features: [
      "Custom territory management",
      "Advanced team view",
      "Full accounting features",
      "AI integration",
    ],
    highlight: false,
  },
];

const featureComparison = [
  {
    feature: "User seats",
    Free: "1 user",
    Starter: "Up to 10 users",
    Pro: "Unlimited",
    Enterprise: "Unlimited",
  },
  {
    feature: "Contacts & leads",
    checklistOnly: true,
    Free: "Unlimited",
    Starter: "Unlimited",
    Pro: "Unlimited",
    Enterprise: "Unlimited",
  },
  {
    feature: "Deals",
    checklistOnly: true,
    Free: "Unlimited",
    Starter: "Unlimited",
    Pro: "Unlimited",
    Enterprise: "Unlimited",
  },
  {
    feature: "Pipeline view",
    Free: "Essential",
    Starter: "Advanced",
    Pro: "Advanced",
    Enterprise: "Advanced",
  },
  {
    feature: "Team calendar",
    Free: "—",
    Starter: "Shared",
    Pro: "Shared",
    Enterprise: "Shared + custom",
  },
  {
    feature: "Activity tracking",
    Free: "Basic",
    Starter: "Included",
    Pro: "Included",
    Enterprise: "Included",
  },
  {
    feature: "Workflow automation",
    Free: "—",
    Starter: "Manual only",
    Pro: "Automated follow-ups",
    Enterprise: "Advanced automation",
  },
  {
    feature: "CSV import/export",
    Free: "—",
    Starter: "Limited",
    Pro: "Bulk import/export",
    Enterprise: "Bulk + scheduled",
  },
  {
    feature: "Custom fields",
    checklistOnly: true,
    Free: "—",
    Starter: "—",
    Pro: "Included",
    Enterprise: "Included",
  },
  {
    feature: "AI integration",
    checklistOnly: true,
    Free: "—",
    Starter: "—",
    Pro: "—",
    Enterprise: "Included",
  },
];

const faqs = [
  {
    q: "Do I need a credit card to start?",
    a: "No. You can start using Forekas CRM with full Pro access without entering any payment details.",
  },
  {
    q: "What happens after 14 days?",
    a: "You can choose a plan that fits your needs. If not, your account will continue on the Free plan.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can upgrade, downgrade, or cancel your plan anytime.",
  },
  {
    q: "Do you offer annual discounts?",
    a: "Yes. You get 2 months free on Starter and Pro, and 3 months free on Enterprise when billed annually.",
  },
];

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const renderChecklistCell = (value) => {
    const isUnavailable = value === "—";

    return (
      <span className={isUnavailable ? "text-gray-400" : "text-gray-700"}>{value}</span>
    );
  };

  const renderIconOnlyCell = (value) => {
    const isUnavailable = value === "—";

    return (
      <div className="flex items-center justify-center" title={isUnavailable ? "Not included" : value}>
        {isUnavailable ? (
          <span className="inline-flex items-center justify-center rounded-full text-gray-400 text-sm">
            —
          </span>
        ) : (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700">
            <GiCheckMark className="text-[10px]" />
          </span>
        )}
      </div>
    );
  };

  useEffect(() => {
    document.title = "Pricing - Forekas CRM";
  }, []);

  return (
    <main className="min-h-screen bg-paper-white text-secondary font-manrope">
      {/* HEADER */}
      <header className="bg-secondary text-white py-4 border-b border-accent">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            Forekas <span className="text-accent">CRM</span>
          </Link>
          <nav className="flex gap-6">
            <Link to="/resources">Resources</Link>
            <Link to="/legal">Legal</Link>
            <Link to="/login">Log In</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-tertiary text-white py-16 text-center">
        <h1 className="text-4xl font-bold mb-3">Simple, transparent pricing</h1>
        <p className="text-gray-200 mb-6">
          You pay for collaboration and complexity, not for winning more deals.
        </p>

        {/* TOGGLE */}
        <div className="flex justify-center items-center gap-3">
          <span className={!isAnnual ? "font-bold" : "opacity-60"}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 bg-accent rounded-full relative"
          >
            <div
              className={`h-6 w-6 bg-white rounded-full absolute top-0 transition-all ${
                isAnnual ? "right-0" : "left-0"
              }`}
            />
          </button>
          <span className={isAnnual ? "font-bold" : "opacity-60"}>
            Annual (Save more)
          </span>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="py-16">
        <div className="container mx-auto px-4 grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.highlight
                  ? "bg-secondary text-white border-accent scale-105"
                  : "bg-white border-gray-200"
              }`}
            >
              <p className="text-sm mb-1 opacity-80">{plan.badge}</p>
              <h3 className="text-xl font-bold mb-3">{plan.name}</h3>

              <p className="text-3xl font-bold mb-4">
                {isAnnual ? plan.annual : plan.monthly}
                <span className="text-sm font-normal opacity-70">
                  {isAnnual ? "/year" : "/month"}
                </span>
              </p>

              <ul className="space-y-2 text-sm mb-6">
                {plan.features.map((f) => (
                  <li key={f}>
                    <GiCheckMark className="inline mr-2 text-accent" /> {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className={`block text-center py-2 rounded-lg font-semibold ${
                  plan.highlight
                    ? "bg-accent text-secondary"
                    : "border border-accent text-accent"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>        
      </section>

      <div className='w-full text-center pb-10 items-center flex justify-center'>
        <button
          onClick={() => setShowComparison((prev) => !prev)}
          className="mt-6 px-5 py-2 rounded-lg text-tertiary/40 bg-white/5 hover:bg-white/10 cursor-pointer flex flex-row justify-center items-center gap-2 font-medium"
        >
          {showComparison ? "Hide full feature grid" : "Expand full feature grid"} <IoIosArrowDown className={`${showComparison ? "transform rotate-180" : "transform rotate-0"} ease-in-out transition-all delay-150 duration-300`} />
        </button>
      </div>

      {/* EXPANDABLE FEATURE GRID */}
      {showComparison && (
        <section className="pb-16">        
          <div className="container mx-auto px-4">
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Feature</th>
                    <th className="text-left px-4 py-3 font-semibold">Free</th>
                    <th className="text-left px-4 py-3 font-semibold">Starter</th>
                    <th className="text-left px-4 py-3 font-semibold">Pro</th>
                    <th className="text-left px-4 py-3 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((row) => (
                    <tr key={row.feature} className="border-b border-gray-100 last:border-b-0 text-center">
                      <td className="px-4 py-3 font-medium text-secondary">{row.feature}</td>
                      <td className="px-4 py-3">
                        {row.checklistOnly ? renderIconOnlyCell(row.Free) : renderChecklistCell(row.Free)}
                      </td>
                      <td className="px-4 py-3">
                        {row.checklistOnly ? renderIconOnlyCell(row.Starter) : renderChecklistCell(row.Starter)}
                      </td>
                      <td className="px-4 py-3">
                        {row.checklistOnly ? renderIconOnlyCell(row.Pro) : renderChecklistCell(row.Pro)}
                      </td>
                      <td className="px-4 py-3">
                        {row.checklistOnly
                          ? renderIconOnlyCell(row.Enterprise)
                          : renderChecklistCell(row.Enterprise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TRIAL SECTION */}
      <section className="py-16 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Try Pro — No credit card required
        </h2>
        <div className="max-w-xl mx-auto text-gray-700 space-y-2">
          <p>✔ Full Pro access for 14 days</p>
          <p>✔ No credit card required</p>
          <p>✔ Continue on Free if you don’t upgrade</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6 text-center">FAQs</h2>
          <div className="space-y-4">
            {faqs.map((item, i) => (
              <div key={i} className="border rounded-lg p-4">
                <p className="font-semibold mb-1">{item.q}</p>
                <p className="text-sm text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-secondary text-white text-center">
        <h2 className="text-3xl font-bold mb-3">Get started for free</h2>
        <p className="text-gray-200 mb-6">
          No credit card required. Upgrade anytime.
        </p>
        <Link
          to="/signup"
          className="px-8 py-3 bg-accent text-secondary rounded-lg font-semibold"
        >
          Start Free
        </Link>
      </section>
    </main>
  );
};

export default Pricing;