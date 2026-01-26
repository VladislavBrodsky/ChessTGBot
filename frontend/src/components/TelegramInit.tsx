'use client';

import { useEffect } from 'react';

export default function TelegramInit() {
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;

            // Notify Telegram that the Mini App is ready to be displayed
            tg.ready();

            // Expand the Mini App to the maximum available height
            tg.expand();

            // Configure the Mini App header color to match the app theme
            try {
                tg.setHeaderColor('#000000'); // Matches bg-primary
                tg.setBackgroundColor('#000000');
            } catch (e) {
                console.warn('Failed to set header color', e);
            }

            // Enable closing confirmation to prevent accidental exits (optional but good for games)
            try {
                tg.enableClosingConfirmation();
            } catch (e) {
                console.warn('Failed to enable closing confirmation', e);
            }

            console.log('Telegram WebApp Initialized: Expanded & Ready');
        }
    }, []);

    return null;
}
