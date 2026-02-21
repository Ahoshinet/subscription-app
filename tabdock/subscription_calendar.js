// 2025 TabDock: darui3018823 All rights reserved.
// All works created by darui3018823 associated with this repository are the intellectual property of darui3018823.
// Packages and other third-party materials used in this repository are subject to their respective licenses and copyrights.
// This code Version: 5.15.3_subsccal-r1

class SubscriptionCalendarManager {
    constructor() {
        this.subscriptions = [];
        this.filters = {
            keyword: '',
            status: 'all',
            billing: 'all'
        };
        this.initialize();
    }

    getDisplayWidth(str = '') {
        let width = 0;
        for (const ch of String(str)) {
            // ASCII (0x20-0x7E) および 半角カナ(FF61-FF9F) を半角、それ以外は全角扱い
            if (/[\u0020-\u007E\uFF61-\uFF9F]/.test(ch)) {
                width += 1;
            } else {
                width += 2;
            }
        }
        return width;
    }

    truncateByDisplayWidth(str = '', maxHalfWidth = 20) {
        if (this.getDisplayWidth(str) <= maxHalfWidth) return str;
        let acc = '';
        let w = 0;
        for (const ch of String(str)) {
            const cw = /[\u0020-\u007E\uFF61-\uFF9F]/.test(ch) ? 1 : 2;
            if (w + cw > maxHalfWidth) break;
            acc += ch;
            w += cw;
        }
        return acc + '...';
    }

    async initialize() {
        await this.loadSubscriptions();
        this.registerGlobalListeners();
        this.setupSubscriptionList();
        this.setupAutoPaymentDateUpdate();
    }

    async loadSubscriptions() {
        try {
            const username = this.getUsername();
            if (!username) return;

            const response = await fetch('/api/subscriptions/list', {
                headers: { 'X-Username': encodeURIComponent(username) }
            });

            if (!response.ok) throw new Error('サブスクリプション取得エラー');
            const data = await response.json().catch(() => null);
            this.subscriptions = Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('サブスクリプション読み込みエラー:', error);
            this.subscriptions = [];
        }
    }

    getUsername() {
        if (window.getLoggedInUser) {
            const user = window.getLoggedInUser();
            if (user && user.username) return user.username;
        }
        const stored = localStorage.getItem('tabdock_user');
        if (stored) {
            const user = JSON.parse(stored);
            if (user && user.username) return user.username;
        }
        return null;
    }

    registerGlobalListeners() {
        window.addEventListener('calendar:schedule-rendered', (event) => {
            const { date, container } = event.detail || {};
            this.addSubscriptionToSchedule(date, container);
        });

        window.addEventListener('subscription:data-changed', () => {
            this.handleSubscriptionsUpdated();
        });

        window.addEventListener('account:modal-ready', () => {
            this.attachManageButton();
        });
    }

    addSubscriptionToSchedule(dateStr, container) {
        if (!Array.isArray(this.subscriptions) || this.subscriptions.length === 0) return;
        const subscriptionsForDate = this.subscriptions.filter(sub => {
            if (!sub || !sub.nextPaymentDate) return false;
            // 無効なサブスクリプションは表示しない
            if (sub.status !== 'active') return false;
            const paymentDate = new Date(sub.nextPaymentDate);
            if (Number.isNaN(paymentDate.getTime())) return false;
            return paymentDate.toISOString().split('T')[0] === dateStr;
        });

        if (subscriptionsForDate.length === 0) return;

        const scheduleList = container || document.getElementById('scheduleList');
        if (!scheduleList) return;

        const groupAttr = `subsc-${dateStr}`;
        scheduleList.querySelectorAll(`[data-subsc-group="${groupAttr}"]`).forEach((el) => el.remove());
        scheduleList.querySelectorAll(`[data-subsc-header="${groupAttr}"]`).forEach((el) => el.remove());

        const header = document.createElement('div');
        header.className = 'mt-4 mb-2 font-semibold text-sm text-white/70';
        header.textContent = 'サブスクリプション支払い予定';
        header.dataset.subscHeader = groupAttr;
        scheduleList.appendChild(header);

        const needsToggle = subscriptionsForDate.length >= 4;
        const createdLis = [];

        subscriptionsForDate.forEach((sub, index) => {
            const li = document.createElement('li');
            li.classList.add('mb-2', 'subscription-item');
            li.dataset.subscGroup = groupAttr;

            if (needsToggle && index >= 2) {
                li.classList.add('hidden');
            }

            const content = document.createElement('div');
            content.className = 'flex justify-between items-start';
            content.innerHTML = `
                <div class="flex-grow">
                    <div class="text-sm font-semibold">${this.truncateByDisplayWidth(sub.serviceName || '', 20)}</div>
                    <div class="text-xs text-white/70">
                        ${sub.amount} ${sub.currency} / ${this.formatBillingCycle(sub.billingCycle)}
                    </div>
                </div>
                <div class="ml-2">
                    <button class="text-xs text-blue-400 hover:underline subscription-detail-btn">
                        詳細
                    </button>
                </div>
            `;

            content.querySelector('.subscription-detail-btn').addEventListener('click', () => {
                this.showSubscriptionDetail(sub);
            });

            li.appendChild(content);
            scheduleList.appendChild(li);
            createdLis.push(li);
        });

        if (needsToggle) {
            const moreLi = document.createElement('li');
            moreLi.className = 'mb-2';
            moreLi.dataset.subscGroup = groupAttr;
            const btn = document.createElement('button');
            btn.className = 'text-blue-400 hover:underline text-left text-xs';
            btn.textContent = '+ もっと見る...';

            let expanded = false;
            btn.addEventListener('click', () => {
                expanded = !expanded;
                const groupItems = Array.from(scheduleList.querySelectorAll(`li.subscription-item[data-subsc-group="${groupAttr}"]`));
                groupItems.forEach((el, idx) => {
                    if (idx >= 2) el.classList.toggle('hidden', !expanded);
                });
                btn.textContent = expanded ? '▲ 一部のみ表示' : '+ もっと見る...';
            });

            moreLi.appendChild(btn);

            const second = createdLis[1];
            if (second && second.nextSibling) {
                scheduleList.insertBefore(moreLi, second.nextSibling);
            } else {
                scheduleList.appendChild(moreLi);
            }
        }
    }

