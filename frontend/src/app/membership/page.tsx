'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import { FaCheck, FaRocket, FaFolder, FaDownload, FaEdit, FaChevronLeft } from "react-icons/fa";
import Link from "next/link";

const TIERS = [
    {
        id: 'basic',
        name: 'Basic',
        features: [
            { icon: <FaRocket />, title: 'Enhanced experience', desc: 'Edit and write longer posts.' },
            { icon: <FaFolder />, title: 'Bookmark folders', desc: 'Organize your saved posts.' },
            { icon: <FaDownload />, title: 'Download videos', desc: 'Watch offline anywhere.' },
            { icon: <FaEdit />, title: 'Customization', desc: 'App icons and themes.' },
        ],
        monthly: 50,
        annual: 500,
    },
    {
        id: 'premium',
        name: 'Premium',
        features: [
            { icon: <FaRocket />, title: 'Premium Experience', desc: 'Everything in Basic plus more.' },
            { icon: <FaCheck />, title: 'Verified Badge', desc: 'Get the blue checkmark.' },
            { icon: <FaDownload />, title: 'HD Downloads', desc: 'Download in highest quality.' },
            { icon: <FaEdit />, title: 'Advanced Themes', desc: 'Exclusive UI customization.' },
        ],
        monthly: 120,
        annual: 1200,
    },
    {
        id: 'premium_plus',
        name: 'Premium+',
        features: [
            { icon: <FaRocket />, title: 'Ultimate experience', desc: 'No ads and priority support.' },
            { icon: <FaFolder />, title: 'Unlimited folders', desc: 'Maximum organization.' },
            { icon: <FaDownload />, title: 'Background play', desc: 'Listen while using other apps.' },
            { icon: <FaEdit />, title: 'Creator Tools', desc: 'Full access to analytics.' },
        ],
        monthly: 200,
        annual: 2000,
    }
];

export default function MembershipPage() {
    const [selectedTier, setSelectedTier] = useState(TIERS[0]);
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
    const [tgUser, setTgUser] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            setTgUser(window.Telegram.WebApp.initDataUnsafe?.user);
        }
    }, []);

    const handleSubscribe = async () => {
        if (!tgUser?.id) {
            alert("Telegram User not found. Are you in the Mini App?");
            return;
        }

        try {
            const res = await fetch("/api/v1/users/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    telegram_id: tgUser.id,
                    tier: selectedTier.id
                })
            });
            const data = await res.json();
            if (data.status === "success") {
                alert(`Successfully subscribed to ${selectedTier.name}!`);
            }
        } catch (e) {
            console.error("Subscription failed", e);
        }
    };

    return (
        <LayoutWrapper>
            <div className="w-full max-w-md flex flex-col items-center bg-black min-h-screen pb-20">
                {/* Header */}
                <div className="w-full flex items-center justify-between p-4 mb-2">
                    <Link href="/">
                        <motion.button
                            whileHover={{ x: -2 }}
                            className="text-white opacity-60 hover:opacity-100 transition-all"
                        >
                            <FaChevronLeft className="text-xl" />
                        </motion.button>
                    </Link>
                </div>

                {/* X Logo / Icon */}
                <div className="mb-6 relative">
                    <div className="text-7xl text-white font-black tracking-tighter transform -skew-x-12 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">X</div>
                    {/* Subtle glow behind logo */}
                    <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-150 -z-10" />
                </div>

                <h1 className="text-3xl font-black tracking-tight text-white mb-10 text-center uppercase italic px-4">
                    Upgrade to <span className="text-nebula-cyan">Premium</span>
                </h1>

                {/* Tier Selector Tabs */}
                <div className="w-[92%] bg-white/5 p-1 rounded-full flex mb-10 overflow-hidden border border-white/5 shadow-inner backdrop-blur-md">
                    {TIERS.map((tier) => (
                        <button
                            key={tier.id}
                            onClick={() => setSelectedTier(tier)}
                            className={`flex-1 py-3.5 px-2 text-xs font-black tracking-widest rounded-full transition-all duration-500 uppercase ${selectedTier.id === tier.id
                                ? "bg-white text-black shadow-lg scale-100"
                                : "text-white/40 hover:text-white/70 scale-95"
                                }`}
                        >
                            {tier.name}
                        </button>
                    ))}
                </div>

                {/* Features List */}
                <div className="w-[92%] glass-panel rounded-[2.5rem] p-8 mb-10 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden border-white/10 shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-nebula-purple/20 blur-3xl rounded-full -z-10" />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedTier.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="space-y-8"
                        >
                            {selectedTier.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center space-x-6 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-nebula-cyan shrink-0 border border-white/10 group-hover:bg-nebula-cyan/20 group-hover:border-nebula-cyan/50 transition-all duration-300 transform group-hover:rotate-6">
                                        <span className="text-2xl drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">{feature.icon}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-black tracking-tight text-lg group-hover:text-nebula-cyan transition-colors">{feature.title}</span>
                                        <span className="text-white/40 text-sm font-medium">{feature.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Pricing Grid */}
                <div className="w-[95%] grid grid-cols-2 gap-3 mb-10">
                    <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={`p-4 rounded-2xl text-left transition-all border-2 ${billingPeriod === 'monthly'
                            ? "bg-[#16181c] border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                            : "bg-transparent border-[#2f3336] opacity-50"
                            }`}
                    >
                        <div className="text-xs text-gray-400 mb-1">Monthly</div>
                        <div className="flex items-baseline space-x-1">
                            <span className="text-xl font-bold text-white">${selectedTier.monthly}</span>
                            <span className="text-xs text-gray-500">/ month</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setBillingPeriod('annual')}
                        className={`p-4 rounded-2xl text-left transition-all border-2 relative ${billingPeriod === 'annual'
                            ? "bg-[#16181c] border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                            : "bg-transparent border-[#2f3336] opacity-50"
                            }`}
                    >
                        <div className="absolute -top-3 right-3 bg-green-900/50 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/30">
                            SAVE 16%
                        </div>
                        <div className="text-xs text-gray-400 mb-1">Annual</div>
                        <div className="flex flex-col">
                            <div className="flex items-baseline space-x-1">
                                <span className="text-xl font-bold text-white">${selectedTier.annual}</span>
                                <span className="text-xs text-gray-500">/ year</span>
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1">${(selectedTier.annual / 12).toFixed(2)} / month</span>
                        </div>
                    </button>
                </div>

                {/* Subscribe Button */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(255,255,255,0.3)" }}
                    onClick={handleSubscribe}
                    className="w-[90%] py-5 rounded-full font-black text-black text-xl shadow-2xl mb-8 bg-white hover:bg-gray-100 transition-all uppercase tracking-widest italic"
                >
                    Subscribe & pay
                </motion.button>

                <p className="w-[85%] text-[9px] text-white/30 text-center leading-relaxed font-medium px-4">
                    By subscribing, you agree to our <span className="text-white/60 underline underline-offset-2">Purchaser Terms</span>, and that subscriptions auto-renew until you cancel. <span className="text-white/60 underline underline-offset-2">Cancel anytime</span>, at least 24 hours prior to renewal to avoid additional charges. Price subject to change. <span className="text-white/60 underline underline-offset-2">Manage your subscription</span> through the platform you subscribed on.
                </p>
            </div>
        </LayoutWrapper>
    );
}
