import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RISK_LEVELS } from '@ntd-watch/domain';
import {
  Button,
  DemoBadge,
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
  RiskBadge,
} from './index';

describe('RiskBadge', () => {
  it.each(RISK_LEVELS)('shows the %s level as text, not colour alone', (level) => {
    render(<RiskBadge level={level} />);
    expect(screen.getByText(level)).toBeInTheDocument();
  });
});

describe('Button', () => {
  it('defaults to type=button so it never submits a form by accident', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('type', 'button');
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('DemoBadge', () => {
  it('says DEMO DATA by default', () => {
    render(<DemoBadge />);
    expect(screen.getByText('DEMO DATA')).toBeInTheDocument();
  });
});

describe('Notice', () => {
  it('announces errors with role=alert and leaves info notices silent', () => {
    render(
      <>
        <Notice tone="error">Failed</Notice>
        <Notice tone="info">FYI</Notice>
      </>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });
});

describe('state components', () => {
  it('loading state is a busy status region', () => {
    render(<LoadingState label="Loading assessments" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('empty state shows the title and an action', () => {
    render(<EmptyState title="No referrals yet" action={<button type="button">Create</button>} />);
    expect(screen.getByText('No referrals yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('error state offers a retry that works', async () => {
    const onRetry = vi.fn();
    render(<ErrorState description="Could not load." onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