    setupSubscriptionList() {
        this.attachManageButton();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.attachManageButton(), { once: true });
        }
    }

    attachManageButton() {
        const button = document.getElementById('subscriptionManageBtn');
        if (!button || button.dataset.bound === 'true') return;

        button.dataset.bound = 'true';
        button.addEventListener('click', (event) => {
            event.preventDefault();
            this.showSubscriptionListModal();
        });
    }

    async handleSubscriptionsUpdated() {
        await this.loadSubscriptions();

        const listModal = document.getElementById('subscriptionListModal');
        if (listModal) {
            await this.updateSubscriptionList({ reload: false });
        }

        const selectedDate = window.selectedDate;
        if (selectedDate && typeof window.renderSchedule === 'function') {
            window.renderSchedule(selectedDate);
        }

        window.dispatchEvent(new CustomEvent('subscription:calendar-regenerated', {
            detail: { source: 'subscriptionCalendar' }
        }));
    }

    async showSubscriptionListModal() {
        await this.loadSubscriptions();

        const monthlyCurrencies = this.calculateCurrencyTotals('monthly');
        const yearlyCurrencies = this.calculateCurrencyTotals('yearly');

        const modalHtml = `
            <div class="td-modal-panel td-modal-4xl max-h-screen overflow-hidden flex flex-col">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold">サブスクリプション一覧</h2>
                    <div class="flex gap-4">
                        <div class="text-right">
                            <div class="text-sm text-white/70">月額合計</div>
                            <div class="font-semibold text-lg text-green-400">
                                ${this.formatCurrencyTotals(monthlyCurrencies)}
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm text-white/70">年額合計</div>
                            <div class="font-semibold text-lg text-green-400">
                                ${this.formatCurrencyTotals(yearlyCurrencies)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4 bg-black/15 rounded-lg p-4">
                    <div class="grid gap-3 md:grid-cols-3">
                        <div>
                            <label class="block text-xs text-white/70 mb-1">キーワード</label>
                            <input id="subscriptionFilterText" type="text" value="${this.filters.keyword}" placeholder="サービス名で絞り込み"
                                class="w-full rounded bg-black/30 border border-white/10 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                        </div>
                        <div>
                            <label class="block text-xs text-white/70 mb-1">ステータス</label>
                            <select id="subscriptionFilterStatus" class="w-full rounded bg-black/30 border border-white/10 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
                                <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>すべて</option>
                                <option value="active" ${this.filters.status === 'active' ? 'selected' : ''}>有効</option>
                                <option value="inactive" ${this.filters.status === 'inactive' ? 'selected' : ''}>無効</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs text-white/70 mb-1">請求サイクル</label>
                            <select id="subscriptionFilterBilling" class="w-full rounded bg-black/30 border border-white/10 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
                                <option value="all" ${this.filters.billing === 'all' ? 'selected' : ''}>すべて</option>
                                <option value="monthly" ${this.filters.billing === 'monthly' ? 'selected' : ''}>月額</option>
                                <option value="yearly" ${this.filters.billing === 'yearly' ? 'selected' : ''}>年額</option>
                                <option value="weekly" ${this.filters.billing === 'weekly' ? 'selected' : ''}>週次</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="subscriptionListContent" class="space-y-3 mb-6 flex-1">
                    ${this.getFilteredSubscriptions().map(sub => `
                        <div class="bg-black/20 p-4 rounded-lg hover:bg-black/30 cursor-pointer transition-colors subscription-item group" data-id="${sub.id || ''}">
                            <div class="flex justify-between items-start">
                                <div class="flex-grow">
                                    <div class="font-semibold text-lg flex items-center">
                                        ${sub.serviceName || ''}
                                        ${sub.status === 'active' ?
                '<span class="ml-2 text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">有効</span>' :
                '<span class="ml-2 text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">無効</span>'
            }
                                    </div>
                                    <div class="text-sm text-white/70 mt-1">
                                        プラン: ${sub.planName || '未設定'}
                                    </div>
                                    <div class="text-sm text-white/70">
                                        次回支払: ${sub.nextPaymentDate ? new Date(sub.nextPaymentDate).toLocaleDateString() : '未設定'}
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-lg font-semibold">${sub.amount || 0} ${sub.currency || 'JPY'}</div>
                                    <div class="text-sm text-white/70">${this.formatBillingCycle(sub.billingCycle || 'monthly')}</div>
                                    <button class="mt-2 px-3 py-1 text-xs text-blue-400 hover:bg-blue-400/10 rounded-full">
                                        詳細を表示 →
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="border-t border-gray-700 pt-4">
                    <div class="flex justify-between">
                        <button id="addNewSubscription" class="px-6 py-2 bg-green-600 hover:bg-green-500 rounded transition-colors flex items-center">
                            <span class="text-lg mr-1">+</span>
                            <span>新規追加</span>
                        </button>
                        <button id="closeSubscriptionList" class="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors">
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        `;

        const subscriptionListModal = document.createElement('div');
        subscriptionListModal.id = 'subscriptionListModal';
        subscriptionListModal.className = 'td-modal-overlay z-[70]';
        subscriptionListModal.innerHTML = modalHtml;

        document.body.appendChild(subscriptionListModal);
        this.applyListScrollLimit(subscriptionListModal);

        const textInput = subscriptionListModal.querySelector('#subscriptionFilterText');
        const statusSelect = subscriptionListModal.querySelector('#subscriptionFilterStatus');
        const billingSelect = subscriptionListModal.querySelector('#subscriptionFilterBilling');

        textInput?.addEventListener('input', (event) => {
            this.filters.keyword = event.target.value;
            void this.updateSubscriptionList({ reload: false });
        });

        statusSelect?.addEventListener('change', (event) => {
            this.filters.status = event.target.value;
            void this.updateSubscriptionList({ reload: false });
        });

        billingSelect?.addEventListener('change', (event) => {
            this.filters.billing = event.target.value;
            void this.updateSubscriptionList({ reload: false });
        });

        document.getElementById('closeSubscriptionList').addEventListener('click', () => {
            document.body.removeChild(subscriptionListModal);
        });

        const addButton = document.getElementById('addNewSubscription');
        addButton?.addEventListener('click', () => {
            document.body.removeChild(subscriptionListModal);
            const subscriptionManager = window.subscriptionManager;
            if (subscriptionManager) {
                subscriptionManager.showAddModal();
            }
        });

        const subscriptionItems = subscriptionListModal.querySelectorAll('.subscription-item');
        subscriptionItems.forEach(item => {
            item.addEventListener('click', () => {
                const subId = item.dataset.id;
                const subscription = this.subscriptions.find(s => String(s.id) === String(subId));
                if (subscription) {
                    this.showSubscriptionDetail(subscription);
                }
            });

            const detailButton = item.querySelector('.text-blue-400');
            if (detailButton) {
                detailButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const subId = item.dataset.id;
                    const subscription = this.subscriptions.find(s => String(s.id) === String(subId));
                    if (subscription) {
                        this.showSubscriptionDetail(subscription);
                    }
                });
            }
        });
    }

    formatBillingCycle(cycle) {
        return {
            'monthly': '月額',
            'yearly': '年額'
        }[cycle] || cycle;
    }

    calculateCurrencyTotals(billingCycle) {
        const currencyTotals = {};

        this.subscriptions
            .filter(sub => sub.billingCycle === billingCycle && sub.status === 'active')
            .forEach(sub => {
                const currency = sub.currency || 'JPY';
                const amount = parseFloat(sub.amount) || 0;

                if (!currencyTotals[currency]) {
                    currencyTotals[currency] = 0;
                }
                currencyTotals[currency] += amount;
            });

        return currencyTotals;
    }

    formatCurrencyTotals(currencyTotals) {
        const currencies = Object.keys(currencyTotals);

        if (currencies.length === 0) {
            return '0 JPY';
        }

        if (currencies.length === 1) {
            const currency = currencies[0];
            return `${currencyTotals[currency].toLocaleString()} ${currency}`;
        }

        return currencies
            .sort()
            .map(currency => `${currencyTotals[currency].toLocaleString()} ${currency}`)
            .join('   /   ');
    }

    showSubscriptionDetail(sub) {
        let paymentDetails = {};
        try {
            paymentDetails = sub.paymentDetails ? (
                typeof sub.paymentDetails === 'string' ?
                    JSON.parse(sub.paymentDetails) :
                    sub.paymentDetails
            ) : {};
        } catch (error) {
            console.warn('支払い詳細の解析に失敗しました:', error);
        }
        const detailsHTML = this.formatPaymentDetails(paymentDetails, sub.paymentMethod);

        const continuedFrom = (() => {
            const createdAt = sub.createdAt ? new Date(sub.createdAt) : null;
            if (!createdAt || isNaN(createdAt.getTime())) {
                return '開始日情報なし';
            }
            return createdAt.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' });
        })();

        const modalHtml = `
            <div class="td-modal-panel td-modal-lg max-h-screen overflow-y-auto">
                <h2 class="text-xl font-bold mb-6">${sub.serviceName} - ${sub.planName}</h2>

                <div class="space-y-6">
                    <div class="bg-black/20 rounded-lg p-4">
                        <h3 class="text-lg font-semibold mb-3">支払い情報</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <div class="text-white/70 text-sm">金額</div>
                                <div class="text-lg">${sub.amount} ${sub.currency}</div>
                            </div>
                            <div>
                                <div class="text-white/70 text-sm">支払いサイクル</div>
                                <div class="text-lg">${this.formatBillingCycle(sub.billingCycle)}</div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-black/20 rounded-lg p-4">
                        <h3 class="text-lg font-semibold mb-3">次回支払い</h3>
                        <div class="text-lg flex items-center justify-between gap-3">
                            <span>${new Date(sub.nextPaymentDate).toLocaleDateString()}</span>
                            <span class="text-sm text-white/70">継続開始: ${continuedFrom}</span>
                        </div>
                    </div>

                    <div class="bg-black/20 rounded-lg p-4">
                        <h3 class="text-lg font-semibold mb-3">支払い方法</h3>
                        <div>
                            <div class="text-lg" id="paymentMethodContainer">
                                ${this.formatPaymentMethod(sub.paymentMethod)}
                            </div>
                            ${detailsHTML}
                        </div>
                    </div>

                    <div class="bg-black/20 rounded-lg p-4">
                        <h3 class="text-lg font-semibold mb-3">ステータス</h3>
                        <div class="flex items-center justify-between">
                            <div class="text-lg ${sub.status === 'active' ? 'text-green-400' : 'text-red-400'}">
                                ${this.formatStatus(sub.status)}
                            </div>
                            <button id="toggleStatus" class="px-4 py-2 ${sub.status === 'active' ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'} rounded transition-colors text-sm">
                                ${sub.status === 'active' ? '無効にする' : '有効にする'}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="flex justify-between mt-6 border-t border-gray-700 pt-4">
                    <div class="space-x-2">
                        <button id="editSubscription" class="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors">
                            編集
                        </button>
                        <button id="deleteSubscription" class="px-6 py-2 bg-red-700 hover:bg-red-600 rounded transition-colors">
                            削除
                        </button>
                    </div>
                    <button id="closeSubscriptionDetail" class="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors">
                        閉じる
                    </button>
                </div>
            </div>
        `;

        const detailModal = document.createElement('div');
        detailModal.id = 'subscriptionDetailModal';
        detailModal.className = 'td-modal-overlay z-[80]';
        detailModal.innerHTML = modalHtml;

        document.body.appendChild(detailModal);

        document.getElementById('closeSubscriptionDetail').addEventListener('click', () => {
            document.body.removeChild(detailModal);
        });

        document.getElementById('editSubscription').addEventListener('click', () => {
            document.body.removeChild(detailModal);
            this.handleEdit(sub);
        });

        const toggleBtn = document.getElementById('toggleStatus');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', async () => {
                await this.handleToggleStatus(sub, detailModal);
            });
        }

        const deleteBtn = document.getElementById('deleteSubscription');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                await this.handleDelete(sub, detailModal);
            });
        }
    }

    formatPaymentMethod(method) {
        const methods = {
            'CC': {
                text: 'クレジットカード',
                logo: '/home/assets/payment/credit-card.png',
                class: 'h-6 inline-block mr-2'
            },
            'PayPal': {
                text: 'PayPal',
                logo: '/home/assets/payment/pp_h_rgb.png',
                class: 'h-6 inline-block mr-2'
            },
            'GooglePay': {
                text: 'Google Pay',
                logo: '/home/assets/payment/google-pay-mark_800.svg',
                class: 'h-6 inline-block mr-2'
            },
            'ApplePay': {
                text: 'Apple Pay',
                logo: '/home/assets/payment/Apple_Pay_Mark_RGB_041619.svg',
                class: 'h-6 inline-block mr-2'
            },
            'PayPay': {
                text: 'PayPay',
                logo: '/home/assets/payment/paypay_3_rgb.png',
                class: 'h-6 inline-block mr-2'
            },
            'AmazonPay': {
                text: 'Amazon Pay',
                logo: '/home/assets/payment/Black-XL.png',
                class: 'h-6 inline-block mr-2'
            },
            'Other': {
                text: 'その他'
            }
        };

        const methodInfo = methods[method] || { text: method };

        if (methodInfo.logo) {
            return `
                <div class="flex items-center">
                    <img src="${methodInfo.logo}" alt="${methodInfo.text}" class="${methodInfo.class}" onerror="this.style.display='none'">
                    <span>${methodInfo.text}</span>
                </div>
            `;
        }

        return methodInfo.text;
    }

    formatPaymentDetails(details, method) {
        if (!details || Object.keys(details).length === 0) return '';

        let html = '<div class="text-sm text-gray-400 mt-1">';
        if (method === 'CC' && details.cardLastFour) {
            html += `末尾4桁: ${details.cardLastFour}`;
        } else if (method === 'PayPal' && details.paypalEmail) {
            html += `メール: ${details.paypalEmail}`;
        } else if (method === 'Other') {
            if (details.methodName) html += details.methodName;
            if (details.label) html += ` (${details.label})`;
        }
        html += '</div>';
        return html;
    }

    formatStatus(status) {
        const statuses = {
            'active': '有効',
            'cancelled': 'キャンセル済み',
            'expired': '期限切れ'
        };
        return statuses[status] || status;
    }

    async handleCancellation(sub) {
        const result = await Swal.fire({
            title: 'サブスクリプションのキャンセル',
            text: `${sub.serviceName}のサブスクリプションをキャンセルしますか？`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'キャンセル',
            confirmButtonColor: '#dc3545',
            cancelButtonText: '戻る'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/subscriptions/status?id=${sub.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Username': encodeURIComponent(this.getUsername())
                    },
                    body: JSON.stringify({ status: 'cancelled' })
                });

                if (!response.ok) throw new Error('キャンセル処理に失敗しました');

                await Swal.fire('完了', 'サブスクリプションはキャンセルされました', 'success');
                await this.updateSubscriptionList();
            } catch (error) {
                Swal.fire('エラー', error.message, 'error');
            }
        }
    }

    async handleToggleStatus(sub, detailModalEl) {
        const newStatus = sub.status === 'active' ? 'inactive' : 'active';
        const actionText = newStatus === 'active' ? '有効化' : '無効化';

        const result = await Swal.fire({
            title: `サブスクリプションの${actionText}`,
            html: `「<b>${sub.serviceName}</b>」を${actionText}しますか？<br><small>${newStatus === 'inactive' ? 'カレンダーの支払い予定には表示されなくなります。' : 'カレンダーの支払い予定に表示されます。'}</small>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: actionText,
            confirmButtonColor: newStatus === 'active' ? '#28a745' : '#ffc107',
            cancelButtonText: 'キャンセル'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`/api/subscriptions/status?id=${sub.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Username': encodeURIComponent(this.getUsername())
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error(`${actionText}処理に失敗しました`);

            await Swal.fire('完了', `サブスクリプションを${actionText}しました`, 'success');

            // データを再読み込みして画面を更新
            await this.loadSubscriptions();
            await this.updateSubscriptionList({ reload: false });

            // 詳細モーダルを閉じる
            if (detailModalEl && document.body.contains(detailModalEl)) {
                document.body.removeChild(detailModalEl);
            }

            // カレンダーを更新
            const selectedDate = window.selectedDate;
            if (selectedDate && typeof window.renderSchedule === 'function') {
                window.renderSchedule(selectedDate);
            }
        } catch (error) {
            Swal.fire('エラー', error.message, 'error');
        }
    }

    async handleDelete(sub, detailModalEl) {
        const result = await Swal.fire({
            title: 'サブスクリプションの削除',
            html: `このサブスクリプション「<b>${sub.serviceName}</b>」を完全に削除します。<br>この操作は元に戻せません。実行しますか？`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '削除する',
            confirmButtonColor: '#d33',
            cancelButtonText: '戻る'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`/api/subscriptions/delete?id=${sub.id}`, {
                method: 'DELETE',
                headers: {
                    'X-Username': encodeURIComponent(this.getUsername())
                }
            });

            if (!response.ok) {
                const msg = await response.text();
                throw new Error(msg || '削除に失敗しました');
            }

            await Swal.fire('削除完了', 'サブスクリプションを削除しました', 'success');

            await this.loadSubscriptions();
            await this.updateSubscriptionList();
            if (detailModalEl && document.body.contains(detailModalEl)) {
                document.body.removeChild(detailModalEl);
            }
        } catch (error) {
            Swal.fire('エラー', error.message, 'error');
        }
    }

    async updateSubscriptionList(options = {}) {
        const { reload = true } = options;
        if (reload) {
            await this.loadSubscriptions();
        }

        const listModal = document.getElementById('subscriptionListModal');
        if (!listModal) return;

        const container = listModal.querySelector('#subscriptionListContent');
        if (!container) return;

        const filtered = this.getFilteredSubscriptions();

        if (filtered.length === 0) {
            container.innerHTML = `<div class="text-white/60 text-sm">条件に一致するサブスクリプションがありません。</div>`;
            this.applyListScrollLimit(listModal);
            return;
        }

        container.innerHTML = filtered.map(sub => `
            <div class="bg-black/20 p-4 rounded-lg hover:bg-black/30 cursor-pointer transition-colors subscription-item group" data-id="${sub.id || ''}">
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        <div class="font-semibold text-lg flex items-center">
                            ${sub.serviceName || ''}
                            ${sub.status === 'active' ?
                '<span class="ml-2 text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">有効</span>' :
                '<span class="ml-2 text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">無効</span>'
            }
                        </div>
                        <div class="text-sm text-white/70 mt-1">
                            プラン: ${sub.planName || '未設定'}
                        </div>
                        <div class="text-sm text-white/70">
                            次回支払: ${sub.nextPaymentDate ? new Date(sub.nextPaymentDate).toLocaleDateString() : '未設定'}
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-semibold">${sub.amount || 0} ${sub.currency || 'JPY'}</div>
                        <div class="text-sm text-white/70">${this.formatBillingCycle(sub.billingCycle || 'monthly')}</div>
                        <button class="mt-2 px-3 py-1 text-xs text-blue-400 hover:bg-blue-400/10 rounded-full">
                            詳細を表示 →
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        const subscriptionItems = listModal.querySelectorAll('.subscription-item');
        subscriptionItems.forEach(item => {
            item.addEventListener('click', () => {
                const subId = item.dataset.id;
                const subscription = this.subscriptions.find(s => String(s.id) === String(subId));
                if (subscription) {
                    this.showSubscriptionDetail(subscription);
                }
            });

            const detailButton = item.querySelector('.text-blue-400');
            if (detailButton) {
                detailButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const subId = item.dataset.id;
                    const subscription = this.subscriptions.find(s => String(s.id) === String(subId));
                    if (subscription) {
                        this.showSubscriptionDetail(subscription);
                    }
                });
            }
        });

        this.applyListScrollLimit(listModal);
    }

    getFilteredSubscriptions() {
        const keyword = this.filters.keyword.trim().toLowerCase();
        const status = this.filters.status;
        const billing = this.filters.billing;

        return this.subscriptions.filter(sub => {
            const name = (sub.serviceName || '').toLowerCase();
            const plan = (sub.planName || '').toLowerCase();
            if (keyword && !name.includes(keyword) && !plan.includes(keyword)) {
                return false;
            }

            if (status !== 'all') {
                const currentStatus = (sub.status || '').toLowerCase();
                if (status === 'inactive') {
                    // 「無効」は active 以外のすべて
                    if (currentStatus === 'active') {
                        return false;
                    }
                } else {
                    // 「有効」など特定のステータス
                    if (currentStatus !== status) {
                        return false;
                    }
                }
            }

            if (billing !== 'all') {
                const cycle = (sub.billingCycle || '').toLowerCase();
                if (cycle !== billing) {
                    return false;
                }
            }

            return true;
        });
    }

    applyListScrollLimit(rootEl) {
        try {
            const listEl = rootEl.querySelector('#subscriptionListContent');
            const items = listEl ? Array.from(listEl.querySelectorAll('.subscription-item')) : [];
            if (!listEl) return;

            listEl.style.maxHeight = '';
            listEl.classList.remove('overflow-y-auto');

            if (items.length > 3) {
                const firstTop = items[0].offsetTop;
                const fourthTop = items[3].offsetTop;
                let desired = fourthTop - firstTop;
                if (!desired || desired <= 0) {
                    desired = items.slice(0, 3).reduce((sum, el) => sum + el.getBoundingClientRect().height, 0);
                }
                listEl.style.maxHeight = `${Math.max(120, Math.round(desired))}px`;
                listEl.classList.add('overflow-y-auto');
            } else {
                listEl.classList.add('overflow-y-auto');
            }
        } catch (e) {
            console.warn('サブスクリプションリストの高さ計算に失敗:', e);
        }
    }

    async handleEdit(sub) {
        const modalHtml = `
            <div class="td-modal-panel td-modal-lg max-h-screen overflow-y-auto">
                <h2 class="text-xl font-bold mb-6">サブスクリプション編集</h2>
                
                <form id="editSubscriptionForm" class="space-y-6">
                    <div class="bg-black/20 rounded-lg p-4">
                        <div class="grid gap-4">
                            <div>
                                <label class="block text-white/70 text-sm mb-1">サービス名</label>
                                <input type="text" name="serviceName" value="${sub.serviceName}" 
                                    class="w-full bg-gray-700 text-white rounded px-3 py-2">
                            </div>
                            <div>
                                <label class="block text-white/70 text-sm mb-1">プラン名</label>
                                <input type="text" name="planName" value="${sub.planName}" 
                                    class="w-full bg-gray-700 text-white rounded px-3 py-2">
                            </div>
                        </div>
                    </div>

                    <div class="bg-black/20 rounded-lg p-4">
                        <div class="grid gap-4">
                            <div>
                                <label class="block text-white/70 text-sm mb-1">支払い金額</label>
                                <input type="number" name="amount" value="${sub.amount}" 
                                    class="w-full bg-gray-700 text-white rounded px-3 py-2">
                            </div>
                            <div>
                                <label class="block text-white/70 text-sm mb-1">通貨</label>
                                <select name="currency" class="w-full bg-gray-700 text-white rounded px-3 py-2">
                                    <option value="JPY" ${sub.currency === 'JPY' ? 'selected' : ''}>JPY</option>
                                    <option value="USD" ${sub.currency === 'USD' ? 'selected' : ''}>USD</option>
                                    <option value="EUR" ${sub.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-white/70 text-sm mb-1">支払いサイクル</label>
                                <select name="billingCycle" class="w-full bg-gray-700 text-white rounded px-3 py-2">
                                    <option value="monthly" ${sub.billingCycle === 'monthly' ? 'selected' : ''}>月額</option>
                                    <option value="yearly" ${sub.billingCycle === 'yearly' ? 'selected' : ''}>年額</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="bg-black/20 rounded-lg p-4">
                        <div class="grid gap-4" id="paymentFieldsGrid">
                            <div>
                                <label class="block text-white/70 text-sm mb-1">支払い方法</label>
                                <select name="paymentMethod" class="w-full bg-gray-700 text-white rounded px-3 py-2" id="paymentMethodSelect">
                                    <option value="CC" ${sub.paymentMethod === 'CC' ? 'selected' : ''}>クレジットカード</option>
                                    <option value="PayPal" ${sub.paymentMethod === 'PayPal' ? 'selected' : ''}>PayPal</option>
                                    <option value="GooglePay" ${sub.paymentMethod === 'GooglePay' ? 'selected' : ''}>Google Pay</option>
                                    <option value="ApplePay" ${sub.paymentMethod === 'ApplePay' ? 'selected' : ''}>Apple Pay</option>
                                    <option value="PayPay" ${sub.paymentMethod === 'PayPay' ? 'selected' : ''}>PayPay</option>
                                    <option value="AmazonPay" ${sub.paymentMethod === 'AmazonPay' ? 'selected' : ''}>Amazon Pay</option>
                                    <option value="Other" ${sub.paymentMethod === 'Other' ? 'selected' : ''}>その他</option>
                                </select>
                            </div>
                            <div id="additionalPaymentFields"></div>
                            <div id="nextPaymentDateContainer">
                                <label class="block text-white/70 text-sm mb-1">次回支払い日</label>
                                <input type="date" name="nextPaymentDate" value="${sub.nextPaymentDate.split('T')[0]}" 
                                    class="w-full bg-gray-700 text-white rounded px-3 py-2">
                            </div>
                        </div>
                    </div>
                </form>

                <div class="flex justify-between items-center mt-6 border-t border-gray-700 pt-4">
                    <div class="flex items-center gap-2">
                        <button id="saveSubscriptionEdit" class="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors">
                            保存
                        </button>
                        <button id="cancelSubscriptionFromEdit" class="px-6 py-2 bg-red-600 hover:bg-red-500 rounded transition-colors">
                            キャンセル
                        </button>
                    </div>
                    <button id="closeEditForm" class="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors">
                        閉じる
                    </button>
                </div>
            </div>
        `;

        const editModal = document.createElement('div');
        editModal.id = 'subscriptionEditModal';
        editModal.className = 'td-modal-overlay z-[80]';
        editModal.innerHTML = modalHtml;

        document.body.appendChild(editModal);

        let paymentDetails = {};
        try {
            if (sub.paymentDetails) {
                paymentDetails = typeof sub.paymentDetails === 'string' ?
                    JSON.parse(sub.paymentDetails) :
                    sub.paymentDetails;
            }
            console.log('Processed payment details:', paymentDetails);
        } catch (error) {
            console.error('Payment details parse error:', error);
            paymentDetails = {};
        }

        function updatePaymentFields() {
            const paymentMethodSelect = document.getElementById('paymentMethodSelect');
            const additionalFields = document.getElementById('additionalPaymentFields');
            const nextPaymentDateContainer = document.getElementById('nextPaymentDateContainer');
            const paymentFieldsGrid = document.getElementById('paymentFieldsGrid');

            if (!paymentMethodSelect || !additionalFields || !nextPaymentDateContainer || !paymentFieldsGrid) {
                console.error('Required elements not found');
                return;
            }

            const method = paymentMethodSelect.value;
            const details = paymentDetails || {};

            let existingNoteValue = '';
            const existingNoteInput = document.querySelector('input[name="label"]');
            if (existingNoteInput) existingNoteValue = existingNoteInput.value;

            let existingNextDateValue = '';
            const existingNextDateInput = nextPaymentDateContainer.querySelector('input[name="nextPaymentDate"]');
            if (existingNextDateInput) existingNextDateValue = existingNextDateInput.value;

            additionalFields.innerHTML = '';

            paymentFieldsGrid.className = 'grid gap-4';

            nextPaymentDateContainer.className = '';
            nextPaymentDateContainer.innerHTML = `
                <label class="block text-white/70 text-sm mb-1">次回支払い日</label>
                <input type="date" name="nextPaymentDate" value="${existingNextDateValue || sub.nextPaymentDate.split('T')[0]}" 
                    class="w-full bg-gray-700 text-white rounded px-3 py-2">
            `;

            const existingNoteContainer = document.getElementById('noteFieldContainer');
            if (existingNoteContainer && method !== 'Other') {
                existingNoteContainer.remove();
            }

            switch (method) {
                case 'CC': {
                    const ccDiv = document.createElement('div');
                    ccDiv.className = 'grid gap-4';
                    const ccInputDiv = document.createElement('div');
                    const ccLabel = document.createElement('label');
                    ccLabel.className = 'block text-white/70 text-sm mb-1';
                    ccLabel.textContent = 'カード末尾4桁';
                    const ccInput = document.createElement('input');
                    ccInput.type = 'text';
                    ccInput.name = 'cardLastFour';
                    ccInput.pattern = '[0-9]{4}';
                    ccInput.maxLength = 4;
                    ccInput.value = details.cardLastFour || '';
                    ccInput.className = 'w-full bg-gray-700 text-white rounded px-3 py-2';
                    ccInput.placeholder = '1234';
                    ccInputDiv.appendChild(ccLabel);
                    ccInputDiv.appendChild(ccInput);
                    ccDiv.appendChild(ccInputDiv);
                    additionalFields.appendChild(ccDiv);
                    break;
                }
                case 'PayPal': {
                    const ppDiv = document.createElement('div');
                    ppDiv.className = 'grid gap-4';
                    const ppInputDiv = document.createElement('div');
                    const ppLabel = document.createElement('label');
                    ppLabel.className = 'block text-white/70 text-sm mb-1';
                    ppLabel.textContent = 'PayPalメールアドレス';
                    const ppInput = document.createElement('input');
                    ppInput.type = 'email';
                    ppInput.name = 'paypalEmail';
                    ppInput.value = details.paypalEmail || '';
                    ppInput.className = 'w-full bg-gray-700 text-white rounded px-3 py-2';
                    ppInput.placeholder = 'example@example.com';
                    ppInputDiv.appendChild(ppLabel);
                    ppInputDiv.appendChild(ppInput);
                    ppDiv.appendChild(ppInputDiv);
                    additionalFields.appendChild(ppDiv);
                    break;
                }
                case 'Other': {
                    paymentFieldsGrid.className = 'grid grid-cols-2 gap-4';

                    const methodDiv = document.createElement('div');
                    const methodLabel = document.createElement('label');
                    methodLabel.className = 'block text-white/70 text-sm mb-1';
                    methodLabel.textContent = '支払い方法名';
                    const methodInput = document.createElement('input');
                    methodInput.type = 'text';
                    methodInput.name = 'methodName';
                    methodInput.value = details.methodName || '';
                    methodInput.className = 'w-full bg-gray-700 text-white rounded px-3 py-2';
                    methodInput.placeholder = '銀行振込など';
                    methodDiv.appendChild(methodLabel);
                    methodDiv.appendChild(methodInput);
                    additionalFields.appendChild(methodDiv);

                    let noteDiv = document.getElementById('noteFieldContainer');
                    if (!noteDiv) {
                        noteDiv = document.createElement('div');
                        noteDiv.id = 'noteFieldContainer';
                    } else {
                        noteDiv.innerHTML = '';
                    }
                    const noteLabel = document.createElement('label');
                    noteLabel.className = 'block text-white/70 text-sm mb-1';
                    noteLabel.textContent = '備考';
                    const noteInput = document.createElement('input');
                    noteInput.type = 'text';
                    noteInput.name = 'label';
                    noteInput.value = existingNoteValue || details.label || '';
                    noteInput.className = 'w-full bg-gray-700 text-white rounded px-3 py-2';
                    noteInput.placeholder = 'メモ';
                    noteDiv.appendChild(noteLabel);
                    noteDiv.appendChild(noteInput);

                    if (!noteDiv.parentElement) {
                        paymentFieldsGrid.insertBefore(noteDiv, nextPaymentDateContainer.nextSibling);
                    } else if (noteDiv.parentElement !== paymentFieldsGrid) {
                        noteDiv.parentElement.removeChild(noteDiv);
                        paymentFieldsGrid.insertBefore(noteDiv, nextPaymentDateContainer.nextSibling);
                    }
                    break;
                }
            }
        }

        document.getElementById('closeEditForm').addEventListener('click', () => {
            document.body.removeChild(editModal);
        });

        const cancelBtn = document.getElementById('cancelSubscriptionFromEdit');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', async () => {
                const beforeStatus = sub.status;
                await this.handleCancellation(sub);
                try {
                    await this.loadSubscriptions();
                    const latest = this.subscriptions.find(s => s.id === sub.id);
                    if (latest && latest.status === 'cancelled' && beforeStatus !== 'cancelled') {
                        if (document.body.contains(editModal)) {
                            document.body.removeChild(editModal);
                        }
                        this.showSubscriptionDetail(latest);
                    }
                } catch (e) {
                    console.warn('解約後の状態確認に失敗: ', e);
                }
            });
        }

        const paymentMethodSelect = document.getElementById('paymentMethodSelect');
        if (paymentMethodSelect) {
            paymentMethodSelect.addEventListener('change', updatePaymentFields);
            setTimeout(updatePaymentFields, 100);
        }

        document.getElementById('saveSubscriptionEdit').addEventListener('click', async () => {
            const form = document.getElementById('editSubscriptionForm');
            const formData = new FormData(form);
            const updatedData = Object.fromEntries(formData.entries());

            try {
                if (updatedData.amount) {
                    updatedData.amount = parseFloat(updatedData.amount);
                    if (isNaN(updatedData.amount)) {
                        throw new Error('支払い金額は有効な数値である必要があります');
                    }
                }

                console.log('Form data before processing:', updatedData);
                const paymentDetails = {};

                switch (updatedData.paymentMethod) {
                    case 'CC':
                        if (updatedData.cardLastFour) {
                            paymentDetails.cardLastFour = updatedData.cardLastFour;
                            delete updatedData.cardLastFour;
                        }
                        break;
                    case 'PayPal':
                        if (updatedData.paypalEmail) {
                            paymentDetails.paypalEmail = updatedData.paypalEmail;
                            delete updatedData.paypalEmail;
                        }
                        break;
                    case 'Other':
                        if (updatedData.methodName) {
                            paymentDetails.methodName = updatedData.methodName;
                            delete updatedData.methodName;
                        }
                        if (updatedData.label) {
                            paymentDetails.label = updatedData.label;
                            delete updatedData.label;
                        }
                        break;
                }

                console.log('Payment details before save:', paymentDetails);

                updatedData.paymentDetails = JSON.stringify(paymentDetails);
                console.log('Final form data:', updatedData);

                const response = await fetch(`/api/subscriptions/update?id=${sub.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Username': encodeURIComponent(this.getUsername())
                    },
                    body: JSON.stringify(updatedData)
                });

                if (!response.ok) throw new Error('更新に失敗しました');

                await Swal.fire('完了', 'サブスクリプション情報を更新しました', 'success');
                await this.loadSubscriptions();
                document.body.removeChild(editModal);

                const updatedSub = this.subscriptions.find(s => s.id === sub.id);
                if (updatedSub) {
                    this.showSubscriptionDetail(updatedSub);
                }

                if (window.subscriptionManager && typeof window.subscriptionManager.scheduleNotifications === 'function') {
                    await window.subscriptionManager.scheduleNotifications({ reschedule: true });
                }
            } catch (error) {
                Swal.fire('エラー', error.message, 'error');
            }
        });
    }

    setupNotifications() {
        setInterval(() => this.checkUpcomingPayments(), 3600000);
        this.checkUpcomingPayments();
    }

    async checkUpcomingPayments() {
        try {
            const response = await fetch('/api/subscriptions/upcoming', {
                headers: { 'X-Username': encodeURIComponent(this.getUsername()) }
            });
            if (!response.ok) return;

            const upcoming = await response.json();
            upcoming.forEach(sub => {
                const paymentDate = new Date(sub.nextPaymentDate);
                const now = new Date();
                const daysUntilPayment = Math.ceil((paymentDate - now) / (1000 * 60 * 60 * 24));

                if (daysUntilPayment === 3 || daysUntilPayment === 1) {
                    Swal.fire({
                        title: 'サブスクリプション支払い予定',
                        html: `
                            <p>${sub.serviceName}の支払いが${daysUntilPayment}日後に予定されています。</p>
                            <p class="mt-2">金額: ${sub.amount} ${sub.currency}</p>
                        `,
                        icon: 'info',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 10000,
                        timerProgressBar: true
                    });
                }
            });
        } catch (error) {
            console.error('支払い予定チェックエラー:', error);
        }
    }

    setupAutoPaymentDateUpdate() {
        if (typeof window.monitorDateChange === 'function') {
            const originalMonitorDateChange = window.monitorDateChange;

            window.monitorDateChange = () => {
                originalMonitorDateChange();

                this.updateOverduePaymentDates();
            };
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.setupAutoPaymentDateUpdate(), 1000);
            });
        }
    }

    async updateOverduePaymentDates() {
        try {
            const username = this.getUsername();
            if (!username) return;

            const response = await fetch('/api/subscriptions/renew', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Username': encodeURIComponent(username)
                }
            });

            if (!response.ok) {
                console.error('支払い日自動更新APIが失敗しました', await response.text());
                return;
            }

            const renewalResults = await response.json().catch(err => { console.error('Failed to parse renewal results:', err); return []; });
            if (!Array.isArray(renewalResults) || renewalResults.length === 0) {
                return;
            }

            const htmlItems = renewalResults.map(result => {
                const nextDate = result.nextDate || '';
                const previousDate = result.previousDate ? ` (前回: ${result.previousDate})` : '';
                return `<li class="swal-subscription-item">${String(result.serviceName || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')}の次回支払日を${nextDate}に更新しました${previousDate}</li>`;
            }).join('');

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '支払い予定を更新',
                    html: `<div class="swal-renewal-container">日付が更新されました。<ul class="swal-renewal-list">${htmlItems}</ul></div>`,
                    icon: 'info',
                    confirmButtonText: '了解'
                });
            }

            await this.loadSubscriptions();

            if (window.subscriptionManager && typeof window.subscriptionManager.scheduleNotifications === 'function') {
                await window.subscriptionManager.scheduleNotifications({ reschedule: true });
            }
        } catch (error) {
            console.error('支払い日自動更新処理でエラー:', error);
        }
    }

    calculateNextPaymentDate(currentDate, billingCycle) {
        const nextDate = new Date(currentDate);

        switch (billingCycle) {
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                if (nextDate.getDate() !== currentDate.getDate()) {
                    nextDate.setDate(0);
                }
                break;

            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                if (nextDate.getDate() !== currentDate.getDate()) {
                    nextDate.setDate(0);
                }
                break;

            default:
                console.warn(`未対応の課金サイクル: ${billingCycle}`);
                return null;
        }

        return nextDate;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.subscriptionCalendarManager = new SubscriptionCalendarManager();

    window.loadSubscriptions = async function () {
        if (window.subscriptionCalendarManager) {
            await window.subscriptionCalendarManager.loadSubscriptions();
            console.log('サブスクリプション予定の同期が完了しました');
        } else {
            console.warn('subscriptionCalendarManager が初期化されていません');
        }
    };
});
