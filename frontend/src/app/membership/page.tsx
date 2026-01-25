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
        <LayoutWrapper className="pb-32 pt-6">
            <div className="w-full max-w-sm flex flex-col items-center mx-auto space-y-8 px-4">
                {/* Header / Brand */}
                <div className="flex flex-col items-center w-full">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white text-3xl font-black italic tracking-tighter select-none"
                    >
                        CHESS PREMIUM+
                    </motion.div>
                    <div className="h-px w-10 bg-white/20 my-2" />
                    <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/30">Premium Access Matrix</span>
                </div>

                {/* Tier Selector */}
                <div className="w-full glass-panel p-1 rounded-2xl flex border-white/5 bg-white/5">
                    {TIERS.map((tier) => (
                        <button
                            key={tier.id}
                            onClick={() => setSelectedTier(tier)}
                            className={`flex-1 py-3 text-[9px] font-black rounded-xl transition-all duration-300 uppercase tracking-widest ${selectedTier.id === tier.id
                                ? "bg-white text-black shadow-premium"
                                : "text-white/40 hover:text-white/60"
                                }`}
                        >
                            {tier.name}
                        </button>
                    ))}
                </div>

                {/* Feature Container */}
                <div className="w-full glass-panel rounded-3xl p-6 border-white/5 bg-linear-to-b from-white/5 to-transparent shadow-premium">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedTier.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {selectedTier.features.map((feature, idx) => (
                                <div key={idx} className="flex items-start space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 shrink-0">
                                        <span className="text-lg">{feature.icon}</span>
                                    </div>
                                    <div className="flex flex-col pt-0.5">
                                        <span className="text-sm font-black text-white uppercase tracking-tight leading-none mb-1">{feature.title}</span>
                                        <span className="text-[10px] font-medium text-white/30 tracking-tight leading-snug">{feature.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Pricing Options */}
                <div className="w-full grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={`p-5 rounded-2xl text-left transition-all border flex flex-col justify-between h-32 relative group overflow-hidden ${billingPeriod === 'monthly'
                            ? "bg-white border-white text-black"
                            : "bg-white/1 border-white/5 text-white/40 hover:bg-white/3"
                            }`}
                    >
                        <span className={`text-[9px] font-black uppercase tracking-widest ${billingPeriod === 'monthly' ? "text-black/60" : "text-white/20"}`}>Monthly</span>
                        <div>
                            <span className="text-3xl font-black italic tracking-tighter leading-none">${selectedTier.monthly}</span>
                            <span className={`text-[10px] font-bold block mt-1 ${billingPeriod === 'monthly' ? "text-black/40" : "text-white/20"}`}>PER QUARTER</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setBillingPeriod('annual')}
                        className={`p-5 rounded-2xl text-left transition-all border flex flex-col justify-between h-32 relative group overflow-hidden ${billingPeriod === 'annual'
                            ? "bg-white border-white text-black"
                            : "bg-white/1 border-white/5 text-white/40 hover:bg-white/3"
                            }`}
                    >
                        <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-lg text-[8px] font-black uppercase tracking-tighter ${billingPeriod === 'annual' ? "bg-black text-white" : "bg-white/10 text-white/40"}`}>
                            -16% OFF
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${billingPeriod === 'annual' ? "text-black/60" : "text-white/20"}`}>Annual</span>
                        <div className="flex flex-col">
                            <div>
                                <span className="text-3xl font-black italic tracking-tighter leading-none">${selectedTier.annual}</span>
                                <span className={`text-[10px] font-bold block mt-1 ${billingPeriod === 'annual' ? "text-black/40" : "text-white/20"}`}>PER ANNUM</span>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Confirm Action */}
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubscribe}
                    className="w-full py-6 action-button flex items-center justify-center shadow-premium"
                >
                    <span className="text-base font-black italic tracking-[0.2em]">INITIALIZE SYNC</span>
                </motion.button>

                {/* Footer Legal */}
                <p className="w-full text-[8px] text-white/10 text-center leading-[1.6] font-bold uppercase tracking-widest px-4">
                    Subscriptions auto-renew until cancelled. Neural access is subject to decentralized core protocols.
                </p>
            </div>
        </LayoutWrapper>
    );
}
