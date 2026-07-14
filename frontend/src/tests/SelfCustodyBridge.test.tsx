import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import SelfCustodyBridge from '../components/Wallet/SelfCustodyBridge';

const copyToClipboard = jest.fn<Promise<boolean>, [value: string]>(async () => true);
const logTelemetryEvent = jest.fn<void, [eventType: string, eventData?: unknown]>();

jest.mock('@ton/core', () => ({
  Address: {
    parse: () => ({
      toString: () => 'UQ_CONNECTED_TON_WALLET',
    }),
  },
}));

jest.mock('@/lib/clipboard', () => ({
  copyToClipboard: (value: string) => copyToClipboard(value),
}));

jest.mock('@/lib/telemetry', () => ({
  logTelemetryEvent: (eventType: string, eventData?: unknown) => logTelemetryEvent(eventType, eventData),
}));

jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));

describe('SelfCustodyBridge', () => {
  const openLink = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'Telegram', {
      configurable: true,
      value: { WebApp: { openLink } },
    });
  });

  it('opens the reviewed Ethereum bridge only after starting the arrival watcher', async () => {
    const calls: string[] = [];
    const onBridgeStarted = jest.fn(async () => { calls.push('watch'); });
    openLink.mockImplementation(() => { calls.push('open'); });

    render(
      <SelfCustodyBridge
        walletRawAddress="0:connected"
        onBridgeStarted={onBridgeStarted}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /bridge btc or eth/i }));
    expect(screen.getByText('UQ_CONNECTED_TON_WALLET')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open non-custodial bridge/i }));

    await waitFor(() => expect(openLink).toHaveBeenCalledWith('https://stargate.finance/bridge'));
    expect(onBridgeStarted).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['watch', 'open']);
    expect(logTelemetryEvent).toHaveBeenCalledWith(
      'self_custody_bridge_opened',
      expect.objectContaining({ source_currency: 'eth', destination_network: 'ton' }),
    );
  });

  it('keeps the BTC swap and TON bridge as separate self-custodial steps', async () => {
    const onBridgeStarted = jest.fn(async () => undefined);
    render(
      <SelfCustodyBridge
        walletRawAddress="0:connected"
        onBridgeStarted={onBridgeStarted}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /bridge btc or eth/i }));
    fireEvent.click(screen.getByRole('button', { name: /bitcoin/i }));
    fireEvent.click(screen.getByRole('button', { name: /open btc swap/i }));

    await waitFor(() => {
      expect(openLink).toHaveBeenCalledWith('https://app.thorswap.finance/swap/BTC.BTC_ETH.USDT');
    });
    expect(onBridgeStarted).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /open ton bridge/i }));
    await waitFor(() => expect(onBridgeStarted).toHaveBeenCalledTimes(1));
    expect(openLink).toHaveBeenLastCalledWith('https://stargate.finance/bridge');
  });

  it('copies the connected wallet rather than a platform address', async () => {
    render(
      <SelfCustodyBridge
        walletRawAddress="0:connected"
        onBridgeStarted={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /bridge btc or eth/i }));
    fireEvent.click(screen.getByText('UQ_CONNECTED_TON_WALLET'));

    await waitFor(() => expect(copyToClipboard).toHaveBeenCalledWith('UQ_CONNECTED_TON_WALLET'));
  });
});
