import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import { LuZap, LuGauge, LuUsers, LuMessageCircle } from "react-icons/lu";

// --- Hero Section ---
const HeroSection = () => {
  const images = [
    "/image/Dashboard1.png",
    "/image/lead1.png",
    "/image/dashboard.jpg",
  ];

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  // Swipe states
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Auto-slide interval
  useEffect(() => {
    if (!paused) {
      intervalRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % images.length);
      }, 4000);
    }
    return () => clearInterval(intervalRef.current);
  }, [paused, images.length]);

  // Swipe handling
  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left → next
      setCurrent((prev) => (prev + 1) % images.length);
    }
    if (touchEnd - touchStart > 75) {
      // Swipe right → previous
      setCurrent((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <section className="bg-paper-white text-white py-15 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div className="lg:text-left text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-lg text-secondary mb-6 leading-tight">
            Sari-Sari{" "}
            <span className="text-accent font-extrabold">CRM</span>
          </h1>
          <p className="max-w-xl mx-auto lg:mx-0 text-lg sm:text-xl text-secondary mb-10 italic">
            The CRM that keeps your customers organized and your sales growing.
          </p>
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
            <a
              href="#"
              className="px-10 py-3 rounded-lg border border-secondary text-white bg-secondary font-semibold hover:bg-accent hover:text-secondary hover:border-accent transition-all duration-500"
            >
              Get Started Now
            </a>
            <a
              href="#"
              className="px-10 py-3 rounded-lg border border-secondary text-white bg-secondary hover:bg-accent hover:text-secondary hover:border-accent transition-all duration-500"
            >
              Watch Demo (2 min)
            </a>
          </div>
        </div>

        {/* Right */}
        <div className="relative">
          {/* Background Accent Shape */}
          <div className="hidden lg:block absolute inset-0 -top-10 -bottom-10 right-4 bg-accent rounded-3xl transform rotate-3 z-0"></div>

          {/* Carousel */}
         <div
  className="relative z-10 overflow-hidden rounded-xl shadow-2xl border-4 border-gray-800 h-[400px] bg-gray-900 flex items-center justify-center"
  onMouseEnter={() => setPaused(true)}
  onMouseLeave={() => setPaused(false)}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  {images.map((src, i) => (
    <img
      key={i}
      src={src}
      alt={`Slide ${i + 1}`}
      className={`absolute inset-0 w-full h-full object-contain bg-gray-50 transition-opacity duration-1000 ease-in-out ${
        i === current ? "opacity-100" : "opacity-0"
      }`}
    />
  ))}

  {/* Dots Indicator */}
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
    {images.map((_, i) => (
      <button
        key={i}
        onClick={() => setCurrent(i)}
        className={`w-3 h-3 rounded-full transition-all ${
          i === current ? "bg-accent" : "bg-gray-400 opacity-50"
        }`}
      />
    ))}
  </div>
</div>
        </div>
      </div>
    </section>
  );
};

// --- Feature Card ---
const FeatureCard = ({ Icon, title, description }) => (
  <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-accent transition transform hover:-translate-y-1">
    <div className="w-14 h-14 flex items-center justify-center rounded-full text-accent mb-6">
      <Icon className="w-8 h-8" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

// --- Features Section ---
const FeaturesSection = () => {
  const features = [
    {
      Icon: LuZap,
      title: "Automated Workflows",
      description: "Automate tasks and focus on engagement.",
    },
    {
      Icon: LuGauge,
      title: "Predictive Analytics",
      description: "Harness AI to forecast sales and risks.",
    },
    {
      Icon: LuUsers,
      title: "Unified Customer View",
      description: "360-degree profile for every customer.",
    },
    {
      Icon: LuMessageCircle,
      title: "Multi-Channel Support",
      description: "Engage across email, chat, and more.",
    },
  ];
  return (
    <section
      id="platform"
      className="py-20 bg-gray-900 border-t border-gray-800"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Engineered for Enterprise Scale
        </h2>
        <p className="text-xl text-gray-400 mb-16">
          Pillows is the neural network powering your customer relationships.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
};

// --- CTA Section ---
const CTASection = () => (
  <section
    id="pricing"
    className="py-20 bg-paper-white border-t border-gray-800 text-center"
  >
    <h2 className="text-4xl sm:text-5xl font-bold text-secondary mb-4">
      Start Building Your Future, Today.
    </h2>
    <p className="text-xl text-gray-400 mb-10">
      Join thousands leveraging Sari-Sari CRM's intelligent platform.
    </p>
    <a
      href="/signup"
      className="px-12 py-4 text-lg font-bold rounded-xl shadow-2xl bg-accent border border-secondary text-white bg-secondary hover:bg-accent hover:text-secondary hover:border-accent transition-all duration-400"
    >
      Start 15-Day Free Trial
    </a>
  </section>
);

// --- Footer ---
const Footer = () => (
  <footer className="bg-secondary text-white border-t py-10">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
      <div>
        <span className="text-xl font-white">Sari-Sari <span className="text-accent">CRM</span></span>        
        <p className="text-sm text-white mt-4">
          &copy; 2025 Sari-Sari CRM
        </p>
      </div>
      {[
        {
          title: "Platform",
          links: ["AI Features", "Automation", "Integrations", "APIs"],
        },
        {
          title: "Resources",
          links: ["Case Studies", "Webinars", "Security", "Support"],
        },
        {
          title: "Company",
          links: ["Leadership", "Partnerships", "Careers", "Newsroom"],
        },
        {
          title: "Legal",
          links: ["Terms", "Privacy", "SLA", "Compliance"],
        },
      ].map((col, i) => (
        <div key={i}>
          <h5 className="text-md font-semibold mb-4 text-accent">
            {col.title}
          </h5>
          <ul className="space-y-2 text-sm text-white">
            {col.links.map((link, j) => (
              <li key={j}>
                <a href="#" className="hover:text-accent">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </footer>
);

// --- Landing Page Wrapper ---
const Landing = () => {
  useEffect(() => {
    document.title = "Sari-Sari CRM";
  }, []);
  return (
    <main className="font-inter">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Landing;
