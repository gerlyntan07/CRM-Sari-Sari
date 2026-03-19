import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GiCheckMark } from "react-icons/gi";

const plans = [
  {
    name: "Free",
    monthly: "₱0",
    annual: "₱0",
    badge: "For individuals",
    features: [
      "Up to 2 team members",
      "Up to 5 active deals",
      "View-only quotes",
      "No CSV export",
    ],
    highlight: false,
  },
  {
    name: "Starter",
    monthly: "₱299",
    annual: "₱2,990",
    badge: "For small teams",
    features: [
      "Up to 10 team members",
      "Unlimited deals",
      "1 CSV export / month",
      "5 quotes / month",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    monthly: "₱599",
    annual: "₱5,990",
    badge: "Most popular",
    features: [
      "Unlimited users",
      "Unlimited deals",
      "Unlimited CSV exports",
      "Unlimited quotes",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    monthly: "₱999",
    annual: "₱8,991",
    badge: "For scaling businesses",
    features: [
      "Custom territory management",
      "Advanced team view",
      "Full accounting features",
    ],
    highlight: false,
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
          Start free. Upgrade when your business grows.
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