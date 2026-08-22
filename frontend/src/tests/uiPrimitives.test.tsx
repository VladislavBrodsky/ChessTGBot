import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Input } from '../components/ui/Input';
import { Skeleton, SkeletonList } from '../components/ui/Skeleton';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Toast } from '../components/ui/Toast';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Switch } from '../components/ui/Switch';
import { Tabs } from '../components/ui/Tabs';

describe('UI Primitives Layer', () => {
  describe('Input', () => {
    it('renders with label and placeholder', () => {
      render(<Input label="Username" placeholder="Enter name" />);
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter name/i)).toBeInTheDocument();
    });

    it('renders error message and marks aria-invalid', () => {
      render(<Input label="Email" error="Invalid email address" />);
      const input = screen.getByLabelText(/email/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email address');
    });

    it('renders helper text when no error is present', () => {
      render(<Input label="PIN" helperText="Enter 4-digit PIN" />);
      expect(screen.getByText('Enter 4-digit PIN')).toBeInTheDocument();
    });
  });

  describe('Skeleton & SkeletonList', () => {
    it('renders skeleton element with shimmer gradient classes', () => {
      const { container } = render(<Skeleton variant="rectangular" width={100} height={20} />);
      expect(container.firstChild).toHaveClass('overflow-hidden');
      expect(container.firstChild).toHaveClass('bg-brand-elevated/60');
    });

    it('renders correct count of skeleton list items', () => {
      const { container } = render(<SkeletonList count={4} />);
      expect(container.querySelectorAll('.overflow-hidden').length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('SegmentedControl', () => {
    it('renders options and fires onChange on click', () => {
      const handleChange = jest.fn();
      const options = [
        { label: 'Weekly', value: 'weekly' },
        { label: 'All Time', value: 'all_time' }
      ];

      render(
        <SegmentedControl
          options={options}
          value="weekly"
          onChange={handleChange}
        />
      );

      expect(screen.getByRole('tab', { name: 'Weekly' })).toHaveAttribute('aria-selected', 'true');
      const allTimeTab = screen.getByRole('tab', { name: 'All Time' });
      expect(allTimeTab).toHaveAttribute('aria-selected', 'false');

      fireEvent.click(allTimeTab);
      expect(handleChange).toHaveBeenCalledWith('all_time');
    });
  });

  describe('EmptyState & ErrorState', () => {
    it('renders empty state title and description', () => {
      render(
        <EmptyState
          title="No Transactions"
          description="Your wallet history will show here."
        />
      );
      expect(screen.getByText('No Transactions')).toBeInTheDocument();
      expect(screen.getByText('Your wallet history will show here.')).toBeInTheDocument();
    });

    it('renders error state and action button', () => {
      const handleRetry = jest.fn();
      render(
        <ErrorState
          title="Failed to load"
          message="Server is unreachable."
          action={<button onClick={handleRetry}>Retry</button>}
        />
      );
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
      expect(screen.getByText('Server is unreachable.')).toBeInTheDocument();
      const btn = screen.getByRole('button', { name: 'Retry' });
      fireEvent.click(btn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('renders default onRetry button when onRetry prop is passed', () => {
      const handleRetry = jest.fn();
      render(
        <ErrorState
          title="Connection Error"
          onRetry={handleRetry}
          retryLabel="Try Again"
        />
      );
      const btn = screen.getByRole('button', { name: 'Try Again' });
      fireEvent.click(btn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Toast & Card x-panel', () => {
    it('renders Toast notification and triggers dismiss on click', () => {
      const handleDismiss = jest.fn();
      const toastItem = {
        id: 't-1',
        message: 'Settings saved successfully',
        type: 'success' as const,
      };

      render(<Toast toast={toastItem} onDismiss={handleDismiss} />);
      expect(screen.getByText('Settings saved successfully')).toBeInTheDocument();

      const dismissBtn = screen.getByLabelText(/dismiss toast/i);
      fireEvent.click(dismissBtn);
      expect(handleDismiss).toHaveBeenCalledWith('t-1');
    });

    it('renders Card with x-panel variant', () => {
      const { container } = render(
        <Card variant="x-panel">
          <span>X Feed Item</span>
        </Card>
      );
      expect(container.firstChild).toHaveClass('bg-brand-surface');
      expect(container.firstChild).toHaveClass('border-brand-border');
    });
  });

  describe('Avatar, Switch, & Tabs', () => {
    it('renders Avatar with fallback initials and online badge', () => {
      render(<Avatar name="Magnus Carlsen" isOnline={true} />);
      expect(screen.getByText('MC')).toBeInTheDocument();
      expect(screen.getByLabelText('Online')).toBeInTheDocument();
    });

    it('renders accessible Switch and toggles on click and keydown', () => {
      const handleChange = jest.fn();
      render(
        <Switch
          label="Sound FX"
          description="Enable game audio"
          checked={false}
          onChange={handleChange}
        />
      );

      const switchBtn = screen.getByRole('switch');
      expect(switchBtn).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(switchBtn);
      expect(handleChange).toHaveBeenCalledWith(true);

      fireEvent.keyDown(switchBtn, { key: ' ' });
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('renders Tabs and switches selection on tab click', () => {
      const handleTabChange = jest.fn();
      const tabs = [
        { id: 'overview', label: 'Overview', badge: 3 },
        { id: 'stats', label: 'Stats' },
      ];

      render(
        <Tabs
          tabs={tabs}
          activeTab="overview"
          onChange={handleTabChange}
        />
      );

      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      expect(overviewTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('3')).toBeInTheDocument();

      const statsTab = screen.getByRole('tab', { name: /stats/i });
      fireEvent.click(statsTab);
      expect(handleTabChange).toHaveBeenCalledWith('stats');
    });
  });
});
