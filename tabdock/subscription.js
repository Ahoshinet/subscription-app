// 2025 TabDock: darui3018823 All rights reserved.
// All works created by darui3018823 associated with this repository are the intellectual property of darui3018823.
// Packages and other third-party materials used in this repository are subject to their respective licenses and copyrights.
// This code Version: 5.16.3_subsc-r1

class SubscriptionManager {
    constructor() {
        this.modal = document.getElementById('subscriptionModal');
        this.form = document.getElementById('subscriptionForm');
        this.paymentMethodSelect = this.form?.querySelector('[name="paymentMethod"]') ?? null;
        this.notificationTimers = new Set();
        this.cachedUpcoming = [];
        this.notifiedKeys = new Set();
        this.initialize();
    }

    initialize() {
        if (!this.modal || !this.form) {
            console.warn('[SubscriptionManager] モーダル要素が見つかりませんでした。');
            return;
        }

        this.hideAllPaymentDetails();
        this.setupEventListeners();
        this.registerCalendarListeners();
        this.registerDateChangeListener();
    }

    setupEventListeners() {
        const registerAddButton = () => {
            const addButton = document.querySelector('[data-action="add-subscription"]');
            if (addButton) {
                addButton.addEventListener('click', () => this.showAddModal());
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', registerAddButton, { once: true });
        } else {
            registerAddButton();
        }

        this.paymentMethodSelect?.addEventListener('change', (e) => this.handlePaymentMethodChange(e));
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        const cancelBtn = document.getElementById('cancelSubscription');
        cancelBtn?.addEventListener('click', () => {
            this.hideModal();
            const scheduleTypeModal = document.getElementById('scheduleTypeModal');
            scheduleTypeModal?.classList.add('hidden');
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        window.addEventListener('subscription:request-open', () => this.showAddModal());
    }

    registerDateChangeListener() {
        window.addEventListener('date:changed', () => {
            console.log('日付変更を検知しました。通知を再スケジュールします。');
            this.scheduleNotifications({ reschedule: true, immediate: true })
                .catch(err => console.error('日付変更による通知の再スケジュールに失敗しました:', err));
        });
    }

    registerCalendarListeners() {
        window.addEventListener('calendar:schedule-rendered', (event) => {
            const detailDate = event.detail?.date;
            if (!detailDate) return;
            const reference = new Date(detailDate);
            if (Number.isNaN(reference.getTime())) return;
            void this.showImmediateNotifications(reference);
        });

        window.addEventListener('subscription:calendar-regenerated', () => {
            void this.showImmediateNotifications();
        });
    }

    clearNotificationTimers() {
        this.notificationTimers.forEach(timer => {
            clearTimeout(timer);
        });
        this.notificationTimers.clear();
    }

    showAddModal() {
        const scheduleTypeModal = document.getElementById('scheduleTypeModal');
        if (scheduleTypeModal) {
            scheduleTypeModal.classList.add('hidden');
        }
        this.showModal();
    }

    showModal() {
        if (!this.modal) return;
        this.modal.classList.remove('hidden');
        const firstInput = this.form?.querySelector('input[name="serviceName"]');
        firstInput?.focus();
    }

    hideModal() {
        if (!this.modal) return;
        this.modal.classList.add('hidden');
        this.form?.reset();
        this.hideAllPaymentDetails();
    }

    handlePaymentMethodChange(event) {
        this.hideAllPaymentDetails();
        const method = event.target.value;
        const paymentDetails = document.getElementById('paymentDetails');
        if (!paymentDetails) return;

        if (method === 'CC') {
            paymentDetails.classList.remove('hidden');
            document.getElementById('ccDetails')?.classList.remove('hidden');
            Swal.fire({
                title: '注意',
                text: 'セキュリティ上の理由により、カード情報の全てを入力することはできません。末尾4桁のみ任意で記録できます。',
                icon: 'warning',
                confirmButtonText: '了解'
            });
        } else if (method === 'PayPal') {
            paymentDetails.classList.remove('hidden');
            document.getElementById('paypalDetails')?.classList.remove('hidden');
        } else if (method === 'Other') {
            paymentDetails.classList.remove('hidden');
            document.getElementById('otherDetails')?.classList.remove('hidden');
        }
    }

    hideAllPaymentDetails() {
        const paymentDetails = document.getElementById('paymentDetails');
        paymentDetails?.classList.add('hidden');
        ['ccDetails', 'paypalDetails', 'otherDetails'].forEach((id) => {
            document.getElementById(id)?.classList.add('hidden');
        });
    }

    async showImmediateNotifications(referenceDate = new Date()) {
        if (typeof Swal === 'undefined') {
            return 'skip';
        }

        if (!Array.isArray(this.cachedUpcoming) || this.cachedUpcoming.length === 0) {
            return 'skip';
        }

        const reference = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
        if (Number.isNaN(reference.getTime())) {
            return 'skip';
        }

        const referenceStr = this.toLocalDateString(reference);
        const today = new Date();

        const baseToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dueSoon = [];

        const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

        for (const sub of this.cachedUpcoming) {
            if (!sub?.nextPaymentDate) continue;
            const paymentDate = new Date(sub.nextPaymentDate);
            if (Number.isNaN(paymentDate.getTime())) continue;
            const paymentStr = this.toLocalDateString(paymentDate);

            const amountText = (() => {
                if (typeof sub.amount === 'number') {
                    return `${sub.amount.toLocaleString()} ${sub.currency || ''}`.trim();
                }
                if (typeof sub.amount === 'string' && sub.amount.trim() !== '') {
                    return `${sub.amount} ${sub.currency || ''}`.trim();
                }
                return '金額未設定';
            })();

            const pushEntry = (label, type) => {
                const key = `${type}:${sub.id || sub.serviceName || paymentStr}:${paymentStr}`;
                if (this.notifiedKeys.has(key)) return;
                dueSoon.push({
                    key,
                    sub,
                    label,
                    amount: amountText
                });
            };

            if (paymentStr === referenceStr) {
                pushEntry('選択日', 'selected');
            }

            // 支払い日もローカル時間の「深夜0時」に正規化
            const paymentLocal = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());

            // 日数差分：Math.floorではなくMath.roundを使用して微細な時間のズレを吸収
            const diffDays = Math.round((paymentLocal.getTime() - baseToday.getTime()) / (24 * 60 * 60 * 1000));
            if (diffDays === 0) {
                pushEntry('本日', 'today');
            } else if (diffDays === 1) {
                pushEntry('明日', 'tomorrow');
            } else if (diffDays === 3) {
                pushEntry('3日後', 'three-days');
            }
        }

        if (dueSoon.length === 0) {
            return 'skip';
        }

        const listItems = dueSoon.map(item => {
            const name = escapeHtml(item.sub.serviceName || '名称未設定');
            const cycle = escapeHtml(this.formatBillingCycleLabel(item.sub.billingCycle));
            return `<li class="swal-subscription-item">
                <div class="swal-subscription-name">${name}</div>
                <div class="swal-subscription-details">${escapeHtml(item.label)}に支払い予定 / <span class="swal-subscription-amount">${escapeHtml(item.amount)}</span> / ${cycle}</div>
            </li>`;
        }).join('');

        const descriptionHtml = `<div class="swal-subscription-container">
            <p class="swal-subscription-title">近い支払予定のサブスクリプションがあります。</p>
            <ul class="swal-subscription-list">${listItems}</ul>
        </div>`;

        await Swal.fire({
            icon: 'info',
            title: '支払い予定の確認',
            html: descriptionHtml,
            confirmButtonText: '閉じる'
        });

        dueSoon.forEach(item => this.notifiedKeys.add(item.key));
        return 'notified';
    }

    toLocalDateString(d) {
        return d.toLocaleDateString('sv-SE');
    }

    formatBillingCycleLabel(cycle) {
        const normalized = typeof cycle === 'string' ? cycle.toLowerCase() : '';
        const labels = {
            monthly: '月額',
            yearly: '年額',
            weekly: '週次',
            daily: '日次'
        };
        if (!normalized) {
            return '周期未設定';
        }
        return labels[normalized] || cycle;
    }

    async handleSubmit(event) {
        event.preventDefault();
        if (!this.form) return;

        const formData = new FormData(this.form);
        const amount = Number(formData.get('amount'));
        if (Number.isNaN(amount) || amount < 0) {
            Swal.fire({
                title: '入力エラー',
                text: '金額は0以上の数値を入力してください。',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        const payload = {
            serviceName: formData.get('serviceName'),
            planName: formData.get('planName'),
            amount,
            currency: formData.get('currency'),
            billingCycle: formData.get('billingCycle'),
            paymentMethod: formData.get('paymentMethod'),
            nextPaymentDate: formData.get('nextPaymentDate'),
            paymentDetails: {}
        };

        switch (payload.paymentMethod) {
            case 'CC':
                if (formData.get('cardLastFour')) {
                    payload.paymentDetails.cardLastFour = formData.get('cardLastFour');
                }
                break;
            case 'PayPal':
                if (formData.get('paypalEmail')) {
                    payload.paymentDetails.paypalEmail = formData.get('paypalEmail');
                }
                break;
            case 'Other':
                if (formData.get('otherPaymentMethod')) {
                    payload.paymentDetails.methodName = formData.get('otherPaymentMethod');
                }
                if (formData.get('otherPaymentLabel')) {
                    payload.paymentDetails.label = formData.get('otherPaymentLabel');
                }
                break;
            default:
                break;
        }

        try {
            let username = null;
            if (typeof window.getLoggedInUser === 'function') {
                const user = window.getLoggedInUser();
                if (user?.username) {
                    username = user.username;
                }
            }
            if (!username && localStorage.getItem('tabdock_user')) {
                const user = JSON.parse(localStorage.getItem('tabdock_user'));
                if (user?.username) {
                    username = user.username;
                }
            }

            if (!username) {
                throw new Error('ログインユーザー情報が取得できません。ログインしてください。');
            }

            const response = await fetch('/api/subscriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Username': encodeURIComponent(username)
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'サーバーエラーが発生しました');
            }

            const saved = await response.json().catch(() => null);

            await Swal.fire({
                title: '成功',
                text: 'サブスクリプションが正常に登録されました',
                icon: 'success',
                confirmButtonText: 'OK'
            });

            this.hideModal();

            const detail = {
                action: 'created',
                subscription: saved || payload
            };
            window.dispatchEvent(new CustomEvent('subscription:data-changed', { detail }));

            if (window.calendarManager?.refreshCalendar) {
                window.calendarManager.refreshCalendar({ keepSelection: true, forceReload: true }).catch(() => { });
            }

            await this.scheduleNotifications({ reschedule: true, immediate: true }).catch(() => { });
        } catch (error) {
            Swal.fire({
                title: 'エラー',
                text: error.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    async scheduleNotifications(options = {}) {
        const settings = {
            reschedule: false,
            immediate: false,
            ...options
        };

        try {
            if (settings.reschedule) {
                this.clearNotificationTimers();
                this.notifiedKeys.clear();
            }

            let username = null;
            if (typeof window.getLoggedInUser === 'function') {
                const user = window.getLoggedInUser();
                if (user?.username) username = user.username;
            }
            if (!username && localStorage.getItem('tabdock_user')) {
                const user = JSON.parse(localStorage.getItem('tabdock_user'));
                if (user?.username) username = user.username;
            }

            if (!username) {
                console.info('通知スケジュール: ログインユーザーが見つからないためスキップします');
                return 'skip';
            }

            const response = await fetch('/api/subscriptions/upcoming', {
                headers: { 'X-Username': encodeURIComponent(username) },
                credentials: 'include'
            });
            if (!response.ok) throw new Error('通知の取得に失敗しました');

            const subscriptions = await response.json();
            if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
                console.info('通知対象のサブスクリプションが見つかりませんでした。');
                this.cachedUpcoming = [];
                return 'skip';
            }

            this.cachedUpcoming = subscriptions;
            const now = new Date();

            subscriptions.forEach((sub) => {
                const paymentDate = new Date(sub.nextPaymentDate);
                if (Number.isNaN(paymentDate.getTime())) {
                    return;
                }

                const paymentStr = paymentDate.toISOString().split('T')[0];
                const scheduleReminder = (targetDate, label, icon) => {
                    if (now >= targetDate) return;
                    const timeout = setTimeout(() => {
                        if (typeof Swal !== 'undefined') {
                            const currency = sub.currency || '';
                            const amount = typeof sub.amount === 'number' ? sub.amount.toLocaleString() : (sub.amount ?? '');
                            Swal.fire({
                                title: 'サブスクリプション支払い予定',
                                html: `<p>${sub.serviceName || '名称未設定'}の支払いが${label}に予定されています。</p>` +
                                    `<p>金額: ${amount} ${currency}</p>`,
                                icon,
                                confirmButtonText: '了解'
                            });
                            const key = `timer:${label}:${sub.id || sub.serviceName || paymentStr}:${paymentStr}`;
                            this.notifiedKeys.add(key);
                        }
                        this.notificationTimers.delete(timeout);
                    }, targetDate.getTime() - now.getTime());
                    this.notificationTimers.add(timeout);
                };

                const threeDaysBefore = new Date(paymentDate);
                threeDaysBefore.setDate(paymentDate.getDate() - 3);
                scheduleReminder(threeDaysBefore, '3日後', 'info');

                const oneDayBefore = new Date(paymentDate);
                oneDayBefore.setDate(paymentDate.getDate() - 1);
                scheduleReminder(oneDayBefore, '明日', 'warning');
            });

            if (settings.immediate) {
                return await this.showImmediateNotifications();
            }

            return 'scheduled';
        } catch (error) {
            console.error('通知スケジュールの設定に失敗しました:', error);
            throw error;
        }
    }
}

const subscriptionManager = new SubscriptionManager();
if (typeof window !== 'undefined') {
    window.subscriptionManager = subscriptionManager;
}
export { subscriptionManager };

subscriptionManager.scheduleNotifications({ reschedule: true, immediate: true }).catch(() => { });

setInterval(() => {
    subscriptionManager.scheduleNotifications({ reschedule: true }).catch(() => { });
}, 3600000);
