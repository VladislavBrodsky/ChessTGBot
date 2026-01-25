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
            <div className="w-full max-w-md flex flex-col items-center bg-[#000000] min-h-screen pb-20 font-sans selection:bg-white selection:text-black">
                {/* Header */}
                <div className="w-full flex items-center justify-between p-4 -mb-4">
                    <Link href="/">
                        <motion.button
                            whileHover={{ x: -2 }}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </Link>
                </div>

                {/* X Metallic Logo */}
                <div className="mb-4 mt-2 relative select-none">
                    <div className="text-8xl font-black italic tracking-tighter metallic-text" style={{ fontFamily: 'system-ui' }}>
                        X
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-white mb-8 text-center px-4">
                    Subscribe to Premium
                </h1>

                {/* Tier Selector Pills */}
                <div className="w-[90%] bg-[#121212] p-1 rounded-2xl flex mb-8 border border-white/5">
                    {TIERS.map((tier) => (
                        <button
                            key={tier.id}
                            onClick={() => setSelectedTier(tier)}
                            className={`flex-1 py-3 px-2 text-[15px] font-bold rounded-xl transition-all duration-300 ${selectedTier.id === tier.id
                                ? "bg-[#212121] text-white"
                                : "text-white/40 hover:text-white/60"
                                }`}
                        >
                            {tier.name}
                        </button>
                    ))}
                </div>

                {/* Features List */}
                <div className="w-[90%] bg-[#121212] rounded-3xl p-6 mb-8 border border-white/5 shadow-2xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedTier.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {selectedTier.features.map((feature, idx) => (
                                <div key={idx} className="flex items-start space-x-4">
                                    <div className="w-10 h-10 rounded-lg bg-[#212121] flex items-center justify-center text-white shrink-0 border border-white/5">
                                        <span className="text-lg opacity-80">{feature.icon}</span>
                                    </div>
                                    <div className="flex flex-col pt-0.5">
                                        <span className="text-white font-bold text-[16px] leading-tight">{feature.title}</span>
                                        <span className="text-white/40 text-[14px] leading-tight mt-1">{feature.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Pricing Selection */}
                <div className="w-[90%] grid grid-cols-1 gap-3 mb-8">
                    <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={`p-5 rounded-2xl text-left transition-all border-2 relative overflow-hidden ${billingPeriod === 'monthly'
                            ? "bg-[#121212] border-white shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                            : "bg-transparent border-white/10 opacity-60"
                            }`}
                    >
                        <div className="text-[14px] text-white/80 font-bold mb-1">Monthly</div>
                        <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-black text-white">${selectedTier.monthly}</span>
                            <span className="text-[14px] text-white/40 font-bold">/ month</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setBillingPeriod('annual')}
                        className={`p-5 rounded-2xl text-left transition-all border-2 relative overflow-hidden ${billingPeriod === 'annual'
                            ? "bg-[#121212] border-white shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                            : "bg-transparent border-white/10 opacity-60"
                            }`}
                    >
                        <div className="absolute top-4 right-4 bg-[#1b3a27] text-[#4edb8a] text-[11px] font-black px-2.5 py-1 rounded-full">
                            SAVE 16%
                        </div>
                        <div className="text-[14px] text-white/80 font-bold mb-1">Annual</div>
                        <div className="flex flex-col">
                            <div className="flex items-baseline space-x-1">
                                <span className="text-2xl font-black text-white">${selectedTier.annual}</span>
                                <span className="text-[14px] text-white/40 font-bold">/ year</span>
                            </div>
                            <span className="text-[12px] text-white/40 font-bold mt-1">${(selectedTier.annual / 12).toFixed(2)} / month</span>
                        </div>
                    </button>
                </div>

                {/* CTA Button */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubscribe}
                    className="w-[90%] py-4.5 rounded-full font-black text-black text-lg bg-gradient-to-b from-[#ffffff] to-[#cccccc] shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:to-[#999999] transition-all"
                >
                    Subscribe & pay
                </motion.button>

                {/* Footer Disclaimer */}
                <p className="w-[90%] text-[11px] text-white/40 text-left leading-[1.3] font-medium mt-10 px-2">
                    By subscribing, you agree to our <span className="text-white/80 hover:underline cursor-pointer">Purchaser Terms</span>, and that subscriptions auto-renew until you cancel. <span className="text-white/80 hover:underline cursor-pointer">Cancel anytime</span>, at least 24 hours prior to renewal to avoid additional charges. Price subject to change. <span className="text-white/80 hover:underline cursor-pointer">Manage your subscription</span> through the platform you subscribed on.
                </p>
            </div>
        </LayoutWrapper>
    );
}
