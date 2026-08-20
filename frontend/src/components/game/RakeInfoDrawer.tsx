'use client';

import React from "react";
import { useTranslations } from "next-intl";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";

interface RakeInfoDrawerProps {
  onClose: () => void;
}

export default function RakeInfoDrawer({ onClose }: RakeInfoDrawerProps) {
  const tg = useTranslations('Game');

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={tg('platform_commission')}
      description={tg('sustain_ecosystem')}
    >
      <div className="w-full bg-brand-elevated rounded-2xl p-5 border border-brand-border space-y-3 text-xs font-medium text-brand-muted leading-relaxed">
        <p>{tg('rake_desc1')}</p>
        <p>{tg('rake_desc2')}</p>
        <div className="h-px w-full bg-brand-border my-2" />
        <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
          {tg('where_rake_goes')}
        </p>
        <ul className="list-disc pl-4 space-y-1.5 text-xs text-brand-muted">
          <li>{tg('rake_li1')}</li>
          <li>{tg('rake_li2')}</li>
          <li>{tg('rake_li3')}</li>
        </ul>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onClose}
        className="w-full uppercase font-black tracking-wider"
      >
        {tg('got_it')}
      </Button>
    </Drawer>
  );
}
