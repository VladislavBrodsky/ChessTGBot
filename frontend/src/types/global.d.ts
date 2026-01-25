export { };

declare global {
    interface Window {
        Telegram?: {
            WebApp: {
                ready: () => void;
                expand: () => void;
                initDataUnsafe?: {
                    user?: any;
                    start_param?: string;
                };
                themeParams?: {
                    bg_color?: string;
                    text_color?: string;
                    button_color?: string;
                    button_text_color?: string;
                };
                switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
            }
        }
    }
}
