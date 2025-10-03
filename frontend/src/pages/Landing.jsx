// Landing.jsx
import React from "react";
import Header from "../components/Header";

// Import icons from react-icons
import { LuZap, LuGauge, LuUsers, LuMessageCircle } from "react-icons/lu";

// --- Hero Section ---
const HeroSection = () => (
    <section className="bg-paper-white text-white py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="lg:text-left text-center">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-lg text-secondary mb-6 leading-tight">
                   Sari-Sari <span className="text-accent font-extrabold">Sari-Sari.</span> 
                </h1>
                <p className="max-w-xl mx-auto lg:mx-0 text-lg sm:text-xl text-secondary mb-10 italic">
                    Crm Daw ng Sari-Sari
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                    <a href="#" className="px-10 py-3 rounded-lg border border-secondary text-white bg-secondary font-semibold hover:bg-accent hover:text-secondary hover:border-accent transition-all duration-500">
                        Get Started Now
                    </a>
                    <a href="#" className="px-10 py-3 rounded-lg border border-secondary text-white bg-secondary hover:bg-accent hover:text-secondary hover:border-accent transition-all duration-500">
                        Watch Demo (2 min)
                    </a>
                </div>
            </div>
            {/* Right */}
            <div className="relative">
                <div className="hidden lg:block absolute inset-0 -top-10 -bottom-10 right-10 bg-accent rounded-3xl transform rotate-3 z-0"></div>
                <img
                    src="https://placehold.co/800x500/1e293b/a3e635?text=AuraCRM+AI+Dashboard"
                    alt="AuraCRM Dashboard Mockup"
                    className="rounded-xl shadow-2xl border-4 border-gray-800 relative z-10"
                />
            </div>
        </div>
    </section>
);

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
        { Icon: LuZap, title: "Automated Workflows", description: "Automate tasks and focus on engagement." },
        { Icon: LuGauge, title: "Predictive Analytics", description: "Harness AI to forecast sales and risks." },
        { Icon: LuUsers, title: "Unified Customer View", description: "360-degree profile for every customer." },
        { Icon: LuMessageCircle, title: "Multi-Channel Support", description: "Engage across email, chat, and more." },
    ];
    return (
        <section id="platform" className="py-20 bg-gray-900 border-t border-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Engineered for Enterprise Scale</h2>
                <p className="text-xl text-gray-400 mb-16">Pillows is the neural network powering your customer relationships.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((f, i) => <FeatureCard key={i} {...f} />)}
                </div>
            </div>
        </section>
    );
};


// --- CTA Section ---
const CTASection = () => (
    <section id="pricing" className="py-20 bg-paper-white border-t border-gray-800 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-secondary mb-4">Start Building Your Future, Today.</h2>
        <p className="text-xl text-gray-400 mb-10">Join thousands leveraging AuraCRM's intelligent platform.</p>
        <a
            href="#"
            className="px-12 py-4 text-lg font-bold rounded-xl shadow-2xl bg-accent border border-secondary text-white bg-secondary hover:bg-accent hover:text-secondary hover:border-accent transition-all duration-400"
        >
            Start 30-Day Free Trial
        </a>
    </section>
);

// --- Footer ---
const Footer = () => (
    <footer className="bg-secondary text-white border-t py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
            <div>
                <span className="text-xl font-white">Tan<span className="text-accent">CRM</span></span>
                <p className="text-sm text-white mt-4">&copy; 2024 TanCRM, Inc.</p>
            </div>
            {[
                { title: "Platform", links: ["AI Features", "Automation", "Integrations", "APIs"] },
                { title: "Resources", links: ["Case Studies", "Webinars", "Security", "Support"] },
                { title: "Company", links: ["Leadership", "Partnerships", "Careers", "Newsroom"] },
                { title: "Legal", links: ["Terms", "Privacy", "SLA", "Compliance"] },
            ].map((col, i) => (
                <div key={i}>
                    <h5 className="text-md font-semibold mb-4 text-accent">{col.title}</h5>
                    <ul className="space-y-2 text-sm text-white">
                        {col.links.map((link, j) => (
                            <li key={j}>
                                <a href="#" className="hover:text-accent">{link}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    </footer>
);

// --- Landing Page Wrapper ---
const Landing = () => (
   <main className="font-inter">
      <Header />
        <HeroSection />
        <FeaturesSection />
        <CTASection />
        <Footer />
    </main>
);

export default Landing;
