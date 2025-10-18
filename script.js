document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const colorPaletteContainer = document.querySelector('.colors');
    const submitButton = document.getElementById('submit-guess');
    const newGameButton = document.getElementById('new-game');
    const messageDiv = document.getElementById('message');
    const secretCodeContainer = document.getElementById('secret-code-container');
    const secretCodeReveal = document.getElementById('secret-code-reveal');
    const codeLengthSelect = document.getElementById('code-length');
    const colorCheckboxes = document.querySelectorAll('input[name="color"]');

    const ALL_COLORS = [
        { name: 'red', hex: '#e74c3c' }, { name: 'blue', hex: '#3498db' },
        { name: 'green', hex: '#2ecc71' }, { name: 'yellow', hex: '#f1c40f' },
        { name: 'purple', hex: '#9b59b6' }, { name: 'orange', hex: '#e67e22' },
        { name: 'cyan', hex: '#1abc9c' }, { name: 'pink', hex: '#fd79a8' }
    ];
    const MAX_ATTEMPTS = 10;

    let secretCode = [];
    let currentGuess = [];
    let currentAttempt = 0;
    let gameOver = false;
    let codeLength = 4;
    let availableColors = [];


    function updateAvailableColors() {
        availableColors = [];
        colorCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const colorData = ALL_COLORS.find(c => c.name === checkbox.value);
                if (colorData) availableColors.push(colorData);
            }
        });
    }

    function renderColorPalette() {
        colorPaletteContainer.innerHTML = '';
        availableColors.forEach(color => {
            const peg = document.createElement('div');
            peg.className = 'color-peg';
            peg.dataset.color = color.name;
            peg.style.backgroundColor = color.hex;
            colorPaletteContainer.appendChild(peg);
        });
    }

    function initGame() {
        codeLength = parseInt(codeLengthSelect.value);
        updateAvailableColors();

        if (availableColors.length < codeLength) {
            messageDiv.textContent = `خطا: حداقل ${codeLength} رنگ باید انتخاب کنید!`;
            messageDiv.className = 'message error';
            return;
        }

        secretCode = generateSecretCode();
        currentGuess = new Array(codeLength).fill(null);
        currentAttempt = 0;
        gameOver = false;

        gameBoard.innerHTML = '';
        messageDiv.textContent = '';
        messageDiv.className = 'message';
        secretCodeContainer.classList.remove('show');
        secretCodeReveal.innerHTML = '';

        submitButton.disabled = false;
        codeLengthSelect.disabled = true;
        colorCheckboxes.forEach(cb => cb.disabled = true);

        renderColorPalette();
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            createBoardRow(i);
        }
        
        updateActiveRow();
        attachColorPaletteListeners();
    }

    function generateSecretCode() {
        const code = [];
        for (let i = 0; i < codeLength; i++) {
            const randomIndex = Math.floor(Math.random() * availableColors.length);
            code.push(availableColors[randomIndex].name);
        }
        console.log('کد مخفی (برای تست):', code);
        return code;
    }

    function createBoardRow(rowIndex) {
        const row = document.createElement('div');
        row.className = 'guess-row';
        row.dataset.row = rowIndex;

        const slotsContainer = document.createElement('div');
        slotsContainer.className = 'guess-slots';
        for (let i = 0; i < codeLength; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.dataset.row = rowIndex;
            slot.dataset.slot = i;
            slotsContainer.appendChild(slot);
        }

        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'feedback-slots';
        feedbackContainer.style.gridTemplateColumns = `repeat(${Math.ceil(codeLength / 2)}, 1fr)`;
        for (let i = 0; i < codeLength; i++) {
            const peg = document.createElement('div');
            peg.className = 'feedback-peg';
            feedbackContainer.appendChild(peg);
        }

        row.appendChild(slotsContainer);
        row.appendChild(feedbackContainer);
        gameBoard.appendChild(row);
    }
    
    function attachColorPaletteListeners() {
        const colorPegs = document.querySelectorAll('.color-peg');
        colorPegs.forEach(peg => {
            peg.addEventListener('click', (e) => {
                if (gameOver) return;
                const selectedColorData = availableColors.find(c => c.name === e.target.dataset.color);
                const firstEmptySlotIndex = currentGuess.indexOf(null);

                if (firstEmptySlotIndex !== -1) {
                    currentGuess[firstEmptySlotIndex] = selectedColorData.name;
                    
                    const activeRow = document.querySelector('.guess-row.active');
                    const slotToFill = activeRow.querySelector(`.slot[data-slot="${firstEmptySlotIndex}"]`);
                    slotToFill.style.backgroundColor = selectedColorData.hex;
                    slotToFill.classList.add('filled');
                }
            });
        });
    }

    function updateActiveRow() {
        document.querySelectorAll('.guess-row').forEach(row => row.classList.remove('active'));
        if (currentAttempt < MAX_ATTEMPTS) {
            const activeRow = document.querySelector(`.guess-row[data-row="${MAX_ATTEMPTS - 1 - currentAttempt}"]`);
            if(activeRow) activeRow.classList.add('active');
        }
    }

    function checkGuess() {
        let blackPegs = 0, whitePegs = 0;
        const tempSecretCode = [...secretCode];
        const tempCurrentGuess = [...currentGuess];

        for (let i = 0; i < codeLength; i++) {
            if (tempCurrentGuess[i] === tempSecretCode[i]) {
                blackPegs++;
                tempSecretCode[i] = null;
                tempCurrentGuess[i] = null;
            }
        }
        for (let i = 0; i < codeLength; i++) {
            if (tempCurrentGuess[i] !== null) {
                const indexInSecret = tempSecretCode.indexOf(tempCurrentGuess[i]);
                if (indexInSecret > -1) {
                    whitePegs++;
                    tempSecretCode[indexInSecret] = null;
                }
            }
        }
        return { black: blackPegs, white: whitePegs };
    }

    function displayFeedback(rowIndex, feedback) {
        const row = document.querySelector(`.guess-row[data-row="${rowIndex}"]`);
        const feedbackPegs = row.querySelectorAll('.feedback-peg');
        
        const pegsToAdd = [];
        for (let i = 0; i < feedback.black; i++) pegsToAdd.push('black');
        for (let i = 0; i < feedback.white; i++) pegsToAdd.push('white');
        pegsToAdd.sort(() => Math.random() - 0.5);

        pegsToAdd.forEach((type, index) => {
            setTimeout(() => {
                feedbackPegs[index].classList.add(type, 'show');
            }, index * 100);
        });
    }

    function endGame(won) {
        gameOver = true;
        submitButton.disabled = true;
        codeLengthSelect.disabled = false;
        colorCheckboxes.forEach(cb => cb.disabled = false);

        secretCodeContainer.classList.add('show');
        secretCode.forEach(colorName => {
            const colorData = ALL_COLORS.find(c => c.name === colorName);
            const peg = document.createElement('div');
            peg.className = 'peg';
            peg.style.backgroundColor = colorData.hex;
            secretCodeReveal.appendChild(peg);
        });

        if (won) {
            messageDiv.textContent = `آفرین! شما در تلاش ${currentAttempt} بردید!`;
            messageDiv.className = 'message win';
        } else {
            messageDiv.textContent = 'متاسفم! شما باختید. کد مخفی بالا نمایش داده شده است.';
            messageDiv.className = 'message lose';
        }
    }

    // --- مدیریت رویدادها ---
    
    gameBoard.addEventListener('click', (e) => {
        if (gameOver || !e.target.classList.contains('slot') || !e.target.classList.contains('filled')) return;
        
        const slotIndex = parseInt(e.target.dataset.slot);
        const activeRowSlots = document.querySelectorAll('.guess-row.active .slot');
        const isSlotInActiveRow = Array.from(activeRowSlots).includes(e.target);

        if (isSlotInActiveRow) {
            for (let i = slotIndex; i < codeLength; i++) {
                currentGuess[i] = null;
                const slotToClear = activeRowSlots[i];
                slotToClear.style.backgroundColor = '';
                slotToClear.classList.remove('filled');
            }
        }
    });

    submitButton.addEventListener('click', () => {
        if (gameOver) return;
        if (currentGuess.includes(null)) {
            messageDiv.textContent = `لطفاً تمام ${codeLength} خانه را با رنگ پر کنید!`;
            messageDiv.className = 'message error';
            return;
        }

        const rowIndex = MAX_ATTEMPTS - 1 - currentAttempt;
        const feedback = checkGuess();
        
        // قفل کردن ردیف ثبت شده
        const submittedRow = document.querySelector(`.guess-row[data-row="${rowIndex}"]`);
        submittedRow.classList.add('locked');
        
        displayFeedback(rowIndex, feedback);

        if (feedback.black === codeLength) {
            endGame(true);
        } else {
            currentAttempt++;
            if (currentAttempt >= MAX_ATTEMPTS) {
                endGame(false);
            } else {
                currentGuess = new Array(codeLength).fill(null);
                updateActiveRow();
                messageDiv.textContent = '';
            }
        }
    });

    newGameButton.addEventListener('click', initGame);

    const settingsSection = document.getElementById('settings');
    const colorSettingsSection = document.getElementById('color-settings');
    function showSettingsHint() {
        if (!gameOver) {
            messageDiv.textContent = 'برای اعمال تغییرات، روی "بازی جدید" کلیک کنید.';
            messageDiv.className = 'message error';
        }
    }
    codeLengthSelect.addEventListener('change', showSettingsHint);
    colorCheckboxes.forEach(cb => cb.addEventListener('change', showSettingsHint));

    // --- شروع بازی ---
    initGame();
});
