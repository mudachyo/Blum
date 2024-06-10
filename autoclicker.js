// Настройки игры
const GAME_SETTINGS = {
    minBombHits: 2, // Минимальное количество бомб, которые должен обработать скрипт
    minIceHits: 2, // Минимальное количество заморозок, которые должен обработать скрипт
    flowerSkipPercentage: 22, // Процент пропуска цветков
    minDelayMs: 2000, // Минимальная задержка перед запуском следующей игры в миллисекундах (2 секунды)
    maxDelayMs: 5000, // Максимальная задержка перед запуском следующей игры в миллисекундах (5 секунд)
};

// Переменная для хранения состояния паузы игры
let isGamePaused = false;

try {
    console.log('Script started');

    // Объект для отслеживания статистики игры
    let gameStats = {
        score: 0,
        bombHits: 0,
        iceHits: 0,
        flowersSkipped: 0,
        isGameOver: false,
    };

    // Переопределение метода push для массива
    const originalPush = Array.prototype.push;
    Array.prototype.push = function (...items) {
        // Если игра не на паузе, обрабатываем элементы
        if (!isGamePaused) {
            items.forEach(item => handleGameElement(item));
        }
        return originalPush.apply(this, items);
    };

    // Обработка игровых элементов
    function handleGameElement(element) {
        if (!element || !element.item) return;

        const { type } = element.item;
        switch (type) {
            case "CLOVER":
                processFlower(element);
                break;
            case "BOMB":
                processBomb(element);
                break;
            case "ICE":
                processIce(element);
                break;
        }
    }

    // Обработка цветков
    function processFlower(element) {
        const shouldSkip = Math.random() < (GAME_SETTINGS.flowerSkipPercentage / 100);
        if (shouldSkip) {
            gameStats.flowersSkipped++;
        } else {
            gameStats.score++;
            clickElement(element);
        }
    }

    // Обработка бомб
    function processBomb(element) {
        if (gameStats.bombHits < GAME_SETTINGS.minBombHits) {
            gameStats.score = 0;
            clickElement(element);
            gameStats.bombHits++;
        }
    }

    // Обработка заморозок
    function processIce(element) {
        if (gameStats.iceHits < GAME_SETTINGS.minIceHits) {
            clickElement(element);
            gameStats.iceHits++;
        }
    }

    // Имитация клика по элементу игры
    function clickElement(element) {
        element.onClick(element);
        element.isExplosion = true;
        element.addedAt = performance.now();
    }

    // Проверка на завершение игры
    function checkGameCompletion() {
        const rewardElement = document.querySelector('#app > div > div > div.content > div.reward');
        if (rewardElement && !gameStats.isGameOver) {
            gameStats.isGameOver = true;
            logGameStats(); // Вывод статистики перед её сбросом
            resetGameStats();
            if (window.__NUXT__.state.$s$0olocQZxou.playPasses > 0) {
                startNewGame();
            }
        }
    }

    // Вывод текущей статистики игры
    function logGameStats() {
        console.log(`Game Over. Stats: Score: ${gameStats.score}, Bombs: ${gameStats.bombHits}, Ice: ${gameStats.iceHits}, Flowers Skipped: ${gameStats.flowersSkipped}`);
    }

    // Сброс статистики игры
    function resetGameStats() {
        gameStats = {
            score: 0,
            bombHits: 0,
            iceHits: 0,
            flowersSkipped: 0,
            isGameOver: false,
        };
    }

    // Получение случайной задержки перед запуском следующей игры
    function getRandomDelay() {
        return Math.random() * (GAME_SETTINGS.maxDelayMs - GAME_SETTINGS.minDelayMs) + GAME_SETTINGS.minDelayMs;
    }

    // Запуск новой игры
    function startNewGame() {
        setTimeout(() => {
            const newGameButton = document.querySelector("#app > div > div > div.buttons > button:nth-child(2)");
            if (newGameButton) {
                newGameButton.click();
            }
            gameStats.isGameOver = false;
        }, getRandomDelay());
    }

    // Наблюдатель за изменениями в DOM
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                checkGameCompletion();
            }
        }
    });

    // Наблюдение за основным элементом приложения
    const appElement = document.querySelector('#app');
    if (appElement) {
        observer.observe(appElement, { childList: true, subtree: true });
    }

    // Создание кнопки для паузы/возобновления скрипта
    const pauseButton = document.createElement('button');
    pauseButton.textContent = 'Pause';
    pauseButton.style.position = 'fixed';
    pauseButton.style.bottom = '20px';
    pauseButton.style.right = '20px';
    pauseButton.style.zIndex = '9999';
    pauseButton.style.padding = '4px 8px';
    pauseButton.style.backgroundColor = '#5d5abd';
    pauseButton.style.color = 'white';
    pauseButton.style.border = 'none';
    pauseButton.style.borderRadius = '10px';
    pauseButton.style.cursor = 'pointer';
    pauseButton.onclick = toggleGamePause;
    document.body.appendChild(pauseButton);

    function toggleGamePause() {
        isGamePaused = !isGamePaused;
        pauseButton.textContent = isGamePaused ? 'Resume' : 'Pause';
    }
} catch (e) {
    console.log('Failed to initiate the game script');
}
