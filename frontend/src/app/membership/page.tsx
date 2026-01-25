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
            <div className="w-full max-w-md flex flex-col items-center bg-[#000000] min-h-screen pb-16 font-sans selection:bg-white selection:text-black">
                {/* Header */}
                <div className="w-full flex items-center justify-between p-4 mb-2">
                    <Link href="/">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            className="text-white hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </Link>
                </div>

                {/* Metallic X Logo */}
                <div className="mb-6 relative pointer-events-none">
                    <div className="text-[100px] font-black italic tracking-tighter metallic-text leading-none" style={{ fontFamily: 'system-ui' }}>
                        X
                    </div>
                </div>

                <h1 className="text-3xl font-black text-white mb-8 text-center px-4 tracking-tight">
                    Subscribe to Premium
                </h1>

                {/* Tier Selector Tabs */}
                <div className="w-[90%] bg-[#121212] p-1.5 rounded-[20px] flex mb-8 border border-white/5">
                    {TIERS.map((tier) => (
                        <button
                            key={tier.id}
                            onClick={() => setSelectedTier(tier)}
                            className={`flex-1 py-3 text-[14px] font-black rounded-[15px] transition-all duration-200 uppercase tracking-tight ${selectedTier.id === tier.id
                                ? "bg-[#212121] text-white shadow-lg"
                                : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            {tier.name}
                        </button>
                    ))}
                </div>

                {/* Feature Container */}
                <div className="w-[90%] bg-[#121212] rounded-[32px] p-7 mb-8 border border-white/5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedTier.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-7"
                        >
                            {selectedTier.features.map((feature, idx) => (
                                <div key={idx} className="flex items-start space-x-5">
                                    <div className="w-11 h-11 rounded-xl bg-[#212121] flex items-center justify-center text-white shrink-0 shadow-inner">
                                        <span className="text-xl opacity-90">{feature.icon}</span>
                                    </div>
                                    <div className="flex flex-col pt-0.5">
                                        <span className="text-[17px] font-black text-white leading-tight">{feature.title}</span>
                                        <span className="text-[14px] font-medium text-gray-500 leading-snug mt-1">{feature.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Pricing Selection Horizontal Grid */}
                <div className="w-[90%] grid grid-cols-2 gap-4 mb-10">
                    <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={`p-5 rounded-[24px] text-left transition-all border-[3px] flex flex-col justify-between h-32 ${billingPeriod === 'monthly'
                            ? "bg-[#121212] border-white"
                            : "bg-transparent border-white/10 opacity-40 hover:opacity-60"
                            }`}
                    >
                        <span className="text-[15px] font-black text-gray-300">Monthly</span>
                        <div>
                            <span className="text-[28px] font-black text-white leading-none">${selectedTier.monthly}</span>
                            <span className="text-[14px] font-bold text-gray-500 ml-1">/ month</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setBillingPeriod('annual')}
                        className={`p-5 rounded-[24px] text-left transition-all border-[3px] flex flex-col justify-between h-32 relative ${billingPeriod === 'annual'
                            ? "bg-[#121212] border-white"
                            : "bg-transparent border-white/10 opacity-40 hover:opacity-60"
                            }`}
                    >
                        <div className="absolute top-4 right-4 bg-[#1b3a27] text-[#4edb8a] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">
                            SAVE 16%
                        </div>
                        <span className="text-[15px] font-black text-gray-300">Annual</span>
                        <div className="flex flex-col">
                            <div>
                                <span className="text-[28px] font-black text-white leading-none">${selectedTier.annual}</span>
                                <span className="text-[14px] font-bold text-gray-500 ml-1">/ year</span>
                            </div>
                            <span className="text-[11px] font-bold text-gray-600 mt-0.5">${(selectedTier.annual / 12).toFixed(2)} / month</span>
                        </div>
                    </button>
                </div>

                {/* Giant CTA Button */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubscribe}
                    className="w-[90%] py-6 rounded-full font-black text-black text-xl uppercase tracking-tighter bg-gradient-to-b from-white via-gray-200 to-gray-400 shadow-2xl hover:brightness-110 active:brightness-90 transition-all font-sans"
                >
                    Subscribe & pay
                </motion.button>

                {/* Footer Disclaimer */}
                <p className="w-[90%] text-[10px] text-gray-600 text-left leading-[1.4] font-bold mt-10 px-2 italic uppercase tracking-tighter">
                    By subscribing, you agree to our <span className="text-gray-400 underline">Purchaser Terms</span>, and that subscriptions auto-renew until you cancel. <span className="text-gray-400 underline">Cancel anytime</span>. Price subject to change. <span className="text-gray-400 underline">Manage subscription</span>.
                </p>
            </div>
        </LayoutWrapper>
    );
}
