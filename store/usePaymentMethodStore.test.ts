import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

jest.mock('../lib/api', () => ({
    paymentMethodApi: {
        getAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    uploadApi: {
        uploadIcon: jest.fn(),
        deletePending: jest.fn(),
    },
}));

import {
    paymentMethodApi,
    type PaymentMethod,
    uploadApi,
} from '../lib/api';
import { activateAuthSession, invalidateAuthSession } from '../lib/authSession';
import { usePaymentMethodStore } from './usePaymentMethodStore';

const getAllMock = jest.mocked(paymentMethodApi.getAll);
const createMock = jest.mocked(paymentMethodApi.create);
const updateMock = jest.mocked(paymentMethodApi.update);
const deleteMock = jest.mocked(paymentMethodApi.delete);
const uploadIconMock = jest.mocked(uploadApi.uploadIcon);
const deletePendingMock = jest.mocked(uploadApi.deletePending);
const removeItemMock = jest.mocked(AsyncStorage.removeItem);

const serverMethod: PaymentMethod = {
    id: 'method-1',
    user_id: 'user-1',
    type: 'credit_card',
    label: 'Main card',
    icon_name: 'card-outline',
    color: '#3B82F6',
    last4: '4242',
    card_brand: 'visa',
    memo: 'Primary',
};

describe('usePaymentMethodStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        invalidateAuthSession();
        usePaymentMethodStore.setState({
            methods: [],
            isSyncing: false,
        });

        createMock.mockResolvedValue(serverMethod);
        updateMock.mockResolvedValue();
        deleteMock.mockResolvedValue();
        uploadIconMock.mockResolvedValue({ url: '/uploads/pending/icon.jpg' });
        deletePendingMock.mockResolvedValue();
        removeItemMock.mockResolvedValue();
    });

    test('adds a server-created method without uploading a preset icon', async () => {
        await expect(usePaymentMethodStore.getState().addMethod({
            type: 'credit_card',
            label: 'Main card',
            iconName: 'card-outline',
            color: '#3B82F6',
            last4: '4242',
            cardBrand: 'visa',
            memo: 'Primary',
        })).resolves.toBe('method-1');

        expect(uploadIconMock).not.toHaveBeenCalled();
        expect(createMock).toHaveBeenCalledWith({
            type: 'credit_card',
            label: 'Main card',
            icon_name: 'card-outline',
            icon_uri: undefined,
            color: '#3B82F6',
            last4: '4242',
            card_brand: 'visa',
            memo: 'Primary',
        });
        expect(usePaymentMethodStore.getState().methods).toEqual([{
            id: 'method-1',
            type: 'credit_card',
            label: 'Main card',
            iconName: 'card-outline',
            iconUri: undefined,
            color: '#3B82F6',
            last4: '4242',
            cardBrand: 'visa',
            memo: 'Primary',
        }]);
    });

    test('uploads a local icon and removes the pending upload after create fails', async () => {
        createMock.mockRejectedValue(new Error('Create failed'));

        await expect(usePaymentMethodStore.getState().addMethod({
            type: 'custom',
            label: 'Custom',
            iconUri: 'file:///icon.jpg',
            color: '#111827',
        })).rejects.toThrow('Create failed');

        expect(uploadIconMock).toHaveBeenCalledWith('file:///icon.jpg');
        expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
            icon_uri: '/uploads/pending/icon.jpg',
        }));
        expect(deletePendingMock)
            .toHaveBeenCalledWith('/uploads/pending/icon.jpg');
        expect(usePaymentMethodStore.getState().methods).toEqual([]);
    });

    test('keeps local state when server-first deletion fails', async () => {
        usePaymentMethodStore.setState({
            methods: [{
                id: 'method-1',
                type: 'credit_card',
                label: 'Main card',
                color: '#3B82F6',
            }],
        });
        deleteMock.mockRejectedValue(new Error('Method is in use'));

        await expect(usePaymentMethodStore.getState().removeMethod('method-1'))
            .rejects.toThrow('Method is in use');

        expect(usePaymentMethodStore.getState().methods).toHaveLength(1);
    });

    test('removes a method locally after server deletion succeeds', async () => {
        usePaymentMethodStore.setState({
            methods: [
                {
                    id: 'method-1',
                    type: 'credit_card',
                    label: 'Main card',
                    color: '#3B82F6',
                },
                {
                    id: 'method-2',
                    type: 'preset',
                    label: 'Cash',
                    color: '#22C55E',
                },
            ],
        });

        await usePaymentMethodStore.getState().removeMethod('method-1');

        expect(deleteMock).toHaveBeenCalledWith('method-1');
        expect(usePaymentMethodStore.getState().methods.map(({ id }) => id))
            .toEqual(['method-2']);
    });

    test('sends explicit nulls and clears optional local fields', async () => {
        usePaymentMethodStore.setState({
            methods: [{
                id: 'method-1',
                type: 'credit_card',
                label: 'Main card',
                iconName: 'card-outline',
                last4: '4242',
                memo: 'Primary',
                color: '#3B82F6',
            }],
        });

        await usePaymentMethodStore.getState().updateMethod('method-1', {
            label: 'Renamed',
            iconName: null,
            last4: null,
            memo: null,
        });

        expect(updateMock).toHaveBeenCalledWith('method-1', {
            label: 'Renamed',
            icon_name: null,
            icon_uri: undefined,
            color: undefined,
            last4: null,
            card_brand: undefined,
            memo: null,
        });
        expect(usePaymentMethodStore.getState().methods[0])
            .toEqual(expect.objectContaining({
                label: 'Renamed',
                iconName: undefined,
                last4: undefined,
                memo: undefined,
            }));
    });

    test('synchronizes and maps methods only for the current session', async () => {
        activateAuthSession('user-1');
        getAllMock.mockResolvedValue([serverMethod]);

        await usePaymentMethodStore.getState().syncFromServer();

        expect(usePaymentMethodStore.getState()).toEqual(expect.objectContaining({
            isSyncing: false,
            methods: [expect.objectContaining({
                id: 'method-1',
                cardBrand: 'visa',
                last4: '4242',
            })],
        }));
    });

    test('does not apply a response after the authenticated user changes', async () => {
        let resolveRequest: (methods: PaymentMethod[]) => void = () => {};
        getAllMock.mockReturnValue(new Promise((resolve) => {
            resolveRequest = resolve;
        }));
        activateAuthSession('user-1');

        const sync = usePaymentMethodStore.getState().syncFromServer();
        activateAuthSession('user-2');
        resolveRequest([serverMethod]);
        await sync;

        expect(usePaymentMethodStore.getState().methods).toEqual([]);
    });

    test('migrates a legacy local icon and then reloads canonical data', async () => {
        activateAuthSession('user-1');
        const legacyMethod = {
            ...serverMethod,
            icon_uri: 'file:///legacy-icon.jpg',
        };
        const migratedMethod = {
            ...serverMethod,
            icon_uri: '/uploads/icons/icon.jpg',
        };
        uploadIconMock.mockResolvedValue({ url: '/uploads/icons/icon.jpg' });
        getAllMock
            .mockResolvedValueOnce([legacyMethod])
            .mockResolvedValueOnce([migratedMethod]);

        await usePaymentMethodStore.getState().syncFromServer();

        expect(uploadIconMock).toHaveBeenCalledWith('file:///legacy-icon.jpg');
        expect(updateMock).toHaveBeenCalledWith('method-1', {
            icon_uri: '/uploads/icons/icon.jpg',
        });
        expect(getAllMock).toHaveBeenCalledTimes(2);
        expect(usePaymentMethodStore.getState().methods[0].iconUri)
            .toBe('/uploads/icons/icon.jpg');
    });

    test('clears persisted methods on logout', async () => {
        usePaymentMethodStore.setState({
            methods: [{
                id: 'method-1',
                type: 'preset',
                label: 'Cash',
                color: '#22C55E',
            }],
            isSyncing: true,
        });

        await usePaymentMethodStore.getState().resetForLogout();

        expect(removeItemMock).toHaveBeenCalledWith('payment-methods-storage');
        expect(usePaymentMethodStore.getState()).toEqual(expect.objectContaining({
            methods: [],
            isSyncing: false,
        }));
    });
});
