document.addEventListener('DOMContentLoaded', () => {
    // Screen elements
    const levelsScreen = document.getElementById('levels-screen');
    const profileScreen = document.getElementById('profile-screen');
    const exitScreen = document.getElementById('exit-screen');
    const gameScreen = document.getElementById('game-screen');
    const shopScreen = document.getElementById('shop-screen');
    const backBtn = document.getElementById('backBtn');
    const exitBtn = document.getElementById('exitBtn');
    const returnFromExitBtn = document.getElementById('returnFromExitBtn');
    const bottomNav = document.getElementById('bottom-nav');
    const profileNameForm = document.getElementById('profile-name-form');
    const profileNameInput = document.getElementById('profile-name-input');
    const namePrompt = document.getElementById('name-prompt');
    const namePromptForm = document.getElementById('name-prompt-form');
    const playerNameInput = document.getElementById('player-name-input');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const shopBtn = document.getElementById('shopBtn');
    const closeShopBtn = document.getElementById('closeShopBtn');
    let shopReturnTab = 'profile';

    // Game elements
    const questionEl = document.getElementById('question');
    const optionsEl = document.getElementById('options');
    const feedbackEl = document.getElementById('feedback');
    const scoreEl = document.getElementById('score');
    const timerEl = document.getElementById('timer');
    const nextBtn = document.getElementById('nextBtn');
    const starsContainer = document.getElementById('stars');
    const confettiContainer = document.getElementById('confetti-container');

    // Hidden selects for state
    const gameSelect = document.getElementById('gameSelect');
    const ruModeSelect = document.getElementById('ruModeSelect');
    const modeSelect = document.getElementById('modeSelect');
    const opSelect = document.getElementById('opSelect'); // Keep for compatibility but not used in UI

    const difficultySelect = document.getElementById('difficultySelect');
    const levelMaps = {
        math: document.getElementById('math-level-map'),
        russian: document.getElementById('russian-level-map')
    };
    const campaignSummaries = {
        math: document.getElementById('math-campaign-summary'),
        russian: document.getElementById('russian-campaign-summary')
    };
    const subjectMapTabs = document.getElementById('subject-map-tabs');
    const subjectMapPanels = {
        math: document.getElementById('math-map-panel'),
        russian: document.getElementById('russian-map-panel')
    };
    const levelTitle = document.getElementById('level-title');
    const levelProgressLabel = document.getElementById('level-progress-label');
    const levelProgressTrack = document.querySelector('.level-progress-track');
    const levelProgressBar = document.getElementById('level-progress-bar');
    const gameAbilities = document.getElementById('game-abilities');

    // Game elements
    const sticksContainer = document.getElementById('sticks-container');
    const ruInputArea = document.getElementById('russian-input-area');
    const letterCanvas = document.getElementById('letterCanvas');
    const ctx = letterCanvas.getContext('2d');
    const russianTextInput = document.getElementById('russianTextInput');
    const wordWithGap = document.getElementById('word-with-gap');

    let score = 0;
    let currentAnswer = 0;
    let timer = 0;
    let timerInterval = null;
    let correctStreak = 0;
    const maxStars = 5;
    let stars = [];
    let currentLevelIndex = 0;
    let questionsCompleted = 0;
    let levelMistakes = 0;
    let levelComplete = false;
    let transitionTimeout = null;
    let selectedMapSubject = 'math';
    let mistakeShieldArmed = false;
    let bonusStarArmed = false;
    let bonusCoinsArmed = false;
    const questionsPerLevel = 5;
    function readStoredJson(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch {
            localStorage.removeItem(key);
            return fallback;
        }
    }

    function saveCampaignProgress() {
        localStorage.setItem(campaignStorageKey, JSON.stringify(campaignProgress));
    }

    function setMapSubject(subject) {
        if (!campaignTracks[subject]) return;

        selectedMapSubject = subject;
        subjectMapTabs.querySelectorAll('.subject-map-tab').forEach(tab => {
            const active = tab.dataset.subject === subject;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
        });
        Object.entries(subjectMapPanels).forEach(([panelSubject, panel]) => {
            panel.hidden = panelSubject !== subject;
        });
        requestAnimationFrame(() => {
            drawLevelConnections(levelMaps[subject], campaignProgress.unlockedBySubject[subject]);
        });
    }

    function renderLevelMap() {
        Object.entries(campaignTracks).forEach(([subject, track]) => {
            const levelMap = levelMaps[subject];
            const unlockedCount = campaignProgress.unlockedBySubject[subject];
            const completedCount = track.levels.filter(({ globalIndex }) =>
                campaignProgress.completed[globalIndex + 1]
            ).length;
            campaignSummaries[subject].textContent =
                `Открыто: ${unlockedCount} из ${track.levels.length} · Пройдено: ${completedCount}`;
            levelMap.innerHTML = '';
            const connections = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            connections.classList.add('level-connections');
            connections.setAttribute('aria-hidden', 'true');
            levelMap.appendChild(connections);

            track.levels.forEach(({ level, globalIndex }, trackIndex) => {
                const levelNumber = trackIndex + 1;
                const result = campaignProgress.completed[globalIndex + 1];
                const unlocked = levelNumber <= unlockedCount;
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `level-card${unlocked ? '' : ' locked'}${result ? ' completed' : ''}`;
                button.disabled = !unlocked;
                button.setAttribute('aria-label', unlocked
                    ? `${track.title}, уровень ${levelNumber}: ${level.title}${result ? `, пройдено, ${result.stars} звезды` : ''}`
                    : `${track.title}, уровень ${levelNumber}: ${level.title}, закрыт`);

                const icon = document.createElement('span');
                icon.className = 'level-card-icon';
                icon.setAttribute('aria-hidden', 'true');
                if (!unlocked) {
                    icon.textContent = '🔒';
                } else if (level.icon === 'tally') {
                    icon.classList.add('tally-icon');
                    icon.innerHTML = '<svg viewBox="0 0 64 64" focusable="false"><line x1="13" y1="12" x2="13" y2="52"></line><line x1="23" y1="12" x2="23" y2="52"></line><line x1="33" y1="12" x2="33" y2="52"></line><line x1="43" y1="12" x2="43" y2="52"></line><line x1="10" y1="48" x2="46" y2="16"></line></svg>';
                } else {
                    icon.textContent = level.icon;
                }

                const title = document.createElement('span');
                title.className = 'level-card-title';
                title.textContent = `${levelNumber}. ${level.title}`;

                const status = document.createElement('span');
                status.className = 'level-card-status';
                status.textContent = result
                    ? `${'★'.repeat(result.stars)}${'☆'.repeat(3 - result.stars)}`
                    : unlocked ? 'Начать уровень' : 'Сначала пройди предыдущий';

                button.append(icon, title, status);
                if (unlocked) button.addEventListener('click', () => startLevel(globalIndex));
                levelMap.appendChild(button);
            });
            drawLevelConnections(levelMap, unlockedCount);
        });
        renderProfile();
    }

    function drawLevelConnections(levelMap, unlockedCount) {
        const connections = levelMap.querySelector('.level-connections');
        if (!connections) return;

        const mapBounds = levelMap.getBoundingClientRect();
        if (!mapBounds.width || !mapBounds.height) return;

        connections.setAttribute('viewBox', `0 0 ${mapBounds.width} ${mapBounds.height}`);
        connections.setAttribute('width', String(mapBounds.width));
        connections.setAttribute('height', String(mapBounds.height));
        connections.replaceChildren();

        const cards = [...levelMap.querySelectorAll('.level-card')];
        const points = cards.map(card => ({
            x: card.offsetLeft + card.offsetWidth / 2,
            y: card.offsetTop + card.offsetHeight / 2
        }));

        for (let index = 0; index < points.length - 1; index++) {
            const start = points[index];
            const end = points[index + 1];
            const middleY = (start.y + end.y) / 2;
            const pathData = `M ${start.x} ${start.y} C ${start.x} ${middleY}, ${end.x} ${middleY}, ${end.x} ${end.y}`;
            const basePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            basePath.setAttribute('d', pathData);
            basePath.classList.add('level-connection-base');
            connections.appendChild(basePath);

            if (unlockedCount >= index + 2) {
                const activePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                activePath.setAttribute('d', pathData);
                activePath.classList.add('level-connection-active');
                connections.appendChild(activePath);
            }
        }
    }

    function drawAllLevelConnections() {
        Object.entries(campaignTracks).forEach(([subject]) => {
            drawLevelConnections(levelMaps[subject], campaignProgress.unlockedBySubject[subject]);
        });
    }

    function updateLevelProgress() {
        const completed = Math.min(questionsCompleted, questionsPerLevel);
        levelProgressLabel.textContent = `Задание ${Math.min(completed + 1, questionsPerLevel)} из ${questionsPerLevel} · Правильно: ${completed}`;
        levelProgressTrack.setAttribute('aria-valuenow', String(completed));
        levelProgressBar.style.width = `${(completed / questionsPerLevel) * 100}%`;
    }

    function startLevel(index, continueScore = false) {
        if (!Number.isInteger(index) || index < 0 || index >= campaignLevels.length) return;

        clearTimeout(transitionTimeout);
        currentLevelIndex = index;
        const level = campaignLevels[index];
        const track = campaignTracks[level.subject];
        const trackIndex = track.levels.findIndex(item => item.globalIndex === index);
        if (trackIndex < 0 || trackIndex >= campaignProgress.unlockedBySubject[level.subject]) return;
        setMapSubject(level.subject);
        const savedScore = continueScore ? score : 0;
        resetGame();
        score = savedScore;
        scoreEl.textContent = `Счёт: ${score}`;
        gameSelect.value = level.subject;
        modeSelect.value = level.mode || 'examples';
        ruModeSelect.value = level.russianMode || 'words';
        difficultySelect.value = level.difficulty;
        opSelect.value = level.operation || 'add';
        questionsCompleted = 0;
        levelMistakes = 0;
        correctStreak = 0;
        levelComplete = false;
        mistakeShieldArmed = false;
        bonusStarArmed = false;
        bonusCoinsArmed = false;
        levelTitle.textContent = `${track.title} · уровень ${trackIndex + 1}`;
        document.getElementById('level-description').textContent = level.description;
        nextBtn.style.display = 'none';
        nextBtn.dataset.action = '';
        updateStars();
        updateLevelProgress();
        levelsScreen.style.display = 'none';
        profileScreen.style.display = 'none';
        shopScreen.style.display = 'none';
        exitScreen.style.display = 'none';
        bottomNav.style.display = 'none';
        gameScreen.style.display = 'block';
        generateQuestion();
    }

    const storedCoins = Number.parseInt(localStorage.getItem('coins') || '0', 10);
    let coins = Number.isFinite(storedCoins) && storedCoins >= 0 ? storedCoins : 0;
    if (!Number.isFinite(storedCoins) || storedCoins < 0) {
        localStorage.setItem('coins', '0');
    }
    window.addEventListener('coinsupdated', event => {
        if (!(event instanceof CustomEvent) || !Number.isFinite(event.detail) || event.detail < 0) {
            console.error('Received an invalid coin balance update.');
            return;
        }
        coins = event.detail;
        updateCoinsBadge();
        renderProfile();
    });
    // One-use abilities sold by the shop.
    const shopItems = [
        { id: 'fifty-fifty', name: 'Ответы 50/50', description: 'Убирает два неверных варианта ответа.', icon: '✂️', price: 20 },
        { id: 'extra-time', name: 'Больше времени', description: 'Добавляет 30 секунд к текущему заданию.', icon: '⏱️', price: 15 },
        { id: 'skip-level', name: 'Пропуск уровня', description: 'Завершает уровень без награды за монеты.', icon: '⏭️', price: 60 },
        { id: 'mistake-shield', name: 'Щит от ошибки', description: 'При первой ошибке пропускает задание без штрафа.', icon: '🛡️', price: 25 },
        { id: 'bonus-star', name: 'Звёздный бонус', description: 'Даёт одну дополнительную звезду за уровень.', icon: '⭐', price: 35 },
        { id: 'bonus-coins', name: 'Монетный бонус', description: 'Добавляет 5 монет за следующий правильный ответ.', icon: '🪙', price: 20 }
    ];
    let abilityInventory = readStoredJson('mathGameAbilityInventory', {});
    if (!abilityInventory || typeof abilityInventory !== 'object' || Array.isArray(abilityInventory)) {
        abilityInventory = {};
    }
    abilityInventory = Object.fromEntries(
        shopItems
            .map(item => [item.id, abilityInventory[item.id]])
            .filter(([, count]) => Number.isSafeInteger(count) && count > 0)
    );

    // Russian language data
    const russianLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я'];
    const russianWords = [
        { word: 'КОТ', hint: 'К_Т' },
        { word: 'СОБАКА', hint: 'СО_АКА' },
        { word: 'ДОМ', hint: 'Д_М' },
        { word: 'ШКОЛА', hint: 'ШК_ЛА' },
        { word: 'МЕДВЕДЬ', hint: 'МЕД_ЕДЬ' },
        { word: 'РЫБА', hint: 'Р_БА' },
        { word: 'ПТИЦА', hint: 'ПТ_ИЦА' },
        { word: 'ЦВЕТОК', hint: 'ЦВЕТ_К' },
        { word: 'СОЛНЦЕ', hint: 'СО_НЦЕ' },
        { word: 'ЛУНА', hint: 'ЛУ_А' },
        { word: 'ДЕРЕВО', hint: 'ДЕ_ЕВО' },
        { word: 'ЯБЛОКО', hint: 'ЯБ_ОКО' }
    ];

    const campaignLevels = [
        { title: 'Палочки: считаем до 3', icon: 'tally', subject: 'math', mode: 'sticks', difficulty: 'easy', operation: 'add', countTo: 3, stickStage: 1, pathOrder: 1, description: 'Посчитай несколько палочек и выбери правильный ответ.' },
        { title: 'Первые примеры', icon: '➕', subject: 'math', mode: 'examples', difficulty: 'easy', operation: 'add', operandLimit: 5, pathOrder: 6, description: 'Складывай числа от одного до пяти.' },
        { title: 'Потерянная буква', icon: '🔤', subject: 'russian', russianMode: 'words', difficulty: 'easy', wordMaxLength: 3, pathOrder: 4, description: 'Найди пропущенную букву в коротком слове.' },
        { title: 'Мастер вычитания', icon: '➖', subject: 'math', mode: 'examples', difficulty: 'easy', operation: 'subtract', operandLimit: 5, pathOrder: 9, description: 'Попробуй вычитать маленькие числа.' },
        { title: 'Слова-путешественники', icon: '📝', subject: 'russian', russianMode: 'copy', difficulty: 'easy', wordMaxLength: 4, pathOrder: 9, description: 'Перепиши короткое слово без ошибок.' },
        { title: 'Таблица умножения', icon: '✖️', subject: 'math', mode: 'examples', difficulty: 'easy', operation: 'multiply', operandLimit: 5, pathOrder: 12, description: 'Начни умножать небольшие числа.' },
        { title: 'Буквенная долина', icon: '🔠', subject: 'russian', russianMode: 'words', difficulty: 'easy', wordMaxLength: 4, pathOrder: 5, description: 'Закрепи поиск пропущенной буквы в коротких словах.' },
        { title: 'Деление поровну', icon: '➗', subject: 'math', mode: 'examples', difficulty: 'easy', operation: 'divide', operandLimit: 5, pathOrder: 15, description: 'Делись небольшими группами поровну.' },
        { title: 'Математическая карусель', icon: '🎠', subject: 'math', mode: 'examples', difficulty: 'easy', operation: 'mixed', operandLimit: 5, pathOrder: 18, description: 'Потренируйся на знакомых примерах с маленькими числами.' },
        { title: 'Юный писатель', icon: '✍️', subject: 'russian', russianMode: 'copy', difficulty: 'normal', wordMaxLength: 6, pathOrder: 10, description: 'Перепиши слова из нескольких букв.' },
        { title: 'Испытание чисел', icon: '🚀', subject: 'math', mode: 'examples', difficulty: 'normal', operation: 'mixed', operandLimit: 10, pathOrder: 19, description: 'Решай примеры разных видов с числами до десяти.' },
        { title: 'Хранитель слов', icon: '🏆', subject: 'russian', russianMode: 'copy', difficulty: 'hard', wordMaxLength: 8, pathOrder: 11, description: 'Внимательно переписывай более длинные слова.' },
        { title: 'Сложение до 10', icon: '➕', subject: 'math', mode: 'examples', difficulty: 'normal', operation: 'add', operandLimit: 10, pathOrder: 7, description: 'Когда сложение маленьких чисел освоено, попробуй числа до десяти.' },
        { title: 'Лес пропущенных букв', icon: '🌳', subject: 'russian', russianMode: 'words', difficulty: 'normal', wordMaxLength: 6, pathOrder: 6, description: 'Найди пропущенные буквы в словах подлиннее.' },
        { title: 'Палочки: считаем до 15', icon: '🪵', subject: 'math', mode: 'sticks', difficulty: 'normal', operation: 'add', countTo: 15, stickStage: 5, pathOrder: 5, description: 'Посчитай до пятнадцати палочек и закрепи навык.' },
        { title: 'Книжная тропинка', icon: '📚', subject: 'russian', russianMode: 'copy', difficulty: 'hard', wordMaxLength: 8, pathOrder: 12, description: 'Аккуратно перепиши длинные слова.' },
        { title: 'Вычитание с секретом', icon: '🕵️', subject: 'math', mode: 'examples', difficulty: 'hard', operation: 'subtract', operandLimit: 20, pathOrder: 11, description: 'Решай примеры на вычитание с числами до двадцати.' },
        { title: 'Буквенный тренажёр', icon: '🔡', subject: 'russian', russianMode: 'type', difficulty: 'easy', letterCount: 5, pathOrder: 1, description: 'Познакомься с первыми буквами и напечатай нужную.' },
        { title: 'Умножение звёзд', icon: '🌟', subject: 'math', mode: 'examples', difficulty: 'normal', operation: 'multiply', operandLimit: 10, pathOrder: 13, description: 'Потренируй умножение чисел до десяти.' },
        { title: 'Слова-мастерята', icon: '🧩', subject: 'russian', russianMode: 'words', difficulty: 'hard', wordMaxLength: 8, pathOrder: 7, description: 'Заполни пропуски в длинных словах.' },
        { title: 'Деление сокровищ', icon: '💎', subject: 'math', mode: 'examples', difficulty: 'normal', operation: 'divide', operandLimit: 10, pathOrder: 16, description: 'Делись группами побольше поровну.' },
        { title: 'Большая диктовка', icon: '✏️', subject: 'russian', russianMode: 'copy', difficulty: 'hard', wordMaxLength: 8, pathOrder: 13, description: 'Проверь внимательность и перепиши длинные слова.' },
        { title: 'Финальная математическая битва', icon: '🏰', subject: 'math', mode: 'examples', difficulty: 'hard', operation: 'mixed', operandLimit: 20, pathOrder: 21, description: 'Решай примеры на сложение, вычитание, умножение и деление.' },
        { title: 'Легенда слов', icon: '👑', subject: 'russian', russianMode: 'copy', difficulty: 'hard', wordMaxLength: 8, pathOrder: 14, description: 'Заверши новую главу и стань хранителем слов.' },
        { title: 'Палочки: считаем до 5', icon: '🪵', subject: 'math', mode: 'sticks', difficulty: 'easy', countTo: 5, stickStage: 2, pathOrder: 2, description: 'Когда считать до трёх легко, попробуй посчитать до пяти.' },
        { title: 'Палочки: считаем до 7', icon: '🪵', subject: 'math', mode: 'sticks', difficulty: 'easy', countTo: 7, stickStage: 3, pathOrder: 3, description: 'Продолжай считать палочки и потренируйся считать до семи.' },
        { title: 'Палочки: считаем до 10', icon: '🪵', subject: 'math', mode: 'sticks', difficulty: 'normal', countTo: 10, stickStage: 4, pathOrder: 4, description: 'Потренируйся считать до десяти, не торопясь.' },
        { title: 'Сложение до 20', icon: '➕', subject: 'math', mode: 'examples', difficulty: 'hard', operation: 'add', operandLimit: 20, pathOrder: 8, description: 'Попробуй складывать числа до двадцати.' },
        { title: 'Вычитание до 10', icon: '➖', subject: 'math', mode: 'examples', difficulty: 'normal', operation: 'subtract', operandLimit: 10, pathOrder: 10, description: 'Переходи к вычитанию чисел до десяти.' },
        { title: 'Умножение до 15', icon: '✖️', subject: 'math', mode: 'examples', difficulty: 'hard', operation: 'multiply', operandLimit: 15, pathOrder: 14, description: 'Закрепи умножение на числах до пятнадцати.' },
        { title: 'Деление до 15', icon: '➗', subject: 'math', mode: 'examples', difficulty: 'hard', operation: 'divide', operandLimit: 15, pathOrder: 17, description: 'Потренируй деление с числами побольше.' },
        { title: 'Больше букв', icon: '🔡', subject: 'russian', russianMode: 'type', difficulty: 'normal', letterCount: 10, pathOrder: 2, description: 'Познакомься с новыми буквами и напечатай их.' },
        { title: 'Весь алфавит', icon: '🔠', subject: 'russian', russianMode: 'type', difficulty: 'hard', letterCount: 33, pathOrder: 3, description: 'Потренируйся узнавать и печатать все буквы.' },
        { title: 'Примеры на умножение и деление', icon: '🎯', subject: 'math', mode: 'examples', difficulty: 'normal', operation: 'mixed', operandLimit: 10, pathOrder: 20, description: 'Попробуй решать разные примеры самостоятельно.' }
    ];

    const campaignTracks = {
        math: {
            title: 'Математика',
            levels: campaignLevels
                .map((level, globalIndex) => ({ level, globalIndex }))
                .filter(({ level }) => level.subject === 'math')
                .sort((a, b) =>
                    a.level.pathOrder - b.level.pathOrder
                    || a.globalIndex - b.globalIndex
                )
        },
        russian: {
            title: 'Русский язык',
            levels: campaignLevels
                .map((level, globalIndex) => ({ level, globalIndex }))
                .filter(({ level }) => level.subject === 'russian')
                .sort((a, b) => a.level.pathOrder - b.level.pathOrder || a.globalIndex - b.globalIndex)
        }
    };

    const campaignStorageKey = 'mathGameCampaignProgress';
    const profileStorageKey = 'mathGamePlayerProfile';
    const themeStorageKey = 'mathGameTheme';
    let playerProfile = readStoredJson(profileStorageKey, { name: '' });
    if (!playerProfile || typeof playerProfile !== 'object' || Array.isArray(playerProfile)) {
        playerProfile = { name: '' };
    }
    playerProfile.name = typeof playerProfile.name === 'string' ? playerProfile.name.trim().slice(0, 24) : '';
    let selectedTheme = localStorage.getItem(themeStorageKey) === 'dark' ? 'dark' : 'light';

    function savePlayerName(value) {
        const name = value.trim().slice(0, 24);
        if (!name) return false;
        playerProfile.name = name;
        localStorage.setItem(profileStorageKey, JSON.stringify(playerProfile));
        renderProfile();
        return true;
    }

    function applyFreeTheme() {
        document.body.classList.toggle('theme-dark', selectedTheme === 'dark');
        document.body.classList.toggle('theme-light', localStorage.getItem(themeStorageKey) !== null && selectedTheme === 'light');
        const isDark = selectedTheme === 'dark';
        themeToggleBtn.setAttribute('aria-pressed', String(isDark));
        themeToggleBtn.querySelector('.theme-toggle-icon').textContent = isDark ? '🌙' : '☀️';
        themeToggleBtn.querySelector('.theme-toggle-label').textContent = isDark ? 'Тёмная тема' : 'Светлая тема';
    }

    function renderProfile() {
        const name = playerProfile.name || 'Юный исследователь';
        document.getElementById('profile-name').textContent = name;
        document.getElementById('profile-completed').textContent = String(
            Object.keys(campaignProgress.completed).filter(id => campaignProgress.completed[id]).length
        );
        document.getElementById('profile-stars').textContent = String(
            Object.values(campaignProgress.completed).reduce((total, result) => total + result.stars, 0)
        );
        document.getElementById('profile-coins').textContent = String(coins);
        const greeting = document.getElementById('home-greeting');
        if (greeting) greeting.textContent = playerProfile.name ? `Привет, ${playerProfile.name}!` : 'Готов к приключению?';
    }

    let campaignProgress = readStoredJson(campaignStorageKey, { unlocked: 1, completed: {} });
    if (!campaignProgress || typeof campaignProgress !== 'object' || Array.isArray(campaignProgress)) {
        campaignProgress = { unlocked: 1, completed: {} };
    }
    campaignProgress.unlocked = Number.isInteger(campaignProgress.unlocked)
        ? Math.max(1, Math.min(campaignProgress.unlocked, campaignLevels.length))
        : 1;
    if (!campaignProgress.completed || typeof campaignProgress.completed !== 'object' || Array.isArray(campaignProgress.completed)) {
        campaignProgress.completed = {};
    }
    campaignProgress.completed = Object.fromEntries(
        Object.entries(campaignProgress.completed)
            .filter(([id, result]) => {
                const levelNumber = Number(id);
                return Number.isInteger(levelNumber)
                    && levelNumber >= 1
                    && levelNumber <= campaignLevels.length
                    && result
                    && Number.isInteger(result.stars)
                    && result.stars >= 1
                    && result.stars <= 3;
            })
            .map(([id, result]) => [id, { stars: result.stars }])
    );
    const lastCompletedLevel = Math.max(0, ...Object.keys(campaignProgress.completed).map(Number));
    campaignProgress.unlocked = Math.max(
        campaignProgress.unlocked,
        Math.min(lastCompletedLevel + 1, campaignLevels.length)
    );
    const storedTrackProgress = campaignProgress.unlockedBySubject
        && typeof campaignProgress.unlockedBySubject === 'object'
        && !Array.isArray(campaignProgress.unlockedBySubject)
        ? campaignProgress.unlockedBySubject
        : {};
    campaignProgress.unlockedBySubject = Object.fromEntries(
        Object.entries(campaignTracks).map(([subject, track]) => {
            const legacyUnlocked = Math.max(
                1,
                track.levels.filter(({ globalIndex }) => globalIndex + 1 <= campaignProgress.unlocked).length
            );
            const completedUnlocked = Math.max(
                1,
                ...track.levels
                    .map(({ globalIndex }, trackIndex) =>
                        campaignProgress.completed[globalIndex + 1] ? trackIndex + 2 : 1
                    )
            );
            const storedUnlocked = storedTrackProgress[subject];
            const unlocked = Number.isInteger(storedUnlocked)
                ? Math.max(storedUnlocked, completedUnlocked)
                : Math.max(legacyUnlocked, completedUnlocked);
            return [subject, Math.min(unlocked, track.levels.length)];
        })
    );

    // Quiz data
    const quizQuestions = [
        { q: "Какого цвета небо в ясный день?", options: ["Красное", "Синее", "Зелёное", "Жёлтое"], answer: 1 },
        { q: "Сколько у человека рук?", options: ["Одна", "Две", "Три", "Четыре"], answer: 1 },
        { q: "Как называется время суток, когда темно?", options: ["День", "Утро", "Ночь", "Вечер"], answer: 2 },
        { q: "Сколько ножек у кота?", options: ["Две", "Три", "Четыре", "Пять"], answer: 2 },
        { q: "Какой фрукт желтый и длинный?", options: ["Яблоко", "Банан", "Груша", "Апельсин"], answer: 1 },
        { q: "Во сколько начинается новый день?", options: ["В полночь", "В час ночи", "В шесть утра", "В двенадцать дня"], answer: 0 },
        { q: "Какой сезон идет после весны?", options: ["Зима", "Лето", "Осень", "Весна"], answer: 1 },
        { q: "Сколько пальцев на одной руке?", options: ["Пять", "Четыре", "Три", "Шесть"], answer: 0 },
        { q: "Какой цвет получается, если смешать красный и белый?", options: ["Розовый", "Фиолетовый", "Оранжевый", "Зелёный"], answer: 0 },
        { q: "Во что превращается вода при заморозке?", options: ["Пар", "Лёд", "Снег", "Камень"], answer: 1 }
    ];

    // Initialize stars
    function initStars() {
        starsContainer.innerHTML = '';
        stars = [];
        for (let i = 0; i < maxStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.textContent = '★';
            star.style.setProperty('--star-index', i);
            starsContainer.appendChild(star);
            stars.push(star);
        }
    }

    // Update stars
    function updateStars() {
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < correctStreak);
        });
    }

    function completeLevel({ skipped = false } = {}) {
        if (levelComplete) return;
        clearTimer();
        clearTimeout(window.russianCheckTimeout);
        levelComplete = true;
        const levelNumber = currentLevelIndex + 1;
        const previousResult = campaignProgress.completed[levelNumber];
        const baseStars = levelMistakes === 0 ? 3 : levelMistakes <= 2 ? 2 : 1;
        const earnedStars = skipped ? 1 : Math.min(3, baseStars + Number(bonusStarArmed));
        const starsEarned = Math.max(previousResult ? previousResult.stars : 0, earnedStars);
        campaignProgress.completed[levelNumber] = {
            stars: starsEarned
        };
        bonusStarArmed = false;
        bonusCoinsArmed = false;
        campaignProgress.unlocked = Math.max(
            campaignProgress.unlocked,
            Math.min(levelNumber + 1, campaignLevels.length)
        );
        const track = campaignTracks[campaignLevels[currentLevelIndex].subject];
        const trackIndex = track.levels.findIndex(item => item.globalIndex === currentLevelIndex);
        campaignProgress.unlockedBySubject[campaignLevels[currentLevelIndex].subject] = Math.max(
            campaignProgress.unlockedBySubject[campaignLevels[currentLevelIndex].subject],
            Math.min(trackIndex + 2, track.levels.length)
        );
        saveCampaignProgress();

        const reward = skipped || previousResult ? 0 : 10;
        coins += reward;
        localStorage.setItem('coins', String(coins));
        updateCoinsBadge();
        const finalLevel = trackIndex === track.levels.length - 1;
        feedbackEl.textContent = `${skipped ? 'Уровень пропущен!' : 'Уровень пройден!'} ${'★'.repeat(starsEarned)}${'☆'.repeat(3 - starsEarned)}${reward ? ` · +${reward} монет` : ''}`;
        feedbackEl.style.color = '#2e7d32';
        renderProfile();
        nextBtn.textContent = finalLevel ? 'К карте предметов' : 'Следующий уровень';
        nextBtn.dataset.action = finalLevel ? 'campaign-finished' : 'level-complete';
        nextBtn.style.display = 'block';
        document.querySelectorAll('.option').forEach(o => o.disabled = true);
        disableRussianInput();
        renderGameAbilities();
        if (finalLevel) launchCoins();
        launchConfetti();
        playSound('correct');
    }

    // Shop functions
    function showShop() {
        shopReturnTab = levelsScreen.style.display !== 'none' ? 'levels' : 'profile';
        levelsScreen.style.display = 'none';
        profileScreen.style.display = 'none';
        exitScreen.style.display = 'none';
        bottomNav.style.display = 'none';
        shopScreen.style.display = 'block';
        document.getElementById('shop-feedback').textContent = '';
        renderShopItems();
        updateCoinsDisplay();
    }

    function hideShop() {
        shopScreen.style.display = 'none';
        if (shopReturnTab === 'levels') showLevels();
        else showProfile();
    }

    function updateCoinsDisplay() {
        updateCoinsBadge();
    }

    function renderShopItems() {
        const shopItemsContainer = document.getElementById('shop-items');
        shopItemsContainer.innerHTML = '';
        shopItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'shop-item';
            itemEl.innerHTML = `
                <div class="shop-item-icon" aria-hidden="true">${item.icon}</div>
                <div class="shop-item-name">${item.name} <span class="shop-item-use">(x1)</span></div>
                <p class="shop-item-description">${item.description}</p>
                <div class="shop-item-stock">В запасе: ${abilityInventory[item.id] || 0}</div>
                <div class="shop-item-price">🪙 ${item.price}</div>
                <div class="shop-item-buttons"><button class="shop-item-btn buy-btn" type="button">Купить x1</button></div>
            `;
            shopItemsContainer.appendChild(itemEl);

            const btn = itemEl.querySelector('button');
            btn.disabled = coins < item.price;
            btn.title = btn.disabled ? 'Не хватает монет' : `Купить одну способность за ${item.price} монет`;
            btn.addEventListener('click', () => buyItem(item));
        });
    }

    function buyItem(item) {
        if (coins < item.price) {
            document.getElementById('shop-feedback').textContent = 'Не хватает монет для покупки.';
            return;
        }
        coins -= item.price;
        abilityInventory[item.id] = (abilityInventory[item.id] || 0) + 1;
        localStorage.setItem('coins', String(coins));
        saveAbilityInventory();
        updateCoinsBadge();
        shopFeedbackMessage(`Куплено: ${item.name} x1`);
        renderShopItems();
        renderGameAbilities();
        playSound('correct');
    }

    function shopFeedbackMessage(message) {
        document.getElementById('shop-feedback').textContent = message;
    }

    function saveAbilityInventory() {
        localStorage.setItem('mathGameAbilityInventory', JSON.stringify(abilityInventory));
    }

    function consumeAbility(abilityId) {
        const count = abilityInventory[abilityId] || 0;
        if (count < 1) return false;
        if (count === 1) delete abilityInventory[abilityId];
        else abilityInventory[abilityId] = count - 1;
        saveAbilityInventory();
        renderShopItems();
        renderGameAbilities();
        return true;
    }

    function renderGameAbilities() {
        if (!gameAbilities) return;
        gameAbilities.replaceChildren();
        const isPlaying = gameScreen.style.display !== 'none' && !levelComplete;
        const availableAbilities = shopItems.filter(item =>
            isPlaying
            && abilityInventory[item.id] > 0
            && (item.id !== 'fifty-fifty'
                || (gameSelect.value === 'math' && optionsEl.querySelectorAll('.option:not(:disabled)').length > 2))
        );
        gameAbilities.hidden = !availableAbilities.length && !mistakeShieldArmed && !bonusStarArmed && !bonusCoinsArmed;

        availableAbilities.forEach(item => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'game-ability-btn';
            button.textContent = `${item.icon} ${item.name} x${abilityInventory[item.id]}`;
            button.addEventListener('click', () => useAbility(item.id));
            gameAbilities.appendChild(button);
        });

        const armedEffects = [
            mistakeShieldArmed ? '🛡️ Щит защитит от следующей ошибки.' : '',
            bonusStarArmed ? '⭐ Звёздный бонус активен.' : '',
            bonusCoinsArmed ? '🪙 Бонус +5 монет добавится за правильный ответ.' : ''
        ].filter(Boolean);
        armedEffects.forEach(message => {
            const status = document.createElement('p');
            status.className = 'game-ability-status';
            status.textContent = message;
            gameAbilities.appendChild(status);
        });
    }

    function useAbility(abilityId) {
        if (levelComplete || gameScreen.style.display === 'none') return;

        if (abilityId === 'fifty-fifty') {
            const availableOptions = [...optionsEl.querySelectorAll('.option:not(:disabled)')];
            const wrongOptions = availableOptions
                .filter(option => Number(option.textContent) !== currentAnswer);
            const removeCount = Math.min(2, availableOptions.length - 2);
            if (removeCount < 1 || wrongOptions.length < removeCount) return;
            wrongOptions.sort(() => Math.random() - 0.5).slice(0, removeCount).forEach(option => option.remove());
            if (consumeAbility(abilityId)) {
                feedbackEl.textContent = 'Подсказка 50/50: осталось два варианта!';
                feedbackEl.style.color = '#2e7d32';
            }
        } else if (abilityId === 'extra-time') {
            if (!consumeAbility(abilityId)) return;
            const secondsRemaining = timer + 30;
            clearTimer();
            startTimer(secondsRemaining);
            feedbackEl.textContent = 'Добавлено 30 секунд!';
            feedbackEl.style.color = '#2e7d32';
        } else if (abilityId === 'skip-level') {
            if (!consumeAbility(abilityId)) return;
            completeLevel({ skipped: true });
        } else if (abilityId === 'mistake-shield') {
            if (!consumeAbility(abilityId)) return;
            mistakeShieldArmed = true;
        } else if (abilityId === 'bonus-star') {
            if (!consumeAbility(abilityId)) return;
            bonusStarArmed = true;
        } else if (abilityId === 'bonus-coins') {
            if (!consumeAbility(abilityId)) return;
            bonusCoinsArmed = true;
        }
        renderGameAbilities();
    }

    function updateCoinsBadge() {
        document.getElementById('coins-balance').textContent = coins;
    }

    // Get max number for wrong answer generation
    function maxNumber() {
        const currentLevel = campaignLevels[currentLevelIndex];
        if (modeSelect.value === 'sticks' && Number.isInteger(currentLevel.countTo)) return currentLevel.countTo;
        if (Number.isInteger(currentLevel.operandLimit)) return currentLevel.operandLimit;
        const limits = {
            easy: modeSelect.value === 'sticks' ? 3 : 5,
            normal: modeSelect.value === 'sticks' ? 5 : 10,
            hard: modeSelect.value === 'sticks' ? 10 : 20
        };
        return limits[difficultySelect.value] || limits.normal;
    }

    // Get random number based on mode
    function getRandomNumber() {
        return Math.floor(Math.random() * maxNumber()) + 1;
    }

    // Timer functions
    function startTimer(seconds) {
        timer = seconds;
        timerEl.textContent = `Время: ${timer}`;
        timerInterval = setInterval(() => {
            timer--;
            timerEl.textContent = `Время: ${timer}`;
            if (timer <= 0) {
                clearTimer();
                timeOut();
            }
        }, 1000);
    }

    function clearTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    // Confetti
    function launchConfetti() {
        const colors = ['#ff0', '#0ff', '#f0f', '#0f0', '#f00', '#ff0'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confetti.style.opacity = Math.random() + 0.5;
            confettiContainer.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }
    }

    // Sound
    function playSound(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            gainNode.gain.value = 0.1;
            oscillator.frequency.value = type === 'correct' ? 800 : type === 'wrong' ? 200 : 400;
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.2);
        } catch (e) {}
    }

    // Coin animation
    function launchCoins() {
        const colors = ['#ffd700', '#ffed4e', '#ffc700'];
        for (let i = 0; i < 30; i++) {
            const coin = document.createElement('div');
            coin.className = 'coin';
            coin.style.left = Math.random() * 100 + 'vw';
            coin.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            coin.style.animationDuration = (Math.random() * 2 + 2) + 's';
            coin.style.animationDelay = (Math.random() * 0.5) + 's';
            coin.textContent = '💰';
            confettiContainer.appendChild(coin);
            setTimeout(() => coin.remove(), 5000);
        }
    }

    function handleCorrectAnswer() {
        if (levelComplete) return;
        clearTimer();
        clearTimeout(window.russianCheckTimeout);
        document.querySelectorAll('.option').forEach(option => option.disabled = true);
        disableRussianInput();
        questionsCompleted++;
        score++;
        correctStreak = Math.min(questionsCompleted, maxStars);
        scoreEl.textContent = `Счёт: ${score}`;
        if (bonusCoinsArmed) {
            bonusCoinsArmed = false;
            coins += 5;
            localStorage.setItem('coins', String(coins));
            updateCoinsBadge();
            renderProfile();
            feedbackEl.textContent = 'Правильно! Бонус: +5 монет.';
        } else {
            feedbackEl.textContent = 'Правильно!';
        }
        feedbackEl.style.color = '#2e7d32';
        updateStars();
        updateLevelProgress();
        renderGameAbilities();
        launchConfetti();
        playSound('correct');

        transitionTimeout = setTimeout(() => {
            if (questionsCompleted >= questionsPerLevel) {
                completeLevel();
            } else {
                generateQuestion();
            }
        }, 1000);
    }

    function handleIncorrectAnswer(message) {
        if (levelComplete) return;
        clearTimer();
        if (mistakeShieldArmed) {
            mistakeShieldArmed = false;
            document.querySelectorAll('.option').forEach(option => {
                option.disabled = false;
                option.classList.remove('wrong', 'correct');
            });
            russianTextInput.value = '';
            feedbackEl.textContent = 'Щит сработал: задание пропущено без штрафа.';
            feedbackEl.style.color = '#2e7d32';
            renderGameAbilities();
            playSound('correct');
            transitionTimeout = setTimeout(generateQuestion, 1000);
            return;
        }
        levelMistakes++;
        feedbackEl.textContent = message;
        feedbackEl.style.color = '#c62828';
        renderGameAbilities();
        playSound('wrong');
        transitionTimeout = setTimeout(generateQuestion, 1500);
    }

    // Option click handler
    function handleOptionClick(btn, value) {
        if (levelComplete) return;
        const isCorrect = Number(value) === currentAnswer;

        if (isCorrect) {
            btn.classList.add('correct');
            handleCorrectAnswer();
        } else {
            if (mistakeShieldArmed) {
                handleIncorrectAnswer('Щит сработал: задание пропущено без штрафа.');
                return;
            }
            btn.classList.add('wrong');
            document.querySelectorAll('.option').forEach(option => option.disabled = true);
            document.querySelectorAll('.option').forEach(o => {
                if (Number(o.textContent) === currentAnswer) {
                    o.classList.add('correct');
                }
            });
            handleIncorrectAnswer(`Попробуй ещё раз! Ответ: ${currentAnswer}`);
        }
    }

    // Time out
    function timeOut() {
        clearTimeout(window.russianCheckTimeout);
        if (mistakeShieldArmed) {
            handleIncorrectAnswer('Щит сработал: задание пропущено без штрафа.');
            return;
        }
        if (gameSelect.value === 'russian') {
            const mode = ruModeSelect.value;
            if (mode === 'letters') {
                feedbackEl.textContent = `Время вышло! Буква: ${currentRussianLetter}`;
                clearCanvas();
            } else if (mode === 'words') {
                feedbackEl.textContent = `Время вышло! Буква: ${currentAnswer}`;
                wordWithGap.textContent = currentRussianWord;
            } else if (mode === 'copy') {
                feedbackEl.textContent = `Время вышло! Слово: ${currentRussianWord}`;
            } else if (mode === 'type') {
                feedbackEl.textContent = `Время вышло! Буква: ${currentRussianLetter}`;
            }
            disableRussianInput();
        } else {
            feedbackEl.textContent = `Время вышло! Ответ: ${currentAnswer}`;
            document.querySelectorAll('.option').forEach(o => {
                o.disabled = true;
                if (Number(o.textContent) === currentAnswer) {
                    o.classList.add('correct');
                }
            });
        }
        feedbackEl.style.color = '#ff6f00';
        levelMistakes++;
        playSound('timeout');

        transitionTimeout = setTimeout(generateQuestion, 1500);
    }

    // Generate question
    function generateQuestion() {
        clearTimeout(transitionTimeout);
        transitionTimeout = null;
        clearTimer();
        const gameType = gameSelect.value;

        sticksContainer.style.display = 'none';
        sticksContainer.innerHTML = '';
        ruInputArea.style.display = 'none';
        optionsEl.style.display = 'grid';

        if (gameType === 'math') {
            const mathMode = modeSelect.value;
            if (mathMode === 'sticks') {
                generateSticksQuestion();
            } else {
                generateMathQuestion();
            }
        } else if (gameType === 'russian') {
            ruInputArea.style.display = 'block';
            optionsEl.style.display = 'none';
            generateRussianQuestion();
        }

        feedbackEl.textContent = '';
        nextBtn.style.display = 'none';
        updateLevelProgress();
        startTimer(modeSelect.value === 'sticks' ? 30 : 20);
        renderGameAbilities();
    }

    // Math question
    function generateMathQuestion() {
        let a = getRandomNumber();
        let b = getRandomNumber();
        let operation = opSelect.value;
        if (operation === 'mixed') {
            const operations = ['add', 'subtract', 'multiply', 'divide'];
            operation = operations[Math.floor(Math.random() * operations.length)];
        }

        let answer;
        let opSymbol;
        switch (operation) {
            case 'subtract':
                if (a < b) [a, b] = [b, a];
                answer = a - b;
                opSymbol = '−';
                break;
            case 'multiply':
                answer = a * b;
                opSymbol = '×';
                break;
            case 'divide':
                answer = a;
                a *= b;
                opSymbol = '÷';
                break;
            default:
                answer = a + b;
                opSymbol = '+';
                break;
        }

        questionEl.textContent = `Сколько будет ${a} ${opSymbol} ${b}?`;
        currentAnswer = answer;

        const options = [answer];
        while (options.length < 4) {
            const offset = Math.floor(Math.random() * 11) - 5;
            const wrong = Math.max(0, answer + offset);
            if (wrong !== answer && !options.includes(wrong)) {
                options.push(wrong);
            }
        }
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        optionsEl.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option';
            btn.textContent = opt;
            btn.addEventListener('click', () => handleOptionClick(btn, opt));
            optionsEl.appendChild(btn);
        });
    }

    // Sticks question
    function generateSticksQuestion() {
        const count = getRandomNumber();
        questionEl.textContent = `Сколько палочек?`;
        currentAnswer = count;

        sticksContainer.style.display = 'flex';
        for (let i = 0; i < count; i++) {
            const stick = document.createElement('div');
            stick.className = 'stick';
            sticksContainer.appendChild(stick);
        }

        const options = [count];
        const optionCount = Math.min(4, maxNumber());
        while (options.length < optionCount) {
            const wrong = Math.floor(Math.random() * maxNumber()) + 1;
            if (wrong !== count && !options.includes(wrong)) {
                options.push(wrong);
            }
        }
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        optionsEl.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option';
            btn.textContent = opt;
            btn.addEventListener('click', () => handleOptionClick(btn, opt));
            optionsEl.appendChild(btn);
        });
    }

    // Quest question
    function generateQuestQuestion() {
        const idx = Math.floor(Math.random() * quizQuestions.length);
        const q = quizQuestions[idx];
        questionEl.textContent = q.q;
        currentAnswer = q.answer;

        const options = [...q.options];
        optionsEl.innerHTML = '';
        options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'option';
            btn.textContent = opt;
            btn.addEventListener('click', () => handleOptionClick(btn, index));
            optionsEl.appendChild(btn);
        });
    }

    // Russian Language modes
    let currentRussianLetter = '';
    let currentRussianWord = '';
    let isDrawing = false;

    function initCanvas() {
        // Adapt canvas size for mobile
        const maxWidth = Math.min(window.innerWidth - 40, 300);
        letterCanvas.width = maxWidth;
        letterCanvas.height = maxWidth;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, letterCanvas.width, letterCanvas.height);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';

        letterCanvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const rect = letterCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            ctx.beginPath();
            ctx.moveTo(x, y);
        });
        letterCanvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            const rect = letterCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            ctx.lineTo(x, y);
            ctx.stroke();
        });
        letterCanvas.addEventListener('mouseup', () => { isDrawing = false; });
        letterCanvas.addEventListener('mouseout', () => { isDrawing = false; });

        letterCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = letterCanvas.getBoundingClientRect();
            const scaleX = letterCanvas.width / rect.width;
            const scaleY = letterCanvas.height / rect.height;
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            isDrawing = true;
            ctx.beginPath();
            ctx.moveTo(x, y);
        });
        letterCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isDrawing) return;
            const touch = e.touches[0];
            const rect = letterCanvas.getBoundingClientRect();
            const scaleX = letterCanvas.width / rect.width;
            const scaleY = letterCanvas.height / rect.height;
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            ctx.lineTo(x, y);
            ctx.stroke();
        });
        letterCanvas.addEventListener('touchend', () => { isDrawing = false; });
    }

    function clearCanvas() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, letterCanvas.width, letterCanvas.height);
    }

