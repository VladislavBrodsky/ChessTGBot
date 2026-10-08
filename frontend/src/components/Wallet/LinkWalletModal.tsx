'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { apiFetch } from "@/lib/api";

interface LinkWalletModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialAddress: string;
  tw: any;
}

export default function LinkWalletModal({
  onClose,
  onSuccess,
  initialAddress,
  tw,
}: LinkWalletModalProps) {
  const [connectAddressInput, setConnectAddressInput] = useState<string>(initialAddress);
  const [processing, setProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Connect Wallet Submission
  const handleConnectSubmit = async () => {
    if (!connectAddressInput.trim()) {
      setErrorMessage(tw('invalid_address'));
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await apiFetch("/api/v1/wallet/connect", {
        method: "POST",
        body: JSON.stringify({ wallet_address: connectAddressInput })
      });

      if (res.ok) {
        setSuccessMessage(tw('link_success'));
        onSuccess();
        setTimeout(() => {
          onClose();
          setSuccessMessage("");
        }, 2000);
      } else {
        setErrorMessage(tw('link_failed'));
      }
    } catch {
      setErrorMessage(tw('link_network_error'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bottom-drawer-backdrop z-[100]">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => { if (!processing) onClose(); }}
        className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" style={{ touchAction: 'none' }}
      />

      {/* Content */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="bottom-drawer-sheet relative z-10"
      >
        <div className="bottom-drawer-handle" />
        <button aria-label="Close dialog" type="button"
          onClick={onClose}
          disabled={processing}
          className="ui-tap-target absolute top-4 right-4 text-brand-muted hover:text-brand-primary"
        >
          <FaTimes />
        </button>

        <div className="space-y-4">
          <h3 className="text-base font-semibold normal-case tracking-normal text-brand-primary ">{tw('connect_title')}</h3>
          <p className="text-caption font-bold text-brand-muted normal-case tracking-normal text-center">
            {tw('connect_desc')}
          </p>

          <div className="flex flex-col space-y-1">
            <label className="text-caption font-semibold text-brand-muted normal-case tracking-normal">{tw('ton_address')}</label>
            <input
              type="text"
              value={connectAddressInput}
              onChange={(e) => setConnectAddressInput(e.target.value)}
              className="cyber-input w-full p-2.5 rounded-lg border border-brand-border-opacity-20 bg-brand-bg-text-brand-muted text-[16px] font-bold focus:outline-none"
              placeholder={tw('ton_placeholder')}
            />
          </div>

          {successMessage && <div className="p-2.5 bg-brand-emerald-opacity-10 border border-brand-emerald-opacity-20 rounded-lg text-emerald-500 text-caption font-bold normal-case tracking-normal">{successMessage}</div>}
          {errorMessage && <div className="p-2.5 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-lg text-rose-400 text-caption font-bold normal-case tracking-normal">{errorMessage}</div>}

          <button type="button"
            onClick={handleConnectSubmit}
            disabled={processing}
            className="ui-tap-target w-full py-2.5 rounded-xl border border-brand-border-opacity-20 bg-brand-primary text-brand-void text-sm font-semibold normal-case tracking-normal hover:bg-brand-primary-hover transition-all"
          >
            {processing ? tw('linking_address') : tw('verify_link')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
