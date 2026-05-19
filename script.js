document.addEventListener('DOMContentLoaded', () => {
    // Screen elements
    const menuScreen = document.getElementById('menu-screen');
    const gameScreen = document.getElementById('game-screen');
    const shopScreen = document.getElementById('shop-screen');
    const startBtn = document.getElementById('startBtn');
    const backBtn = document.getElementById('backBtn');
    const shopBtn = document.getElementById('shopBtn');
    const closeShopBtn = document.getElementById('closeShopBtn');

    // Game elements
    const questionEl = document.getElementById('question');
    const optionsEl = document.getElementById('options');
    const feedbackEl = document.getElementById('feedback');
    const scoreEl = document.getElementById('score');
    const timerEl = document.getElementById('timer');
    const nextBtn = document.getElementById('nextBtn');
    const starsContainer = document.getElementById('stars');
    const confettiContainer = document.getElementById('confetti-container');

    // Step elements
    const stepSubject = document.getElementById('step-subject');
    const stepMath = document.getElementById('step-math');
    const stepRussian = document.getElementById('step-russian');
    const backToSubjectBtn = document.getElementById('backToSubject');
    const backToSubjectFromRu = document.getElementById('backToSubjectFromRu');

    // Hidden selects for state
    const gameSelect = document.getElementById('gameSelect');
    const ruModeSelect = document.getElementById('ruModeSelect');
    const modeSelect = document.getElementById('modeSelect');
    const opSelect = document.getElementById('opSelect'); // Keep for compatibility but not used in UI

    // Button groups
    const subjectButtons = document.getElementById('subject-buttons');
    const ruModeButtons = document.getElementById('ru-mode-buttons');
const difficultyButtons = document.getElementById('mode-buttons');
const operationButtons = null; // Since we don't have operation buttons in UI

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
    let gameWon = false;
    let coins = localStorage.getItem('coins') ? parseInt(localStorage.getItem('coins')) : 0;
    let purchasedItems = localStorage.getItem('purchasedItems') ? JSON.parse(localStorage.getItem('purchasedItems')) : [];
    let activeItems = localStorage.getItem('activeItems') ? JSON.parse(localStorage.getItem('activeItems')) : {};

    // Shop items
    const shopItems = [
        { id: 'item1', name: 'Новый фон', icon: '🎨', price: 50 },
        { id: 'item2', name: 'Звуки', icon: '🔊', price: 30 },
        { id: 'item3', name: 'Темная тема', icon: '🌙', price: 40 },
        { id: 'item4', name: 'Бонус времени', icon: '⏱️', price: 60 }
    ];

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
            starsContainer.appendChild(star);
            stars.push(star);
        }
    }

    // Update stars
    function updateStars() {
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < correctStreak);
        });
        if (correctStreak >= maxStars && !gameWon) {
            gameWon = true;
            showVictory();
        }
    }

    // Show victory
    function showVictory() {
        clearTimer();
        coins += 10; // Award coins for victory
        localStorage.setItem('coins', coins);
        updateMenuCoins();
        feedbackEl.innerHTML = '<div style="font-size: 2rem; color: #2e7d32; font-weight: bold;">🎉 ПОБЕДА! 🎉<br>+10 монет</div>';
        nextBtn.textContent = 'В меню';
        nextBtn.style.display = 'block';
        document.querySelectorAll('.option').forEach(o => o.disabled = true);
        launchConfetti();
        launchCoins();
        playSound('correct');
    }

    // Shop functions
    function showShop() {
        menuScreen.style.display = 'none';
        shopScreen.style.display = 'block';
        renderShopItems();
        updateCoinsDisplay();
    }

    function hideShop() {
        shopScreen.style.display = 'none';
        menuScreen.style.display = 'block';
    }

    function updateCoinsDisplay() {
        document.getElementById('coins-count').textContent = coins;
        updateMenuCoins();
    }

    function renderShopItems() {
        const shopItemsContainer = document.getElementById('shop-items');
        shopItemsContainer.innerHTML = '';
        shopItems.forEach(item => {
            const isPurchased = purchasedItems.includes(item.id);
            const isActive = activeItems[item.id];
            const itemEl = document.createElement('div');
            itemEl.className = 'shop-item';
            itemEl.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-price">💰 ${item.price}</div>
                <div class="shop-item-buttons">
                    ${!isPurchased ?
                        `<button class="shop-item-btn buy-btn" data-id="${item.id}">Купить</button>` :
                        `<button class="shop-item-btn apply-btn ${isActive ? 'active' : ''}" data-id="${item.id}">
                            ${isActive ? '✓ Применено' : 'Применить'}
                        </button>`
                    }
                </div>
            `;
            shopItemsContainer.appendChild(itemEl);

            const btn = itemEl.querySelector('button');
            if (!isPurchased) {
                btn.addEventListener('click', () => buyItem(item));
            } else {
                btn.addEventListener('click', () => toggleItem(item));
            }
        });
    }

    function buyItem(item) {
        if (coins >= item.price && !purchasedItems.includes(item.id)) {
            coins -= item.price;
            purchasedItems.push(item.id);
            localStorage.setItem('coins', coins);
            localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));
            updateMenuCoins();
            renderShopItems();
            updateCoinsDisplay();
            playSound('correct');
        }
    }

    function toggleItem(item) {
        if (activeItems[item.id]) {
            delete activeItems[item.id];
        } else {
            activeItems[item.id] = true;
        }
        localStorage.setItem('activeItems', JSON.stringify(activeItems));
        applyItem(item);
        renderShopItems();
    }

    function applyItem(item) {
        playSound('correct');
        switch(item.id) {
            case 'item1': // Новый фон
                document.body.style.background = activeItems['item1'] ?
                    'linear-gradient(135deg, #fce4ec, #f3e5f5)' :
                    'linear-gradient(135deg, #fff8e1, #e3f2fd)';
                break;
            case 'item2': // Звуки
                // Звуки меняются автоматически в функции playSound()
                break;
            case 'item3': // Темная тема
                if (activeItems['item3']) {
                    document.body.style.background = 'linear-gradient(135deg, #1a1a1a, #2d2d2d)';
                    document.querySelectorAll('.container').forEach(el => {
                        el.style.background = 'rgba(45,45,45,0.95)';
                        el.style.color = '#fff';
                    });
                } else {
                    document.body.style.background = 'linear-gradient(135deg, #fff8e1, #e3f2fd)';
                    document.querySelectorAll('.container').forEach(el => {
                        el.style.background = 'rgba(255,255,255,0.95)';
                        el.style.color = '#333';
                    });
                }
                break;
            case 'item4': // Бонус времени
                // Будет применяться при генерации вопроса
                break;
        }
    }

    function updateMenuCoins() {
        const menuCoinsEl = document.getElementById('menu-coins');
        if (menuCoinsEl) menuCoinsEl.textContent = coins;
    }

    // Get max number for wrong answer generation
    function maxNumber() {
        return 20; // Fixed max for wrong answers
    }

    // Get random number based on mode
    function getRandomNumber() {
        const mode = modeSelect.value;
        let max = 5;
        if (mode === 'examples') max = 10;
        return Math.floor(Math.random() * max) + 1;
    }

    // Timer functions
    function startTimer(seconds) {
        // Apply time bonus if item4 is active
        if (activeItems['item4']) {
            seconds = Math.floor(seconds * 1.5); // 50% больше времени
        }
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

            // Different sounds based on item2 (new sound purchase)
            if (activeItems['item2']) {
                // New sounds - higher pitched and more cheerful
                oscillator.frequency.value = type === 'correct' ? 1200 : type === 'wrong' ? 300 : 600;
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.15);
            } else {
                // Default sounds
                oscillator.frequency.value = type === 'correct' ? 800 : type === 'wrong' ? 200 : 400;
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.2);
            }
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

    // Option click handler
    function handleOptionClick(btn, value) {
        clearTimer();
        document.querySelectorAll('.option').forEach(o => o.disabled = true);
        const isCorrect = Number(value) === currentAnswer;

        if (isCorrect) {
            btn.classList.add('correct');
            feedbackEl.textContent = 'Правильно!';
            feedbackEl.style.color = '#2e7d32';
            score++;
            correctStreak = Math.min(correctStreak + 1, maxStars);
            scoreEl.textContent = `Счёт: ${score}`;
            updateStars();
            launchConfetti();
            playSound('correct');

            setTimeout(() => {
                if (gameWon) {
                    nextBtn.click();
                } else {
                    generateQuestion();
                }
            }, 3000);
        } else {
            btn.classList.add('wrong');
            feedbackEl.textContent = `Неправильно. Правильный ответ: ${currentAnswer}`;
            feedbackEl.style.color = '#c62828';
            correctStreak = 0;
            updateStars();
            document.querySelectorAll('.option').forEach(o => {
                if (Number(o.textContent) === currentAnswer) {
                    o.classList.add('correct');
                }
            });
            playSound('wrong');

            setTimeout(() => {
                generateQuestion();
            }, 3000);
        }
    }

    // Time out
    function timeOut() {
        clearTimeout(window.russianCheckTimeout);
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
        correctStreak = 0;
        updateStars();
        playSound('timeout');

        setTimeout(() => {
            generateQuestion();
        }, 3000);
    }

    // Generate question
    function generateQuestion() {
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
        startTimer(15);
    }

    // Math question
    function generateMathQuestion() {
        let a, b, answer, opSymbol;
        do {
            a = getRandomNumber();
            b = getRandomNumber();
            const op = opSelect.value;
            if (op === 'add' || op === 'both' || op === 'all') {
                answer = a + b;
                opSymbol = '+';
                break;
            }
            if (op === 'both' || op === 'all') {
                if (a >= b) {
                    answer = a - b;
                    opSymbol = '-';
                    break;
                }
            }
            if (op === 'all') {
                answer = a * b;
                opSymbol = '×';
                break;
            }
            answer = a + b;
            opSymbol = '+';
        } while (false);

        questionEl.textContent = `Сколько будет ${a} ${opSymbol} ${b}?`;
        currentAnswer = answer;

        const options = [answer];
        while (options.length < 4) {
            let wrong;
            if (opSelect.value === 'all') {
                wrong = Math.floor(Math.random() * 40) + 1;
            } else {
                wrong = Math.floor(Math.random() * (maxNumber() * 2)) + 1;
            }
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
        while (options.length < 4) {
            const wrong = Math.floor(Math.random() * (maxNumber() * 2)) + 1;
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
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            isDrawing = true;
            ctx.beginPath();
            ctx.moveTo(x, y);
        });
        letterCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isDrawing) return;
            const touch = e.touches[0];
            const rect = letterCanvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
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
    currentRussianLetter = russianLetters[Math.floor(Math.random() * russianLetters.length)];
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

    function generateRussianWord() {
        const idx = Math.floor(Math.random() * russianWords.length);
        const item = russianWords[idx];
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
    currentRussianWord = russianWords[Math.floor(Math.random() * russianWords.length)].word;
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
    const idx = Math.floor(Math.random() * russianLetters.length);
    currentRussianLetter = russianLetters[idx];
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
            feedbackEl.textContent = 'Правильно!';
            feedbackEl.style.color = '#2e7d32';
            score++;
            correctStreak = Math.min(correctStreak + 1, maxStars);
            scoreEl.textContent = `Счёт: ${score}`;
            updateStars();
            launchConfetti();
            playSound('correct');
            russianTextInput.value = '';
            clearCanvas();

            setTimeout(() => {
                if (gameWon) {
                    nextBtn.click();
                } else {
                    generateQuestion();
                }
            }, 3000);
        } else {
            feedbackEl.textContent = `Неправильно. Ответ: ${currentAnswer}`;
            feedbackEl.style.color = '#c62828';
            correctStreak = 0;
            updateStars();
            playSound('wrong');

            setTimeout(() => {
                generateQuestion();
            }, 3000);
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
        clearTimeout(window.russianCheckTimeout);
        clearTimer();
        feedbackEl.textContent = 'Правильно!';
        feedbackEl.style.color = '#2e7d32';
        score++;
        correctStreak = Math.min(correctStreak + 1, maxStars);
        scoreEl.textContent = `Счёт: ${score}`;
        updateStars();
        launchConfetti();
        playSound('correct');
        clearCanvas();

        setTimeout(() => {
            if (gameWon) {
                nextBtn.click();
            } else {
                generateQuestion();
            }
        }, 3000);
    }

    // Next button
    nextBtn.addEventListener('click', () => {
        if (gameWon) {
            gameWon = false;
            nextBtn.textContent = 'Следующий вопрос';
            showMenu();
        } else {
            generateQuestion();
        }
    });

    // Reset game (reset state but don't start)
    function resetGame() {
        score = 0;
        correctStreak = 0;
        scoreEl.textContent = `Счёт: ${score}`;
        updateStars();
        clearTimer();
        clearTimeout(window.russianCheckTimeout);
        russianTextInput.removeEventListener('input', validateRussianInput);
        russianTextInput.value = '';
        clearCanvas();
    }

    // Show menu
    function showMenu() {
        menuScreen.style.display = 'block';
        gameScreen.style.display = 'none';
        shopScreen.style.display = 'none';
        // Reset to initial menu state
        stepSubject.style.display = 'block';
        stepMath.style.display = 'none';
        stepRussian.style.display = 'none';
        resetGame();
    }

    // Show game
    function showGame() {
        console.log('showGame called');
        menuScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        generateQuestion();
    }

    // Subject button handlers
    if (subjectButtons) {
        subjectButtons.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Subject selected:', btn.dataset.value);
                subjectButtons.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                gameSelect.value = btn.dataset.value;

                // Show appropriate options step and sync hidden selects
                if (btn.dataset.value === 'russian') {
                    console.log('Showing Russian mode options');
                    stepRussian.style.display = 'block';
                    stepMath.style.display = 'none';
                    // Sync Russian mode select
                    const activeRuBtn = ruModeButtons.querySelector('.option-btn.active');
                    if (activeRuBtn) ruModeSelect.value = activeRuBtn.dataset.value;
                } else {
                    console.log('Showing Math mode options');
                    stepMath.style.display = 'block';
                    stepRussian.style.display = 'none';
                    // Sync difficulty and operation selects
                    const activeDiff = difficultyButtons.querySelector('.option-btn.active');
                    if (activeDiff) modeSelect.value = activeDiff.dataset.value;
                    // operationButtons is null, so skip this
                    // Set default operation (addition) since we don't have UI for it
                    opSelect.value = 'add';
                }
            });
        });
    }

    // Math option handlers
    if (difficultyButtons) {
        difficultyButtons.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Math mode clicked:', btn.dataset.value);
                difficultyButtons.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                modeSelect.value = btn.dataset.value;
                // Auto-start game after selecting mode
                setTimeout(() => {
                    resetGame();
                    gameWon = false;
                    showGame();
                }, 300);
            });
        });
    }

    if (operationButtons) {
        operationButtons.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                operationButtons.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                opSelect.value = btn.dataset.value;
            });
        });
    }

    // Russian option handlers
    if (ruModeButtons) {
        ruModeButtons.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                ruModeButtons.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                ruModeSelect.value = btn.dataset.value;
                // Auto-start game after selecting mode
                setTimeout(() => {
                    resetGame();
                    gameWon = false;
                    showGame();
                }, 300);
            });
        });
    }

    // Back buttons
    if (backToSubjectBtn) {
        backToSubjectBtn.addEventListener('click', () => {
            stepMath.style.display = 'none';
        });
    }
    if (backToSubjectFromRu) {
        backToSubjectFromRu.addEventListener('click', () => {
            stepRussian.style.display = 'none';
        });
    }

    // Start button
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            resetGame();
            gameWon = false;
            showGame();
        });
    }

    // Back to menu from game
    if (backBtn) {
        backBtn.addEventListener('click', showMenu);
    }

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
    updateMenuCoins();
    // Apply active items on load
    shopItems.forEach(item => {
        if (activeItems[item.id]) {
            applyItem(item);
        }
    });
    showMenu();
});