function generateRussianLetter() {
    const availableLetters = getRussianLettersForLevel();
    currentRussianLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
    questionEl.textContent = `Нарисуйте букву: ${currentRussianLetter}`;
    currentAnswer = currentRussianLetter.charCodeAt(0);
    optionsEl.innerHTML = '';
    letterCanvas.style.display = 'block';
    russianTextInput.style.display = 'none';
    wordWithGap.style.display = 'none';
    
    // Create template of the letter for comparison
    ctx.save();
    ctx.fillStyle = '#000000'; // Black for template
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentRussianLetter, letterCanvas.width / 2, letterCanvas.height / 2);
    const templateData = ctx.getImageData(0, 0, letterCanvas.width, letterCanvas.height);
    // Store template data for later comparison
    window.currentRussianTemplate = templateData;
    ctx.restore();
    
    // Clear canvas and draw the letter lightly as a tracing guide
    clearCanvas();
    ctx.save();
    ctx.fillStyle = '#e0e0e0'; // Light gray
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentRussianLetter, letterCanvas.width / 2, letterCanvas.height / 2);
    ctx.restore();
    
    clearTimeout(window.russianCheckTimeout);
}

    function getRussianWord() {
        const currentLevel = campaignLevels[currentLevelIndex];
        const maxLength = Number.isInteger(currentLevel.wordMaxLength)
            ? currentLevel.wordMaxLength
            : difficultySelect.value === 'easy' ? 4 : difficultySelect.value === 'normal' ? 6 : Infinity;
        const availableWords = russianWords.filter(item => item.word.length <= maxLength);
        const words = availableWords.length ? availableWords : russianWords;
        return words[Math.floor(Math.random() * words.length)];
    }

    function getRussianLettersForLevel() {
        const letterCount = campaignLevels[currentLevelIndex].letterCount;
        return Number.isInteger(letterCount)
            ? russianLetters.slice(0, Math.max(1, Math.min(letterCount, russianLetters.length)))
            : russianLetters;
    }

    function generateRussianWord() {
        const item = getRussianWord();
        currentRussianWord = item.word;

        russianTextInput.removeEventListener('input', validateRussianInput);

        questionEl.textContent = 'Заполните пропущенную букву';
        currentAnswer = item.word[item.hint.indexOf('_')];

        optionsEl.innerHTML = '';
        letterCanvas.style.display = 'none';
        russianTextInput.style.display = 'block';
        wordWithGap.style.display = 'block';
        wordWithGap.textContent = item.hint;
        russianTextInput.value = '';
        russianTextInput.maxLength = 1;
        russianTextInput.placeholder = 'Введите букву';
        russianTextInput.focus();

        russianTextInput.addEventListener('input', validateRussianInput);
    }

