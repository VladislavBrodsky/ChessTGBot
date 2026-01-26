export { };

declare global {
    interface Window {
        Telegram?: {
            WebApp: {
                ready: () => void;
                expand: () => void;
                close: () => void;
                enableClosingConfirmation: () => void;
                disableClosingConfirmation: () => void;
                setHeaderColor: (color: string) => void;
                setBackgroundColor: (color: string) => void;
                initData: string;
                initDataUnsafe?: {
                    user?: {
                        id: number;
                        first_name: string;
                        last_name?: string;
                        username?: string;
                        language_code?: string;
                        photo_url?: string;
                    };
                    start_param?: string;
                    auth_date: number;
                    hash: string;
                };
                themeParams?: {
                    bg_color?: string;
                    text_color?: string;
                    hint_color?: string;
                    link_color?: string;
                    button_color?: string;
                    button_text_color?: string;
                    secondary_bg_color?: string;
                };
                switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
            };
        };
    }
}
