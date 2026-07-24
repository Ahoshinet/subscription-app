import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@/lib/gmail', () => {
  class MockGmailAuthError extends Error {
    constructor() {
      super('Gmail authorization expired');
      this.name = 'GmailAuthError';
    }
  }

  return {
    GmailAuthError: MockGmailAuthError,
    fetchPaidyTransactions: jest.fn(),
  };
});

jest.mock('@/lib/api', () => {
  class MockApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }

  return {
    ApiError: MockApiError,
    gmailApi: {
      getIntegration: jest.fn(),
      upsertIntegration: jest.fn(),
      deleteIntegration: jest.fn(),
    },
  };
});

import { ApiError, gmailApi, type GmailIntegration } from '../lib/api';
import {
  fetchPaidyTransactions,
  GmailAuthError,
  type PaidySummary,
} from '../lib/gmail';
import { activateAuthSession, invalidateAuthSession } from '../lib/authSession';
import { usePaidyStore } from './usePaidyStore';

const getItemAsyncMock = jest.mocked(SecureStore.getItemAsync);
const setItemAsyncMock = jest.mocked(SecureStore.setItemAsync);
const deleteItemAsyncMock = jest.mocked(SecureStore.deleteItemAsync);
const removeItemMock = jest.mocked(AsyncStorage.removeItem);
const getIntegrationMock = jest.mocked(gmailApi.getIntegration);
const upsertIntegrationMock = jest.mocked(gmailApi.upsertIntegration);
const deleteIntegrationMock = jest.mocked(gmailApi.deleteIntegration);
const fetchPaidyTransactionsMock = jest.mocked(fetchPaidyTransactions);

const integration: GmailIntegration = {
  gmail_email: 'user@example.com',
  paidy_amount: 3500,
  paidy_month: '2026-07',
  paidy_next_payment_date: '2026-08-27',
  paidy_transactions: [
    { date: '2026年7月20日', amount: 3500, merchant: 'Example Store' },
  ],
  last_synced_at: '2026-07-25T00:00:00.000Z',
  updated_at: '2026-07-25T00:00:00.000Z',
};

const summary: PaidySummary = {
  totalAmount: 4200,
  month: '2026-07',
  nextPaymentDate: '2026-08-27',
  transactions: [
    { date: '2026年7月21日', amount: 4200, merchant: 'Another Store' },
  ],
};

const initialState = {
  isSignedIn: false,
  needsReauth: false,
  pendingServerDeletion: false,
  googleEmail: null,
  paidyAmount: null,
  paidyMonth: null,
  nextPaymentDate: null,
  transactions: [],
  lastSyncedAt: null,
  isLoading: false,
  error: null,
};

