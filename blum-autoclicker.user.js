// ==UserScript==
// @name         Blum Autoclicker
// @version      2.2
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
    minBombHits: Math.floor(Math.random() * 2),
    minIceHits: Math.floor(Math.random() * 2) + 2,
    flowerSkipPercentage: Math.floor(Math.random() * 11) + 15,
    minDelayMs: 2000,
    maxDelayMs: 5000,
    autoClickPlay: false
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

    function getNewGameDelay() {
        return Math.floor(Math.random() * (GAME_SETTINGS.maxDelayMs - GAME_SETTINGS.minDelayMs + 1) + GAME_SETTINGS.minDelayMs);
    }

  function checkAndClickPlayButton() {
    const playButtons = document.querySelectorAll('button.kit-button.is-large.is-primary, a.play-btn[href="/game"], button.kit-button.is-large.is-primary');

    playButtons.forEach(button => {
        if (!isGamePaused && GAME_SETTINGS.autoClickPlay && (/Play/.test(button.textContent) || /Continue/.test(button.textContent))) {
            setTimeout(() => {
                button.click();
                gameStats.isGameOver = false;
            }, getNewGameDelay());
        }
    });
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

  const settingsMenu = document.createElement('div');
  settingsMenu.className = 'settings-menu';
  settingsMenu.style.display = 'none';

  const menuTitle = document.createElement('h3');
  menuTitle.className = 'settings-title';
  menuTitle.textContent = 'Blum Autoclicker';

  const closeButton = document.createElement('button');
  closeButton.className = 'settings-close-button';
  closeButton.textContent = '×';
  closeButton.onclick = () => {
    settingsMenu.style.display = 'none';
  };

  menuTitle.appendChild(closeButton);
  settingsMenu.appendChild(menuTitle);
  
  function updateSettingsMenu() {
    document.getElementById('flowerSkipPercentage').value = GAME_SETTINGS.flowerSkipPercentage;
    document.getElementById('flowerSkipPercentageDisplay').textContent = GAME_SETTINGS.flowerSkipPercentage;
    document.getElementById('minIceHits').value = GAME_SETTINGS.minIceHits;
    document.getElementById('minIceHitsDisplay').textContent = GAME_SETTINGS.minIceHits;
    document.getElementById('minBombHits').value = GAME_SETTINGS.minBombHits;
    document.getElementById('minBombHitsDisplay').textContent = GAME_SETTINGS.minBombHits;
    document.getElementById('minDelayMs').value = GAME_SETTINGS.minDelayMs;
    document.getElementById('minDelayMsDisplay').textContent = GAME_SETTINGS.minDelayMs;
    document.getElementById('maxDelayMs').value = GAME_SETTINGS.maxDelayMs;
    document.getElementById('maxDelayMsDisplay').textContent = GAME_SETTINGS.maxDelayMs;
    document.getElementById('autoClickPlay').checked = GAME_SETTINGS.autoClickPlay;
  }

  settingsMenu.appendChild(createSettingElement('Flower Skip (%)', 'flowerSkipPercentage', 'range', 0, 100, 1,
    'EN: Percentage probability of skipping a flower.<br>' +
    'RU: Вероятность пропуска цветка в процентах.'));
  settingsMenu.appendChild(createSettingElement('Min Freeze Hits', 'minIceHits', 'range', 1, 10, 1,
    'EN: Minimum number of clicks per freeze.<br>' +
    'RU: Минимальное количество кликов на заморозку.'));
  settingsMenu.appendChild(createSettingElement('Min Bomb Hits', 'minBombHits', 'range', 0, 10, 1,
    'EN: Minimum number of clicks per bomb.<br>' +
    'RU: Минимальное количество кликов на бомбу.'));
  settingsMenu.appendChild(createSettingElement('Min Delay (ms)', 'minDelayMs', 'range', 10, 10000, 10,
    'EN: Minimum delay between clicks.<br>' +
    'RU: Минимальная задержка между кликами.'));
  settingsMenu.appendChild(createSettingElement('Max Delay (ms)', 'maxDelayMs', 'range', 10, 10000, 10,
    'EN: Maximum delay between clicks.<br>' +
    'RU: Максимальная задержка между кликами.'));
  settingsMenu.appendChild(createSettingElement('Auto Click Play', 'autoClickPlay', 'checkbox', null, null, null,
    'EN: Automatically start the next game at the end of.<br>' +
    'RU: Автоматически начинать следующую игру по окончании.'));

  const pauseResumeButton = document.createElement('button');
  pauseResumeButton.textContent = 'Pause';
  pauseResumeButton.className = 'pause-resume-btn';
  pauseResumeButton.onclick = toggleGamePause;
  settingsMenu.appendChild(pauseResumeButton);

  const socialButtons = document.createElement('div');
  socialButtons.className = 'social-buttons';

  const githubButton = document.createElement('a');
  githubButton.href = 'https://github.com/mudachyo/Blum';
  githubButton.target = '_blank';
  githubButton.className = 'social-button';
  githubButton.innerHTML = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADtklEQVR4nO2ZSWgVQRCGP2OCS3CJYoy7uCtiDi6o8aAIikvQi4oGvCiiRo2E6FXJQdxQg4LgUTx4cyPuHhVRD0bcsyDu4IJrTNTnSEMNPOfNm1czb2YSJD8UDNNT1fV3V1dX90AH/l8UAEuBfUAt8Bj4CLSKmOdH0ma+WQL0pp2gC1AGXAJ+A5ZPMToXgFViK3Z0AyqBVwGcTycvga1A17hILAAaQiTglHpgfpQEzNTXREjAKcdl5kNFf+BOjCQskVtAYVgkhst0W20kT8WHrNBP0qjVxtIAFAUl0bWNwsnyCLNAKfpoO3DecsjhICnWy+B2CbspwA7gWRbOmd1+G1As1cGBDN/P05LoptgnBruEoSH0A7gKVACzgNFAvsgYebcROAN8BTYDnR22ihWLXxVilYpRTLf75mlHy+PbAYr+zUB5oouy7Ah9o0pCkaL/F5lmpUwZ1+MiJFKi9GGll5FLSiPLIyRSrvThfDoDBT5K8eoIiRxT+vAL6OlmYKnSwGdZkFFhPPBT6Uupm4H9SmWT56PGSaUve92Ua5XK02Igskzpy1k35afKuMyNgchYJRFT0KbgvULRfBMHhiiJvHNTblUomm86xUBkoiMKPor8cfjT4qZsZ4rZUu+MAPoAA+XZljiIJCNXtoYC6dtUFYOSBjYFn6TxJnAXaJRQeiPPtqwgehz2iIrvScvAzFIKnkjjNUmxWyRPm4p1khw37VGJGjnS11BggmTKRVI575a7MPsIkIKL0rhLqsuDwCngOlAns/FBpnN1xLPRIqPdBDwAbgPngCNyFtrvVaZUKzOFkW8yU2FjncuC9pKdbkbm+jBgpBlYE1KomZJ8j08SRua4GeuuTMFOuSFryXnS0yBfBqMxQL8tXucie504xZxT1soGlM7wW+AEsEFGaiTQK8l2XznHmOvQKikvvgYgYImYkiotSj1SXomcwd8qw65KbihtFMq75iyct5JkYaa015RGsU7apwJfMpAwpNOhJAQy9eKLJyo8DJhcbpcQFyU07J84z4ErwOJMHQDrsyRSrr3duBckLn0gx6MPK4Pc9VOBzwQSLkYSIe4fGwKQSADT/XZ0JI2xT3KxNlgTpx4YFYBITZCO8qTu8tNRZ5/2/di+7PMC8B/09BnLfqG1+yCMP8DDgIdtSOS+nBhDQQ+pNOMmciWKf/F5UmInYiCSAA5FfdExWc4HURGpA2YQE3IlBTc4fvj7xeskfWNrU0zXTSnIkbLldFL54gelorswyz2pAx0gIvwFLXDNiM6zHVAAAAAASUVORK5CYII=">GitHub';
  socialButtons.appendChild(githubButton);

  const telegramButton = document.createElement('a');
  telegramButton.href = 'https://t.me/shopalenka';
  telegramButton.target = '_blank';
  telegramButton.className = 'social-button';
  telegramButton.innerHTML = '<img src="data:image/png;base64,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">Telegram Channel';
  socialButtons.appendChild(telegramButton);

  const donateButton = document.createElement('a');
  donateButton.href = 'https://mudachyo.codes/donate/';
  donateButton.target = '_blank';
  donateButton.className = 'social-button';
  donateButton.innerHTML = '<img src="data:image/png;base64,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">Donate';
  socialButtons.appendChild(donateButton);

  settingsMenu.appendChild(socialButtons);

  document.body.appendChild(settingsMenu);

  const settingsButton = document.createElement('button');
  settingsButton.className = 'settings-button';
  settingsButton.textContent = '⚙️';
  settingsButton.onclick = () => {
    settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
  };
  document.body.appendChild(settingsButton);

  const style = document.createElement('style');
  style.textContent = `
    .settings-menu {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(40, 44, 52, 0.95);
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
      color: #abb2bf;
      font-family: 'Arial', sans-serif;
      z-index: 10000;
      padding: 20px;
      width: 300px;
    }
    .settings-title {
      color: #61afef;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .settings-close-button {
      background: none;
      border: none;
      color: #e06c75;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
    }
    .setting-item {
      margin-bottom: 12px;
    }
    .setting-label {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
    .setting-label-text {
      color: #e5c07b;
      margin-right: 5px;
    }
    .help-icon {
      cursor: help;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: #61afef;
      color: #282c34;
      font-size: 10px;
      font-weight: bold;
    }
    .setting-input {
      display: flex;
      align-items: center;
    }
    .setting-slider {
      flex-grow: 1;
      margin-right: 8px;
    }
    .setting-value {
      min-width: 30px;
      text-align: right;
      font-size: 11px;
    }
    .tooltip {
      position: relative;
    }
    .tooltip .tooltiptext {
      visibility: hidden;
      width: 200px;
      background-color: #4b5263;
      color: #fff;
      text-align: center;
      border-radius: 6px;
      padding: 5px;
      position: absolute;
      z-index: 1;
      bottom: 125%;
      left: 50%;
      margin-left: -100px;
      opacity: 0;
      transition: opacity 0.3s;
      font-size: 11px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .tooltip:hover .tooltiptext {
      visibility: visible;
      opacity: 1;
    }
    .pause-resume-btn {
      display: block;
      width: calc(100% - 10px);
      padding: 8px;
      margin: 15px 5px;
      background-color: #98c379;
      color: #282c34;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      transition: background-color 0.3s;
    }
    .pause-resume-btn:hover {
      background-color: #7cb668;
    }
    .social-buttons {
      margin-top: 15px;
      display: flex;
      justify-content: space-between;
      white-space: nowrap;
    }
    .social-button {
      display: inline-flex;
      align-items: center;
      padding: 5px 8px;
      border-radius: 4px;
      background-color: #282c34;
      color: #abb2bf;
      text-decoration: none;
      font-size: 12px;
      transition: background-color 0.3s;
    }
    .social-button:hover {
      background-color: #4b5263;
    }
    .social-button img {
      width: 16px;
      height: 16px;
      margin-right: 5px;
    }
    .settings-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: rgba(36, 146, 255, 0.8);
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 18px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      z-index: 9999;
    }
  `;
  document.head.appendChild(style);

  function createSettingElement(label, id, type, min, max, step, tooltipText) {
    const container = document.createElement('div');
    container.className = 'setting-item';

    const labelContainer = document.createElement('div');
    labelContainer.className = 'setting-label';

    const labelElement = document.createElement('span');
    labelElement.className = 'setting-label-text';
    labelElement.textContent = label;

    const helpIcon = document.createElement('span');
    helpIcon.textContent = '?';
    helpIcon.className = 'help-icon tooltip';

    const tooltipSpan = document.createElement('span');
    tooltipSpan.className = 'tooltiptext';
    tooltipSpan.innerHTML = tooltipText;
    helpIcon.appendChild(tooltipSpan);

    labelContainer.appendChild(labelElement);
    labelContainer.appendChild(helpIcon);

    const inputContainer = document.createElement('div');
    inputContainer.className = 'setting-input';

    function AutoClaimAndStart() {
      setInterval(() => {
        const claimButton = document.querySelector('button.kit-button.is-large.is-drop.is-fill.button.is-done');
        const startFarmingButton = document.querySelector('button.kit-button.is-large.is-primary.is-fill.button');
        const continueButton = document.querySelector('button.kit-button.is-large.is-primary.is-fill.btn');
        if (claimButton) {
          claimButton.click();
        } else if (startFarmingButton) {
          startFarmingButton.click();
        } else if (continueButton) {
          continueButton.click();
        }
      }, Math.floor(Math.random() * 5000) + 5000);
    }

    AutoClaimAndStart();

    let input;
    if (type === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.checked = GAME_SETTINGS[id];
      input.addEventListener('change', (e) => {
        GAME_SETTINGS[id] = e.target.checked;
        saveSettings();
      });
      inputContainer.appendChild(input);
    } else {
      input = document.createElement('input');
      input.type = type;
      input.id = id;
      input.min = min;
      input.max = max;
      input.step = step;
      input.value = GAME_SETTINGS[id];
      input.className = 'setting-slider';

      const valueDisplay = document.createElement('span');
      valueDisplay.id = `${id}Display`;
      valueDisplay.textContent = GAME_SETTINGS[id];
      valueDisplay.className = 'setting-value';

      input.addEventListener('input', (e) => {
        GAME_SETTINGS[id] = parseFloat(e.target.value);
        valueDisplay.textContent = e.target.value;
        saveSettings();
      });

      inputContainer.appendChild(input);
      inputContainer.appendChild(valueDisplay);
    }

    container.appendChild(labelContainer);
    container.appendChild(inputContainer);
    return container;
  }

  function saveSettings() {
    localStorage.setItem('BlumAutoclickerSettings', JSON.stringify(GAME_SETTINGS));
  }

  function loadSettings() {
    const savedSettings = localStorage.getItem('BlumAutoclickerSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      GAME_SETTINGS = {
        ...GAME_SETTINGS,
        ...parsedSettings
      };
    }
  }

  loadSettings();
  updateSettingsMenu();

  function toggleGamePause() {
    isGamePaused = !isGamePaused;
    pauseResumeButton.textContent = isGamePaused ? 'Resume' : 'Pause';
    pauseResumeButton.style.backgroundColor = isGamePaused ? '#e5c07b' : '#98c379';
  }
} catch (e) {
  console.error("Blum Autoclicker error:", e);
}