function generateRussianWordCopy() {
    currentRussianWord = getRussianWord().word;
    russianTextInput.removeEventListener('input', validateRussianInput);

    questionEl.textContent = `Списать слово: ${currentRussianWord}`;
    currentAnswer = currentRussianWord.toLowerCase();

    optionsEl.innerHTML = '';
    letterCanvas.style.display = 'none';
    russianTextInput.style.display = 'block';
    wordWithGap.style.display = 'none';
    russianTextInput.value = '';
    russianTextInput.maxLength = 50;
    russianTextInput.placeholder = 'Введите слово';
    russianTextInput.focus();

    russianTextInput.addEventListener('input', validateRussianInput);
}

function generateRussianLetterType() {
    const availableLetters = getRussianLettersForLevel();
    const idx = Math.floor(Math.random() * availableLetters.length);
    currentRussianLetter = availableLetters[idx];
    questionEl.textContent = `Напишите букву: ${currentRussianLetter}`;
    currentAnswer = currentRussianLetter.toLowerCase();

    optionsEl.innerHTML = '';
    letterCanvas.style.display = 'none';
    russianTextInput.style.display = 'block';
    wordWithGap.style.display = 'none';
    russianTextInput.value = '';
    russianTextInput.maxLength = 1;
    russianTextInput.placeholder = 'Введите букву';
    russianTextInput.focus();

    // Remove any existing event listener first
    russianTextInput.removeEventListener('input', validateRussianInput);
    // Add event listener for validation
    russianTextInput.addEventListener('input', validateRussianInput);
}

    function generateRussianQuestion() {
        const ruMode = ruModeSelect.value;
        enableRussianInput();
        if (ruMode === 'letters') {
            generateRussianLetter();
            setTimeout(() => { if (gameSelect.value === 'russian') checkRussianDrawing(); }, 1000);
        } else if (ruMode === 'words') {
            generateRussianWord();
        } else if (ruMode === 'copy') {
            generateRussianWordCopy();
        } else if (ruMode === 'type') {
            generateRussianLetterType();
        }
    }