describe('usePaidyStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateAuthSession();
    usePaidyStore.setState(initialState);

    getItemAsyncMock.mockResolvedValue('gmail-token');
    setItemAsyncMock.mockResolvedValue();
    deleteItemAsyncMock.mockResolvedValue();
    removeItemMock.mockResolvedValue();
    getIntegrationMock.mockResolvedValue(integration);
    upsertIntegrationMock.mockResolvedValue(integration);
    deleteIntegrationMock.mockResolvedValue();
    fetchPaidyTransactionsMock.mockResolvedValue(summary);
  });

  test('does not load or synchronize without an active authentication session', async () => {
    await usePaidyStore.getState().loadFromServer();
    await usePaidyStore.getState().syncPaidy();
    await usePaidyStore.getState().setSignedIn('token', 'user@example.com');
    await usePaidyStore.getState().signOut();

    expect(getIntegrationMock).not.toHaveBeenCalled();
    expect(fetchPaidyTransactionsMock).not.toHaveBeenCalled();
    expect(setItemAsyncMock).not.toHaveBeenCalled();
    expect(deleteIntegrationMock).not.toHaveBeenCalled();
  });

  test('loads server integration and checks the account-scoped token', async () => {
    activateAuthSession('user-1');

    await usePaidyStore.getState().loadFromServer();

    expect(getItemAsyncMock).toHaveBeenCalledWith(
      'paidy_gmail_access_token:user-1',
    );
    expect(deleteItemAsyncMock).toHaveBeenCalledWith(
      'paidy_gmail_access_token',
    );
    expect(usePaidyStore.getState()).toEqual(expect.objectContaining({
      isSignedIn: true,
      needsReauth: false,
      googleEmail: 'user@example.com',
      paidyAmount: 3500,
      paidyMonth: '2026-07',
      nextPaymentDate: '2026-08-27',
      transactions: integration.paidy_transactions,
      lastSyncedAt: '2026-07-25T00:00:00.000Z',
    }));
  });

  test('requires reauthentication when the current account has no token', async () => {
    activateAuthSession('user-1');
    getItemAsyncMock.mockResolvedValue(null);

    await usePaidyStore.getState().loadFromServer();

    expect(usePaidyStore.getState()).toEqual(expect.objectContaining({
      isSignedIn: true,
      needsReauth: true,
    }));
  });

  test('does not apply a load response after the authenticated user changes', async () => {
    let resolveRequest: (value: GmailIntegration) => void = () => {};
    getIntegrationMock.mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    activateAuthSession('user-1');

    const loadRequest = usePaidyStore.getState().loadFromServer();
    activateAuthSession('user-2');
    resolveRequest(integration);
    await loadRequest;

    expect(usePaidyStore.getState()).toEqual(expect.objectContaining({
      isSignedIn: false,
      googleEmail: null,
      paidyAmount: null,
    }));
  });

  test('retries a pending server deletion before loading integration data', async () => {
    activateAuthSession('user-1');
    usePaidyStore.setState({ pendingServerDeletion: true });

    await usePaidyStore.getState().loadFromServer();

    expect(deleteIntegrationMock).toHaveBeenCalledTimes(1);
    expect(getIntegrationMock).not.toHaveBeenCalled();
    expect(usePaidyStore.getState().pendingServerDeletion).toBe(false);
  });

  test('treats a missing pending integration as already deleted', async () => {
    activateAuthSession('user-1');
    usePaidyStore.setState({ pendingServerDeletion: true });
    deleteIntegrationMock.mockRejectedValue(new ApiError('Not found', 404));

    await usePaidyStore.getState().loadFromServer();

    expect(usePaidyStore.getState().pendingServerDeletion).toBe(false);
  });

  test('keeps a failed pending deletion queued for the next load', async () => {
    activateAuthSession('user-1');
    usePaidyStore.setState({ pendingServerDeletion: true });
    deleteIntegrationMock.mockRejectedValue({ reason: 'offline' });

    await usePaidyStore.getState().loadFromServer();

    expect(getIntegrationMock).not.toHaveBeenCalled();
    expect(usePaidyStore.getState().pendingServerDeletion).toBe(true);
  });

  test('stores a Gmail token under the current account only', async () => {
    activateAuthSession('user-1');

    await usePaidyStore.getState()
      .setSignedIn('new-token', 'new@example.com');

    expect(setItemAsyncMock).toHaveBeenCalledWith(
      'paidy_gmail_access_token:user-1',
      'new-token',
    );
    expect(usePaidyStore.getState()).toEqual(expect.objectContaining({
      isSignedIn: true,
      needsReauth: false,
      googleEmail: 'new@example.com',
    }));
  });

  test('deletes a token written for a session that changed during storage', async () => {
    let resolveWrite: () => void = () => {};
    setItemAsyncMock.mockReturnValue(new Promise((resolve) => {
      resolveWrite = resolve;
    }));
    activateAuthSession('user-1');

    const signInRequest = usePaidyStore.getState()
      .setSignedIn('new-token', 'new@example.com');
    activateAuthSession('user-2');
    resolveWrite();
    await signInRequest;

    expect(deleteItemAsyncMock).toHaveBeenCalledWith(
      'paidy_gmail_access_token:user-1',
    );
    expect(usePaidyStore.getState().isSignedIn).toBe(false);
  });

  test('marks synchronization for reauthentication when the token is missing', async () => {
    activateAuthSession('user-1');
    getItemAsyncMock.mockResolvedValue(null);

    await usePaidyStore.getState().syncPaidy();

    expect(fetchPaidyTransactionsMock).not.toHaveBeenCalled();
    expect(usePaidyStore.getState()).toEqual(expect.objectContaining({
      needsReauth: true,
      isLoading: false,
      error: 'Gmailとの再連携が必要です',
    }));
  });

  test('synchronizes the latest summary locally and to the server', async () => {
    activateAuthSession('user-1');
    usePaidyStore.setState({ googleEmail: 'user@example.com' });

    await usePaidyStore.getState().syncPaidy();

    expect(fetchPaidyTransactionsMock).toHaveBeenCalledWith('gmail-token');
    expect(upsertIntegrationMock).toHaveBeenCalledWith(expect.objectContaining({
      gmail_email: 'user@example.com',
      paidy_amount: 4200,
      paidy_month: '2026-07',
      paidy_next_payment_date: '2026-08-27',
      paidy_transactions: summary.transactions,
      last_synced_at: expect.any(String),
    }));
    expect(usePaidyStore.getState()).toEqual(expect.objectContaining({
      paidyAmount: 4200,
      paidyMonth: '2026-07',
      transactions: summary.transactions,
      isLoading: false,
      error: null,
    }));
  });

  test('preserves the previous summary when Gmail returns no transactions', async () => {
    activateAuthSession('user-1');
    usePaidyStore.setState({
      paidyAmount: 3500,
      paidyMonth: '2026-07',
      transactions: integration.paidy_transactions ?? [],
    });
    fetchPaidyTransactionsMock.mockResolvedValue(null);

    await usePaidyStore.getState().syncPaidy();

    expect(upsertIntegrationMock).not.toHaveBeenCalled();
    expect(usePaidyStore.getState()).toEqual(expect.objectContaining({
      paidyAmount: 3500,
      paidyMonth: '2026-07',
      transactions: integration.paidy_transactions,
      lastSyncedAt: expect.any(String),
      isLoading: false,
    }));
  });

  test('requires reauthentication after Gmail rejects the token', async () => {
    activateAuthSession('user-1');
    fetchPaidyTransactionsMock.mockRejectedValue(new GmailAuthError());

    await usePaidyStore.getState().syncPaidy();

    expect(usePaidyStore.getState()).toEqual(expect.objectContaining({
      needsReauth: true,
      isLoading: false,
      error: 'Gmailとの再連携が必要です',
    }));
  });

  test('uses a safe fallback message for an unknown synchronization failure', async () => {
    activateAuthSession('user-1');
    fetchPaidyTransactionsMock.mockRejectedValue({ reason: 'offline' });

    await usePaidyStore.getState().syncPaidy();

    expect(usePaidyStore.getState()).toEqual(expect.objectContaining({
      needsReauth: false,
      isLoading: false,
      error: '同期に失敗しました',
    }));
  });

  test('signs out locally and remembers a failed server deletion', async () => {
    activateAuthSession('user-1');
    usePaidyStore.setState({
      isSignedIn: true,
      googleEmail: 'user@example.com',
      paidyAmount: 3500,
      transactions: integration.paidy_transactions ?? [],
    });
    deleteIntegrationMock.mockRejectedValue(new Error('Offline'));

    await usePaidyStore.getState().signOut();

    expect(deleteItemAsyncMock).toHaveBeenCalledWith(
      'paidy_gmail_access_token:user-1',
    );
    expect(usePaidyStore.getState()).toEqual(expect.objectContaining({
      isSignedIn: false,
      pendingServerDeletion: true,
      googleEmail: null,
      paidyAmount: null,
      transactions: [],
    }));
  });

  test('clears persisted integration state on logout', async () => {
    activateAuthSession('user-1');
    await usePaidyStore.getState()
      .setSignedIn('new-token', 'new@example.com');
    usePaidyStore.setState({
      paidyAmount: 3500,
      transactions: integration.paidy_transactions ?? [],
      isLoading: true,
      error: 'Offline',
    });

    await usePaidyStore.getState().resetForLogout();

    expect(deleteItemAsyncMock).toHaveBeenCalledWith(
      'paidy_gmail_access_token',
    );
    expect(deleteItemAsyncMock).toHaveBeenCalledWith(
      'paidy_gmail_access_token:user-1',
    );
    expect(removeItemMock).toHaveBeenCalledWith('paidy-store');
    expect(usePaidyStore.getState()).toEqual(expect.objectContaining(
      initialState,
    ));
  });
});
