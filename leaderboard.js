(function () {
    'use strict';

    const storageKey = 'mathGameLeaderboard';
    const maxEntries = 10;

    function readResults() {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
            return Array.isArray(saved) ? saved : [];
        } catch {
            localStorage.removeItem(storageKey);
            return [];
        }
    }

    function saveResults(results) {
        localStorage.setItem(storageKey, JSON.stringify(results));
    }

    function addResult(score) {
        if (!Number.isFinite(score) || score <= 0) return;

        const results = readResults();
        results.push({
            score,
            date: new Date().toLocaleDateString('ru-RU')
        });
        results.sort((a, b) => b.score - a.score);
        saveResults(results.slice(0, maxEntries));
    }

    function renderResults() {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;

        const results = readResults();
        list.innerHTML = '';
        if (results.length === 0) {
            list.innerHTML = '<div class="leaderboard-empty">Результатов пока нет</div>';
            return;
        }

        results.forEach((result, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            row.innerHTML = `<span>${index + 1}. ${result.date}</span><span>${result.score} ⭐</span>`;
            list.appendChild(row);
        });
    }

    function showLeaderboard() {
        renderResults();
        document.getElementById('leaderboard-container').style.display = 'flex';
    }

    function hideLeaderboard() {
        document.getElementById('leaderboard-container').style.display = 'none';
    }

    document.addEventListener('DOMContentLoaded', () => {
        const menu = document.getElementById('menu-screen');
        const container = document.createElement('div');
        container.id = 'leaderboard-container';
        container.innerHTML = `
            <section class="leaderboard-card" role="dialog" aria-labelledby="leaderboard-title">
                <h2 id="leaderboard-title">🏆 Лучшие результаты</h2>
                <div id="leaderboard-list"></div>
                <button class="leaderboard-clear" type="button">Очистить результаты</button>
                <button class="leaderboard-close" type="button">Закрыть</button>
            </section>
        `;
        document.body.appendChild(container);

        document.getElementById('leaderboardBtn').addEventListener('click', showLeaderboard);
        container.querySelector('.leaderboard-close').addEventListener('click', hideLeaderboard);
        container.querySelector('.leaderboard-clear').addEventListener('click', () => {
            saveResults([]);
            renderResults();
        });
        container.addEventListener('click', event => {
            if (event.target === container) hideLeaderboard();
        });

        const nextButton = document.getElementById('nextBtn');
        nextButton.addEventListener('click', () => {
            if (nextButton.textContent === 'В меню') {
                const scoreText = document.getElementById('score').textContent;
                const score = Number.parseInt(scoreText.replace(/\D/g, ''), 10);
                addResult(score);
            }
        }, true);
    });
})();
