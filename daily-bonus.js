(function () {
    'use strict';

    const bonusKey = 'mathGameDailyBonusDate';
    const streakKey = 'mathGameDailyBonusStreak';
    const rewards = [5, 7, 10, 12, 15, 20, 50];

    function getToday() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getCoins() {
        const value = Number.parseInt(localStorage.getItem('coins') || '0', 10);
        return Number.isFinite(value) && value >= 0 ? value : 0;
    }

    function getYesterday() {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getStreak() {
        const value = Number.parseInt(localStorage.getItem(streakKey) || '0', 10);
        const lastDate = localStorage.getItem(bonusKey);
        if (lastDate !== getToday() && lastDate !== getYesterday()) return 0;
        if (Number.isFinite(value) && value >= 1 && value <= 7) return value;
        return lastDate === getToday() ? 1 : 0;
    }

    function updateCoinsDisplay(coins) {
        const menuCoins = document.getElementById('menu-coins');
        if (menuCoins) menuCoins.textContent = coins;

        const coinsCount = document.getElementById('coins-count');
        if (coinsCount) coinsCount.textContent = coins;
    }

    function updateButton(button) {
        const claimedToday = localStorage.getItem(bonusKey) === getToday();
        const streak = getStreak();
        const displayedStreak = Math.max(streak, 1);
        button.disabled = claimedToday;
        button.textContent = claimedToday
            ? `Получено · ${displayedStreak}/7`
            : `Забрать приз · ${displayedStreak}/7`;
        button.setAttribute('aria-label', claimedToday
            ? `Ежедневный бонус уже получен, серия ${displayedStreak} из 7`
            : `Забрать ежедневный приз, серия ${displayedStreak} из 7`);
        button.title = button.getAttribute('aria-label');
    }

    document.addEventListener('DOMContentLoaded', () => {
        const button = document.getElementById('dailyBonusBtn');
        if (!button) return;

        updateButton(button);
        button.addEventListener('click', () => {
            if (localStorage.getItem(bonusKey) === getToday()) return;

            const lastDate = localStorage.getItem(bonusKey);
            let streak = getStreak();
            streak = lastDate === getYesterday() ? Math.min(streak + 1, 7) : 1;
            let activeItems = {};
            try {
                activeItems = JSON.parse(localStorage.getItem('activeItems') || '{}');
            } catch {
                activeItems = {};
            }
            const multiplier = activeItems.item7 ? 2 : 1;
            const coins = getCoins() + rewards[streak - 1] * multiplier;
            localStorage.setItem('coins', String(coins));
            localStorage.setItem(bonusKey, getToday());
            localStorage.setItem(streakKey, String(streak));
            updateCoinsDisplay(coins);
            updateButton(button);
        });
    });
})();