// ==UserScript==
// @name         Blum Autoclicker
// @version      1.6
// @namespace    Violentmonkey Scripts
// @author       mudachyo
// @match        https://telegram.blum.codes/*
// @grant        none
// @icon         https://cdn.prod.website-files.com/65b6a1a4a0e2af577bccce96/65ba99c1616e21b24009b86c_blum-256.png
// @downloadURL  https://github.com/mudachyo/Blum/raw/main/blum-autoclicker.user.js
// @updateURL    https://github.com/mudachyo/Blum/raw/main/blum-autoclicker.user.js
// @homepage     https://github.com/mudachyo/Blum
// ==/UserScript==

let GAME_SETTINGS = {
    minBombHits: Math.floor(Math.random() * 2), // Минимальное количество нажатий на бомбу в процентах / Percentage probability of pressing the bomb
    minIceHits: Math.floor(Math.random() * 2) + 2, // Минимальное количество нажатий на заморозку / Minimum number of freeze hits
    flowerSkipPercentage: Math.floor(Math.random() * 11) + 15, // Вероятность нажатия на цветок в процентах / Percentage probability of clicking on a flower
    minDelayMs: 2000, // Минимальная задержка между действиями в миллисекундах / Minimum delay between actions in milliseconds
    maxDelayMs: 5000, // Максимальная задержка между действиями в миллисекундах / Maximum delay between actions in milliseconds
};

let isGamePaused = false;

try {
    let gameStats = {
        score: 0,
        bombHits: 0,
        iceHits: 0,
        flowersSkipped: 0,
        isGameOver: false,
    };

    const originalPush = Array.prototype.push;
    Array.prototype.push = function (...items) {
        if (!isGamePaused) {
            items.forEach(item => handleGameElement(item));
        }
        return originalPush.apply(this, items);
    };

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
            case "FREEZE":
                processIce(element);
                break;
        }
    }

    function processFlower(element) {
        const shouldSkip = Math.random() < (GAME_SETTINGS.flowerSkipPercentage / 100);
        if (shouldSkip) {
            gameStats.flowersSkipped++;
        } else {
            gameStats.score++;
            clickElement(element);
        }
    }

    function processBomb(element) {
        if (gameStats.bombHits < GAME_SETTINGS.minBombHits) {
            gameStats.score = 0;
            clickElement(element);
            gameStats.bombHits++;
        }
    }

    function processIce(element) {
        if (gameStats.iceHits < GAME_SETTINGS.minIceHits) {
            clickElement(element);
            gameStats.iceHits++;
        }
    }

    function clickElement(element) {
        element.onClick(element);
        element.isExplosion = true;
        element.addedAt = performance.now();
    }

    function checkGameCompletion() {
        const rewardElement = document.querySelector('#app > div > div > div.content > div.reward');
        if (rewardElement && !gameStats.isGameOver) {
            gameStats.isGameOver = true;
            resetGameStats();
            resetGameSettings();
        }
    }

    function resetGameStats() {
        gameStats = {
            score: 0,
            bombHits: 0,
            iceHits: 0,
            flowersSkipped: 0,
            isGameOver: false,
        };
    }

    function resetGameSettings() {
        GAME_SETTINGS = {
            minBombHits: Math.floor(Math.random() * 2),  // Минимальное количество нажатий на бомбу в процентах / Percentage probability of pressing the bomb
            minIceHits: Math.floor(Math.random() * 2) + 2, // Минимальное количество нажатий на заморозку / Minimum number of freeze hits
            flowerSkipPercentage: Math.floor(Math.random() * 11) + 15, // Вероятность нажатия на цветок в процентах / Percentage probability of clicking on a flower
            minDelayMs: 2000, // Минимальная задержка между действиями в миллисекундах / Minimum delay between actions in milliseconds
            maxDelayMs: 5000, // Максимальная задержка между действиями в миллисекундах / Maximum delay between actions in milliseconds
        };
    }

    function getNewGameDelay() {
        return Math.floor(Math.random() * (3000 - 1000 + 1) + 1000);
    }

    function checkAndClickPlayButton() {
        const playButton = document.querySelector('button.kit-button.is-large.is-primary');
        if (!isGamePaused && playButton && playButton.textContent.includes('Play')) {
            setTimeout(() => {
                playButton.click();
                gameStats.isGameOver = false;
            }, getNewGameDelay());
        }
    }

    function continuousPlayButtonCheck() {
        checkAndClickPlayButton();
        setTimeout(continuousPlayButtonCheck, 1000);
    }

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                checkGameCompletion();
            }
        }
    });

    const appElement = document.querySelector('#app');
    if (appElement) {
        observer.observe(appElement, { childList: true, subtree: true });
    }

    continuousPlayButtonCheck();

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
}