'use client';

import { useEffect } from 'react';

export default function TelegramInit() {
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp as any;

            // Notify Telegram that the Mini App is ready to be displayed
            tg.ready();

            // Expand the Mini App to the maximum available height
            tg.expand();

            // Request fullscreen mode if supported (Telegram Bot API 8.0+)
            try {
                if (tg.isVersionAtLeast && tg.isVersionAtLeast('8.0') && tg.requestFullscreen) {
                    tg.requestFullscreen();
                    console.log('Telegram WebApp Fullscreen requested');
                }
            } catch (e) {
                console.warn('Failed to request fullscreen', e);
            }

            // Configure the Mini App header color to match the app theme
            try {
                tg.setHeaderColor('#000000'); // Matches bg-primary
                tg.setBackgroundColor('#000000');
            } catch (e) {
                console.warn('Failed to set header color', e);
            }

            // Disable vertical swipes to prevent accidental closing on swipe down (Telegram Bot API 7.7+)
            try {
                if (tg.disableVerticalSwipes) {
                    tg.disableVerticalSwipes();
                    console.log('Telegram WebApp vertical swipes disabled');
                }
            } catch (e) {
                console.warn('Failed to disable vertical swipes', e);
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
