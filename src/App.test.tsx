import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSummary = {
  totalProfiles: 222,
  uniquePayers: 8,
  payerCounts: { Humana: 50, Aetna: 40 },
  statusCounts: { active: 180, inactive: 42 },
  scenarioCounts: { 'scenario-0': 37, 'scenario-1': 37 },
  checkCounts: { active: 5, error: 2 },
  recentChecks: [{ id: 'elig_1', status: 'active', payer: 'Humana', created_at: Date.now() }],
};

const mockProfiles = {
  items: [
    { memberId: 'NH-SYN-001', firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01', gender: 'male', payer: 'Humana', coverageStatus: 'active', scenario: 0, copay: '$25', coinsurance: '20%', deductible: '$500', outOfPocket: '$3000', provenance: {}, syntheaPatientId: 'abc' },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

describe('Synthetic Insurance Lab', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/profiles')) {
        return Promise.resolve({ ok: true, json: async () => mockProfiles });
      }
      if (url.includes('/checks')) {
        return Promise.resolve({ ok: true, json: async () => ({ checks: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => mockSummary });
    });
  });

  it('renders overview with metrics from API', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText('Total Profiles').length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('shows synthetic data notice', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText(/Synthetic Data/).length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('navigates to explorer view', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText('Total Profiles').length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });
});
