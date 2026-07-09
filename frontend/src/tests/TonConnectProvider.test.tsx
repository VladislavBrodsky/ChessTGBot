import { render } from '@testing-library/react';
import React from 'react';

/**
 * Regression test for the "Play Game" crash
 * ([TON_CONNECT_SDK_ERROR] You should add <TonConnectUIProvider>).
 *
 * Root cause: TonConnectProvider resolved manifestUrl in a useEffect, so on the
 * FIRST render it returned its children WITHOUT the provider. When the provider
 * mounted fresh on navigation to /game, that first providerless render was
 * exactly when a consumer (WalletConnect -> useTonConnectUI) rendered and threw.
 *
 * This mocks @tonconnect/ui-react so useTonConnectUI throws when used outside the
 * provider — mirroring the real SDK. A consumer rendered as a child must not
 * throw, which only holds if the provider wraps its children on the very first
 * render (the fix computes manifestUrl synchronously).
 */
jest.mock('@tonconnect/ui-react', () => {
    const React = require('react');
    const Ctx = React.createContext(false);
    return {
        TonConnectUIProvider: ({ children }: any) =>
            React.createElement(Ctx.Provider, { value: true }, children),
        useTonConnectUI: () => {
            const inProvider = React.useContext(Ctx);
            if (!inProvider) {
                throw new Error('[TON_CONNECT_SDK_ERROR] You should add <TonConnectUIProvider>');
            }
            return [{}];
        },
    };
});

import TonConnectProvider from '../components/TonConnectProvider';
import { useTonConnectUI } from '@tonconnect/ui-react';

function Consumer() {
    useTonConnectUI(); // throws if rendered outside the provider
    return <span>ok</span>;
}

describe('TonConnectProvider', () => {
    it('wraps a TonConnect consumer in the provider on first render (no crash)', () => {
        expect(() =>
            render(
                <TonConnectProvider>
                    <Consumer />
                </TonConnectProvider>
            )
        ).not.toThrow();
    });
});
