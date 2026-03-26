import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GiCheckMark } from "react-icons/gi";
import { IoIosArrowDown } from "react-icons/io";

const plans = [
  {
    name: "Free",
    monthly: "₱0",
    annual: "₱0",
    badge: "Entry plan",
    features: [
      "Up to 1 user",
      "500 accounts/leads + 1,000 contacts",
      "Basic dashboard",
      "1 fixed pipeline",
    ],
    highlight: false,
  },
  {
    name: "Starter",
    monthly: "₱199",
    annual: "₱159",
    badge: "Per user / month",
    features: [
      "10k accounts/leads + 20k contacts",
      "2 custom pipelines",
      "20 CSV exports/month",
      "10 custom fields",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    monthly: "₱399",
    annual: "₱319",
    badge: "Per user / month",
    features: [
      "Unlimited CRM records",
      "Basic AI + forecasting",
      "Bulk import + scheduled export",
      "30-day audit logs",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    monthly: "₱799",
    annual: "₱639",
    badge: "Per user / month",
    features: [
      "Unlimited everything",
      "Advanced AI + granular roles",
      "1-year audit logs",
      "Custom SLA + white-glove onboarding",
    ],
    highlight: false,
  },
];

const comparisonSections = [
  {
    title: "Core Billing",
    rows: [
      {
        feature: "Billing Model",
        Free: "Flat",
        Starter: "Per-user",
        Pro: "Per-user",
        Enterprise: "Per-user",
      },
      {
        feature: "Monthly Price (per user)",
        Free: "₱0",
        Starter: "₱199",
        Pro: "₱399",
        Enterprise: "₱799",
      },
      {
        feature: "Annual Effective Rate (per user/mo)",
        Free: "₱0",
        Starter: "₱159",
        Pro: "₱319",
        Enterprise: "₱639",
      },
      {
        feature: "Annual Incentive",
        Free: "—",
        Starter: "2 months free",
        Pro: "2 months free",
        Enterprise: "3 months free",
      },
    ],
  },
  {
    title: "CRM Data",
    rows: [
      { feature: "Accounts", Free: "500", Starter: "10,000", Pro: "Unlimited", Enterprise: "Unlimited" },
      { feature: "Contacts", Free: "1,000", Starter: "20,000", Pro: "Unlimited", Enterprise: "Unlimited" },
      { feature: "Leads", Free: "500", Starter: "10,000", Pro: "Unlimited", Enterprise: "Unlimited" },
      { feature: "Deals", Free: "50", Starter: "1,000", Pro: "Unlimited", Enterprise: "Unlimited" },
    ],
  },
  {
    title: "Sales & Finance",
    rows: [
      {
        feature: "Pipelines",
        Free: "1 (fixed)",
        Starter: "2 (custom)",
        Pro: "Unlimited",
        Enterprise: "Unlimited",
      },
      {
        feature: "Quotes",
        Free: "View-only",
        Starter: "Standard",
        Pro: "Unlimited",
        Enterprise: "Unlimited + approvals",
      },
      {
        feature: "Sales Targets",
        Free: "❌",
        Starter: "2 (per user)",
        Pro: "Team + individual",
        Enterprise: "Advanced (multi-dimension)",
      },
      {
        feature: "Statement of Account (SOA)",
        Free: "View-only",
        Starter: "Basic",
        Pro: "Full",
        Enterprise: "Full + controls",
      },
    ],
  },
  {
    title: "Dashboard & Reporting",
    rows: [
      {
        feature: "Dashboard",
        Free: "Basic",
        Starter: "Basic + summary",
        Pro: "Advanced",
        Enterprise: "Fully customizable",
      },
      {
        feature: "Reports",
        Free: "❌",
        Starter: "Basic",
        Pro: "Advanced + forecasting",
        Enterprise: "Advanced + forecasting",
      },
    ],
  },
  {
    title: "Activities",
    rows: [
      {
        feature: "Tasks",
        Free: "50/month",
        Starter: "Unlimited",
        Pro: "Unlimited + reminders",
        Enterprise: "Advanced analytics",
      },
      {
        feature: "Calls",
        Free: "Log only",
        Starter: "Tracking",
        Pro: "Tracking + analytics",
        Enterprise: "Advanced analytics",
      },
      {
        feature: "Meetings",
        Free: "Logging",
        Starter: "Calendar sync",
        Pro: "Full sync + reminders",
        Enterprise: "Advanced analytics",
      },
      {
        feature: "Calendar",
        Free: "Basic",
        Starter: "Shared view",
        Pro: "Team calendar sync",
        Enterprise: "Cross-team view",
      },
    ],
  },
  {
    title: "Territory & Team",
    rows: [
      {
        feature: "Territory Management",
        Free: "❌",
        Starter: "❌",
        Pro: "Basic",
        Enterprise: "Advanced (hierarchy)",
      },
      { feature: "Team Performance", Free: "❌", Starter: "❌", Pro: "✔", Enterprise: "Advanced" },
      // {
      //   feature: "User Management",
      //   Free: "Basic",
      //   Starter: "Standard",
      //   Pro: "Advanced",
      //   Enterprise: "Advanced + policy controls",
      // },
    ],
  },
  {
    title: "Customization",
    rows: [
      { feature: "Custom Fields", Free: "❌", Starter: "10/module", Pro: "50/module", Enterprise: "Unlimited" },
      { feature: "Pipeline Customization", Free: "❌", Starter: "✔", Pro: "✔", Enterprise: "✔" },
      { feature: "Field Validation", Free: "❌", Starter: "❌", Pro: "✔", Enterprise: "✔" },
      { feature: "Branding / Theme", Free: "❌", Starter: "Basic", Pro: "Standard", Enterprise: "Advanced" },
      { feature: "AI Features", Free: "❌", Starter: "❌", Pro: "Basic AI", Enterprise: "Advanced AI" },
    ],
  },
  {
    title: "Data & Export",
    rows: [
      {
        feature: "CSV Export",
        Free: "❌",
        Starter: "20/month",
        Pro: "Unlimited + scheduled",
        Enterprise: "Unlimited + scheduled",
      },
      {
        feature: "Data Import",
        Free: "❌",
        Starter: "Standard",
        Pro: "Bulk",
        Enterprise: "Bulk + assisted",
      },
    ],
  },
  {
    title: "Security & Logs",
    rows: [
      { feature: "Audit Logs", Free: "❌", Starter: "❌", Pro: "30 days", Enterprise: "1 year" },
      { feature: "Activity Logs", Free: "❌", Starter: "❌", Pro: "✔", Enterprise: "✔" },
      { feature: "Backup & Restore", Free: "❌", Starter: "Manual", Pro: "Scheduled", Enterprise: "Priority restore" },
    ],
  },
  {
    title: "Integrations & API",
    rows: [
      { feature: "API Access", Free: "❌", Starter: "❌", Pro: "Limited", Enterprise: "Extended" },
      { feature: "Webhook Events", Free: "❌", Starter: "❌", Pro: "❌", Enterprise: "Roadmap" },
      { feature: "Email Notifications", Free: "Basic", Starter: "Standard", Pro: "Advanced", Enterprise: "Advanced" },
    ],
  },
  {
    title: "Support",
    rows: [
      { feature: "Support", Free: "Basic", Starter: "Basic", Pro: "Priority", Enterprise: "Dedicated" },
      { feature: "Onboarding", Free: "Self-serve", Starter: "Guided setup", Pro: "Guided + training", Enterprise: "White-glove" },
      { feature: "SLA", Free: "❌", Starter: "❌", Pro: "Standard", Enterprise: "Custom" },
    ],
  },
  {
    title: "Growth Incentives",
    rows: [
      { feature: "Volume Discount (10–19 users)", Free: "❌", Starter: "10% off", Pro: "10% off", Enterprise: "10% off" },
      { feature: "Volume Discount (20+ users)", Free: "❌", Starter: "15% off", Pro: "15% off", Enterprise: "15% off" },
      { feature: "Migration Credit", Free: "❌", Starter: "₱4,999 one-time", Pro: "₱4,999 one-time", Enterprise: "₱4,999 one-time" },
      { feature: "Upgrade Bonus", Free: "❌", Starter: "❌", Pro: "+1 month Pro (first upgrade)", Enterprise: "+1 month Pro (first upgrade)" },
    ],
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
    a: "Yes. Starter and Pro include 2 months free, while Enterprise includes 3 months free when billed annually.",
  },
  {
    q: "Are there team-size discounts?",
    a: "Yes. Total bill gets 10% off for 10–19 active users and 15% off for 20+ active users.",
  },
  {
    q: "Do migration credits apply?",
    a: "Yes. Qualified upgrades include a one-time ₱4,999 migration credit for assisted bulk import and +1 month Pro on first upgrade.",
  },
];

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const renderCell = (value) => {
    if (value === "❌") {
      return <span className="text-gray-400">—</span>;
    }

    if (value === "✔") {
      return (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 align-middle">
          <GiCheckMark className="text-[10px]" />
        </span>
      );
    }

    if (typeof value === "string" && value.startsWith("✔ ")) {
      return (
        <span className="inline-flex items-center gap-2 text-gray-700">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700">
            <GiCheckMark className="text-[10px]" />
          </span>
          {value.replace("✔ ", "")}
        </span>
      );
    }

    return <span className="text-gray-700">{value}</span>;
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
          Per-user billing designed for aggressive growth, with annual incentives and automatic volume discounts.
        </p>

        {/* TOGGLE */}
        <div className="flex justify-center items-center gap-3">
          <span className={!isAnnual ? "font-bold" : "opacity-60"}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            aria-label="Toggle billing cycle"
            aria-pressed={isAnnual}
            className={`w-12 h-6 rounded-full relative border transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/50 ${
              isAnnual ? "bg-accent border-accent" : "bg-white/20 border-white/40"
            }`}
          >
            <div
              className={`h-5 w-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm transition-transform duration-300 ease-in-out ${
                isAnnual ? "translate-x-6" : "translate-x-0"
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
              className={`rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                plan.highlight
                  ? "bg-secondary text-white border-accent scale-105"
                  : "bg-white border-gray-200"
              }`}
            >
              <p className="text-sm mb-1 opacity-80">{plan.badge}</p>
              <h3 className="text-xl font-bold mb-3">{plan.name}</h3>

              <p className="text-3xl font-bold mb-4 transition-all duration-300">
                {isAnnual ? plan.annual : plan.monthly}
                <span className="text-sm font-normal opacity-70 ml-1">
                  /user/mo
                </span>
              </p>
              <p className="text-xs opacity-70 mb-4">
                {isAnnual
                  ? "Billed annually (discounted effective rate)"
                  : "Billed monthly"}
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
                className={`block text-center py-2 rounded-lg font-semibold transition-all duration-200 ${
                  plan.highlight
                    ? "bg-accent text-secondary hover:opacity-90"
                    : "border border-accent text-accent hover:bg-accent/10"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-12">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Volume Discount</p>
            <p className="font-semibold text-secondary">10–19 users: 10% off total bill</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Volume Discount</p>
            <p className="font-semibold text-secondary">20+ users: 15% off total bill</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Migration Incentive</p>
            <p className="font-semibold text-secondary">₱4,999 credit + 1 extra month Pro on first upgrade</p>
          </div>
        </div>
      </section>

      <div className="w-full text-center pb-10 items-center flex justify-center">
        <button
          onClick={() => setShowComparison((prev) => !prev)}
          className="mt-6 px-5 py-2 rounded-lg text-tertiary/50 bg-white/5 hover:bg-white/10 cursor-pointer flex flex-row justify-center items-center gap-2 font-medium transition-all duration-200 hover:scale-[1.02]"
        >
          {showComparison ? "Hide full feature grid" : "Expand full feature grid"}
          <IoIosArrowDown
            className={`${showComparison ? "rotate-180" : "rotate-0"} transition-transform duration-300 ease-in-out`}
          />
        </button>
      </div>

      {/* EXPANDABLE FEATURE GRID */}
      <section
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          showComparison
            ? "max-h-[5000px] opacity-100 translate-y-0 pb-16"
            : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-secondary text-white border-b border-gray-200 text-center">
                <tr>
                  <th className="text-center px-4 py-3 font-semibold">Feature</th>
                  <th className="text-center px-4 py-3 font-semibold">Free</th>
                  <th className="text-center px-4 py-3 font-semibold">Starter</th>
                  <th className="text-center px-4 py-3 font-semibold">Pro</th>
                  <th className="text-center px-4 py-3 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonSections.map((section) => (
                  <React.Fragment key={section.title}>
                    <tr className="bg-gray-200 border-y border-gray-200">
                      <td colSpan={5} className="px-4 py-2 text-center font-bold text-secondary uppercase">
                        {section.title}
                      </td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr
                        key={`${section.title}-${row.feature}`}
                        className="border-b border-gray-100 last:border-b-0 text-center"
                      >
                        <td className="px-4 py-3 font-medium text-secondary text-left">{row.feature}</td>
                        <td className="px-4 py-3">{renderCell(row.Free)}</td>
                        <td className="px-4 py-3">{renderCell(row.Starter)}</td>
                        <td className="px-4 py-3">{renderCell(row.Pro)}</td>
                        <td className="px-4 py-3">{renderCell(row.Enterprise)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TRIAL SECTION */}
      <section className="py-16 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Try Pro — No credit card required
        </h2>
        <div className="max-w-xl mx-auto text-gray-700 space-y-2">
          <p>✔ Full Pro access for 14 days</p>
          <p>✔ No credit card required</p>
          <p>✔ Auto-downgrade to Free if no plan is selected after trial</p>
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