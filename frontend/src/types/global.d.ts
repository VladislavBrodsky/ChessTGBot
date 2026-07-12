export { };

declare global {
    interface Window {
        Telegram?: {
            WebApp: {
                platform?: string;
                initData?: string;
                onEvent?: (eventType: string, eventHandler: Function) => void;
                offEvent?: (eventType: string, eventHandler: Function) => void;
                openLink?: (url: string) => void;
                ready: () => void;
                expand: () => void;
                requestFullscreen?: () => void;
                exitFullscreen?: () => void;
                isVersionAtLeast?: (version: string) => boolean;
                close: () => void;
                enableClosingConfirmation: () => void;
                disableClosingConfirmation: () => void;
                setHeaderColor: (color: string) => void;
                setBackgroundColor: (color: string) => void;
                initDataUnsafe?: {
                    user?: {
                        id: number;
                        first_name: string;
                        last_name?: string;
                        username?: string;
                        photo_url?: string;
                    };
                    start_param?: string;
                };
                themeParams?: {
                    bg_color?: string;
                    text_color?: string;
                    button_color?: string;
                    button_text_color?: string;
                };
                switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
                openTelegramLink: (url: string) => void;
                showAlert?: (message: string, callback?: () => void) => void;
                showConfirm?: (message: string, callback: (ok: boolean) => void) => void;
                HapticFeedback?: {
                    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
                    notificationOccurred?: (type: 'success' | 'warning' | 'error') => void;
                };
                BackButton: {
                    show: () => void;
                    hide: () => void;
                    onClick: (cb: () => void) => void;
                    offClick: (cb: () => void) => void;
                };
            }
        }
    }
}
