import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { CardDepositSection } from '@/components/Wallet/deposit/CardDepositSection';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));

const props = { depositAmount: '10', setDepositAmount: jest.fn(), processing: false, onCardTopUp: jest.fn(), onPresetSelect: jest.fn() };

afterEach(() => jest.clearAllMocks());

it('offers $5, $10 and $25 and marks the one that matches the amount', () => {
  render(<CardDepositSection {...props} />);
  const group = screen.getByRole('group', { name: 'quick_amounts' });
  expect(Array.from(group.querySelectorAll('button')).map(b => b.textContent)).toEqual(['$5', '$10', '$25']);
  expect(screen.getByRole('button', { name: '$10' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: '$5' })).toHaveAttribute('aria-pressed', 'false');
});

it('sets the amount and reports the preset when one is tapped', () => {
  render(<CardDepositSection {...props} />);
  fireEvent.click(screen.getByRole('button', { name: '$25' }));
  expect(props.setDepositAmount).toHaveBeenCalledWith('25');
  expect(props.onPresetSelect).toHaveBeenCalledWith(25);
});

it('marks no preset for a custom top-up shortfall amount', () => {
  render(<CardDepositSection {...props} depositAmount="5.27" />);
  for (const name of ['$5', '$10', '$25']) {
    expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false');
  }
});

it('locks the presets while a checkout is being created', () => {
  render(<CardDepositSection {...props} processing />);
  expect(screen.getByRole('button', { name: '$5' })).toBeDisabled();
});