function checkRussianDrawing() {
    if (gameSelect.value !== 'russian' || ruModeSelect.value !== 'letters') return;
    if (nextBtn.style.display === 'block') return;

    const drawnData = ctx.getImageData(0, 0, letterCanvas.width, letterCanvas.height);
    const templateData = window.currentRussianTemplate;
    
    if (!templateData) {
        handleRussianCorrect(); // Fallback if no template
        return;
    }
    
    // Compare drawn image with template
    let matchingPixels = 0;
    let totalTemplatePixels = 0;
    
    for (let i = 0; i < drawnData.data.length; i += 4) {
        // Check if template pixel is not white (part of the letter template)
        const isTemplatePixel = !(templateData.data[i] === 255 && 
                                 templateData.data[i+1] === 255 && 
                                 templateData.data[i+2] === 255);
        
        if (isTemplatePixel) {
            totalTemplatePixels++;
            
            // Calculate brightness of drawn pixel (0-255)
            const brightness = (drawnData.data[i] + drawnData.data[i+1] + drawnData.data[i+2]) / 3;
            
            // Guide color brightness is #e0e0e0 = 224,224,224 → ~224
            // If brightness is significantly less than guide, user drew something dark
            if (brightness < 200) { // Threshold for detecting user drawing
                matchingPixels++;
            }
        }
    }
    
    // Calculate similarity percentage
    const similarity = totalTemplatePixels > 0 ? (matchingPixels / totalTemplatePixels) * 100 : 0;
    
    // Require at least 40% of template pixels to be drawn by user
    if (similarity >= 40) {
        handleRussianCorrect();
    } else {
        window.russianCheckTimeout = setTimeout(checkRussianDrawing, 500);
    }
}

    function validateRussianInput() {
        const userVal = russianTextInput.value.trim().toLowerCase();
        if (!userVal) return;

        if (ruModeSelect.value === 'copy' && userVal.length !== String(currentAnswer).length) {
            return;
        }

        clearTimeout(window.russianCheckTimeout);
        clearTimer();
        disableRussianInput();

        const target = String(currentAnswer).toLowerCase();
        const isCorrect = userVal === target;

        if (isCorrect) {
            russianTextInput.value = '';
            clearCanvas();
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer('Почти получилось! Попробуй ещё раз.');
        }
    }

    function disableRussianInput() {
        russianTextInput.disabled = true;
        letterCanvas.style.pointerEvents = 'none';
    }

    function enableRussianInput() {
        russianTextInput.disabled = false;
        letterCanvas.style.pointerEvents = 'auto';
    }

    function handleRussianCorrect() {
        clearCanvas();
        handleCorrectAnswer();
    }

    // Next button
    nextBtn.addEventListener('click', () => {
        if (!levelComplete) return;
        const track = campaignTracks[campaignLevels[currentLevelIndex].subject];
        const trackIndex = track.levels.findIndex(item => item.globalIndex === currentLevelIndex);
        if (trackIndex < track.levels.length - 1) {
            startLevel(track.levels[trackIndex + 1].globalIndex, true);
            return;
        }
        showLevels();
    });

    // Reset game (reset state but don't start)
    function resetGame() {
        clearTimeout(transitionTimeout);
        transitionTimeout = null;
        score = 0;
        correctStreak = 0;
        questionsCompleted = 0;
        levelMistakes = 0;
        levelComplete = false;
        mistakeShieldArmed = false;
        bonusStarArmed = false;
        bonusCoinsArmed = false;
        scoreEl.textContent = `Счёт: ${score}`;
        updateStars();
        clearTimer();
        clearTimeout(window.russianCheckTimeout);
        russianTextInput.removeEventListener('input', validateRussianInput);
        russianTextInput.value = '';
        clearCanvas();
        renderGameAbilities();
    }

    function setActiveTab(tab) {
        bottomNav.querySelectorAll('.bottom-nav-item').forEach(button => {
            const active = button.dataset.tab === tab;
            button.classList.toggle('active', active);
            if (active) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
        });
    }

    function showLevels() {
        resetGame();
        levelsScreen.style.display = 'flex';
        profileScreen.style.display = 'none';
        gameScreen.style.display = 'none';
        shopScreen.style.display = 'none';
        exitScreen.style.display = 'none';
        bottomNav.style.display = 'flex';
        setActiveTab('levels');
        animateTab(levelsScreen);
        renderLevelMap();
        requestAnimationFrame(drawAllLevelConnections);
    }

    function showProfile() {
        resetGame();
        levelsScreen.style.display = 'none';
        profileScreen.style.display = 'block';
        gameScreen.style.display = 'none';
        shopScreen.style.display = 'none';
        exitScreen.style.display = 'none';
        bottomNav.style.display = 'flex';
        setActiveTab('profile');
        animateTab(profileScreen);
        profileNameInput.value = playerProfile.name;
        renderProfile();
    }

    function animateTab(screen) {
        screen.classList.remove('tab-screen-enter');
        void screen.offsetWidth;
        screen.classList.add('tab-screen-enter');
    }

    function attemptExit() {
        window.close();
        window.setTimeout(() => {
            if (!window.closed) {
                levelsScreen.style.display = 'none';
                profileScreen.style.display = 'none';
                gameScreen.style.display = 'none';
                shopScreen.style.display = 'none';
                bottomNav.style.display = 'none';
                exitScreen.style.display = 'block';
            }
        }, 100);
    }

    // Return to the level map from a game.
    if (backBtn) {
        backBtn.addEventListener('click', showLevels);
    }

    exitBtn.addEventListener('click', attemptExit);
    returnFromExitBtn.addEventListener('click', showLevels);
    subjectMapTabs.addEventListener('click', event => {
        const tab = event.target.closest('.subject-map-tab');
        if (tab) setMapSubject(tab.dataset.subject);
    });
    subjectMapTabs.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        const tabs = [...subjectMapTabs.querySelectorAll('.subject-map-tab')];
        const currentIndex = tabs.indexOf(event.target);
        if (currentIndex < 0) return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const nextTab = tabs[(currentIndex + direction + tabs.length) % tabs.length];
        nextTab.focus();
        setMapSubject(nextTab.dataset.subject);
    });
    bottomNav.addEventListener('click', event => {
        const button = event.target.closest('.bottom-nav-item');
        if (!button) return;
        if (button.dataset.tab === 'levels') showLevels();
        if (button.dataset.tab === 'profile') showProfile();
    });
    themeToggleBtn.addEventListener('click', () => {
        selectedTheme = selectedTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(themeStorageKey, selectedTheme);
        applyFreeTheme();
    });
    profileNameForm.addEventListener('submit', event => {
        event.preventDefault();
        if (savePlayerName(profileNameInput.value)) {
            profileNameInput.value = playerProfile.name;
            document.getElementById('profile-name-feedback').textContent = 'Имя сохранено!';
        } else {
            document.getElementById('profile-name-feedback').textContent = 'Введи имя, чтобы сохранить.';
        }
    });
    namePromptForm.addEventListener('submit', event => {
        event.preventDefault();
        if (!savePlayerName(playerNameInput.value)) {
            document.getElementById('name-prompt-feedback').textContent = 'Пожалуйста, напиши своё имя.';
            playerNameInput.focus();
            return;
        }
        namePrompt.style.display = 'none';
        document.getElementById('name-prompt-feedback').textContent = '';
    });
    window.addEventListener('resize', () => requestAnimationFrame(drawAllLevelConnections));

    // Shop button handlers
    if (shopBtn) {
        shopBtn.addEventListener('click', showShop);
    }

    if (closeShopBtn) {
        closeShopBtn.addEventListener('click', hideShop);
    }

    // Initialize
    initStars();
    initCanvas();
    updateCoinsBadge();
    applyFreeTheme();
    renderLevelMap();
    setMapSubject(selectedMapSubject);
    showLevels();
    if (!playerProfile.name) {
        namePrompt.style.display = 'flex';
        playerNameInput.focus();
    }
});
