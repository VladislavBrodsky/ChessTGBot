import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import QuickMatchModal from '@/components/game/QuickMatchModal';
import messages from '@/messages/en.json';
const mockPush = jest.fn(), mockSync = jest.fn(), mockPlay = jest.fn(), mockEmit = jest.fn();
let mockConnected = true;
let mockUser = { walletBalance: 1250, loadingBalance: false, balanceError: false, syncBalance: mockSync };
const mockListeners = new Map<string, (data?: any) => void>();
const mockSocket = { get connected() { return mockConnected; }, emit: mockEmit,
 on: (event: string, fn: (data?: any) => void) => mockListeners.set(event, fn),
 off: (event: string, fn: (data?: any) => void) => { if (mockListeners.get(event) === fn) mockListeners.delete(event); } };
jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: (ns: string) => (key: string, values: Record<string, unknown> = {}) => {
 const value = (messages as unknown as Record<string, Record<string, string>>)[ns][key];
 if (!value) throw new Error(`Missing ${ns}.${key}`);
 return value.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name]));
} }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/context/UserContext', () => ({ useUser: () => mockUser }));
jest.mock('@/hooks/useAudio', () => ({ useAudio: () => ({ play: mockPlay }) }));
jest.mock('@/lib/socket', () => ({ getSocket: () => mockSocket }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));
jest.mock('@/components/ui/Drawer', () => ({ Drawer: ({ isOpen, title, children, footer, onClose }: any) => isOpen ? <div role="dialog"><h2>{title}</h2><button onClick={onClose}>Close</button>{children}{footer}</div> : null }));
jest.mock('@/components/Wallet/WalletDialogs', () => ({ DepositDialog: ({ onSuccess, onClose }: any) => <div role="dialog" aria-label="Deposit"><button onClick={onSuccess}>Verify deposit</button><button onClick={onClose}>Close deposit</button></div> }));
const event = (name: string, data?: unknown) => act(() => mockListeners.get(name)?.(data));
const start = () => fireEvent.click(screen.getByRole('button', { name: 'Start matchmaking' }));
beforeEach(() => {
 jest.clearAllMocks(); mockListeners.clear(); mockConnected = true;
 mockUser = { walletBalance: 1250, loadingBalance: false, balanceError: false, syncBalance: mockSync }; mockSync.mockResolvedValue({ balance: 1250 });
});
it('offers paid stakes only, normalizes Free, and places Popular on $10', () => {
 render(<QuickMatchModal isOpen onClose={jest.fn()} initialWagerCents={0} />);
 expect(screen.queryByText(/Free|Qualifier|AI game/)).not.toBeInTheDocument();
 const popular = screen.getByRole('button', { name: 'Wager $10.00' }); expect(within(popular).getByText('Popular')).toBeVisible();
 expect(screen.getByRole('button', { name: 'Wager $5.00' })).toHaveAttribute('aria-pressed', 'true'); fireEvent.click(popular);
 expect(popular).toHaveAttribute('aria-pressed', 'true'); expect(screen.getByText('$19.00')).toBeVisible(); expect(screen.getByText(/Includes your stake/)).toBeVisible();
});
it('joins once and immediately opens only a confirmed server match', () => {
 const close = jest.fn(); render(<QuickMatchModal isOpen onClose={close} />); start();
 expect(mockEmit.mock.calls.filter(([name]) => name === 'join_matchmaking')).toEqual([['join_matchmaking', { bid_amount: 500, time_control: 300 }]]);
 expect(screen.queryByRole('button', { name: 'Start matchmaking' })).not.toBeInTheDocument(); expect(mockPush).not.toHaveBeenCalled();
 event('matchmaking_status', { status: 'searching' }); event('match_found', { game_id: 'server-match' });
 expect(mockPush).toHaveBeenCalledWith('/en/game?id=server-match'); expect(mockPlay).toHaveBeenCalledWith('start'); expect(close).toHaveBeenCalledTimes(1);
 event('match_found', { game_id: 'duplicate' }); expect(mockPush).toHaveBeenCalledTimes(1);
});
it('defers close until join acknowledgement and confirmed cancellation', () => {
 const close = jest.fn(); render(<QuickMatchModal isOpen onClose={close} />); start(); fireEvent.click(screen.getByRole('button', { name: 'Close' }));
 expect(mockEmit).not.toHaveBeenCalledWith('leave_matchmaking', {}); expect(close).not.toHaveBeenCalled();
 event('matchmaking_status', { status: 'searching' }); expect(mockEmit).toHaveBeenCalledWith('leave_matchmaking', {}); expect(close).not.toHaveBeenCalled();
 event('matchmaking_status', { status: 'idle' }); expect(close).toHaveBeenCalledTimes(1); expect(mockSync).toHaveBeenCalled();
});
it('reconciles reconnects without repeating a wager, and cancels the queue', () => {
 render(<QuickMatchModal isOpen onClose={jest.fn()} />); start(); event('matchmaking_status', { status: 'searching' }); event('disconnect'); event('connect');
 expect(mockEmit).toHaveBeenCalledWith('check_matchmaking', {}); expect(mockEmit.mock.calls.filter(([name]) => name === 'join_matchmaking')).toHaveLength(1);
 fireEvent.click(screen.getByRole('button', { name: 'Cancel search' })); expect(mockEmit).toHaveBeenCalledWith('leave_matchmaking', {});
 event('matchmaking_status', { status: 'idle' }); expect(screen.getByRole('button', { name: 'Start matchmaking' })).toBeEnabled();
});
it('handles server errors without navigating to a guessed game', () => {
 render(<QuickMatchModal isOpen onClose={jest.fn()} />); start(); event('matchmaking_error', { message: 'Balance changed' });
 expect(screen.getByRole('alert')).toHaveTextContent('Could not join matchmaking'); expect(mockSync).toHaveBeenCalled(); expect(mockPush).not.toHaveBeenCalled();
});
it('opens a separate deposit sheet and never starts on deposit verification', async () => {
 mockUser.walletBalance = 280; render(<QuickMatchModal isOpen onClose={jest.fn()} />); fireEvent.click(screen.getByRole('button', { name: 'Top Up' }));
 expect(screen.getAllByRole('dialog')).toHaveLength(1); expect(screen.getByRole('dialog', { name: 'Deposit' })).toBeVisible();
 await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Verify deposit' })));
 fireEvent.click(screen.getByRole('button', { name: 'Close deposit' })); expect(screen.getByRole('heading', { name: 'Quick Match' })).toBeVisible();
 expect(mockSync).toHaveBeenCalled(); expect(mockEmit).not.toHaveBeenCalledWith('join_matchmaking', expect.anything());
});
it('blocks unknown balances and disconnected starts without buffering a charge', () => {
 mockUser.loadingBalance = true; const view = render(<QuickMatchModal isOpen onClose={jest.fn()} />);
 expect(screen.getByRole('button', { name: 'Checking balance…' })).toBeDisabled();
 mockUser.loadingBalance = false; mockUser.balanceError = true; view.rerender(<QuickMatchModal isOpen onClose={jest.fn()} />);
 fireEvent.click(screen.getByRole('button', { name: 'Retry' })); expect(mockSync).toHaveBeenCalled();
 mockUser.balanceError = false; mockConnected = false; view.rerender(<QuickMatchModal isOpen onClose={jest.fn()} />); start();
 expect(mockEmit).not.toHaveBeenCalledWith('join_matchmaking', expect.anything()); expect(screen.getByRole('alert')).toHaveTextContent('Connecting to the game server');
});
it('cleans up listeners and cancels a confirmed queue on unmount', () => {
 const view = render(<QuickMatchModal isOpen onClose={jest.fn()} />); start(); event('matchmaking_status', { status: 'searching' }); view.unmount();
 expect(mockEmit).toHaveBeenCalledWith('leave_matchmaking', {}); expect(mockListeners.size).toBe(0);
});
it('does not race the stake reservation when navigation interrupts a pending join', () => {
 const view = render(<QuickMatchModal isOpen onClose={jest.fn()} />); start(); view.unmount();
 expect(mockEmit).not.toHaveBeenCalledWith('leave_matchmaking', {});
 event('matchmaking_status', { status: 'searching' });
 expect(mockEmit).toHaveBeenCalledWith('leave_matchmaking', {}); expect(mockListeners.size).toBe(0);
 expect(mockPush).not.toHaveBeenCalled();
});
