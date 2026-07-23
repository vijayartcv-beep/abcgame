document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const startOverlay = document.getElementById('start-overlay');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameContainer = document.getElementById('game-container');
    const lettersArea = document.getElementById('letters-area');
    const bgMusic = document.getElementById('bg-music');
    const languageSelect = document.getElementById('language-select');
    const instructionText = document.getElementById('instruction-text');
    const repeatAudioBtn = document.getElementById('repeat-audio-btn');
    const character = document.getElementById('animal-character');
    const animalMessage = document.getElementById('animal-message');
    const animalImg = character.querySelector('.animal-img');
    const musicToggleBtn = document.getElementById('music-toggle-btn');

    // --- Screen Lock Elements ---
    const lockBtn = document.getElementById('lock-btn');
    const unlockModal = document.getElementById('unlock-modal');
    const resumeModal = document.getElementById('resume-modal');
    const resumeBtn = document.getElementById('resume-btn');
    const unlockBtnFromResume = document.getElementById('unlock-btn-from-resume');
    const pinDisplay = document.getElementById('pin-display');
    const pinError = document.getElementById('pin-error');
    const pinBtns = document.querySelectorAll('.pin-btn:not(.pin-btn-action)');
    const pinCancel = document.getElementById('pin-cancel');
    const pinClear = document.getElementById('pin-clear');

    // --- State ---
    let alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
    let remainingAlphabets = [];
    let currentTarget = '';
    let isPlaying = false;
    let synth = window.speechSynthesis;

    // --- Screen Lock State ---
    let isLocked = false;
    let currentPin = '';
    const PIN_CODE = '1234';

    const animals = [
        {
            src: 'file:///Users/vijayakumarkonduri/.gemini/antigravity/brain/58a926ea-da57-4d2f-a4b8-cafa6e137581/animal_character_1771846807222.png',
            audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_51abc8e8ea.mp3?filename=monkey-100223.mp3'
        },
        {
            src: 'file:///Users/vijayakumarkonduri/.gemini/antigravity/brain/58a926ea-da57-4d2f-a4b8-cafa6e137581/animal_elephant_new_1771847295792.png',
            audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_d0c9c54641.mp3?filename=elephant-trumpets-100222.mp3'
        },
        {
            src: 'file:///Users/vijayakumarkonduri/.gemini/antigravity/brain/58a926ea-da57-4d2f-a4b8-cafa6e137581/animal_dog_new_1771847342543.png',
            audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_33cdb570cb.mp3?filename=dog-barking-38202.mp3'
        },
        {
            src: 'file:///Users/vijayakumarkonduri/.gemini/antigravity/brain/58a926ea-da57-4d2f-a4b8-cafa6e137581/animal_lion_new_1771847364772.png',
            audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_8299ec2445.mp3?filename=lion-roar-38198.mp3'
        }
    ];

    // --- Audio Settings & Playlist ---
    bgMusic.volume = 0.1; // Lower default volume
    let isMusicPlaying = true;

    // Array of nursery rhyme MP3 URLs from reliable direct links (Wikimedia) to prevent CORS/hotlink blocking
    const nurseryRhymes = [
        "principle345-alphabet-song-333891.mp3"
    ];
    let currentRhymeIndex = 0;

    // Handle music toggle
    musicToggleBtn.addEventListener('click', () => {
        if (isMusicPlaying) {
            bgMusic.pause();
            musicToggleBtn.textContent = '🔇';
        } else {
            bgMusic.play().catch(e => console.log('Resume blocked:', e));
            musicToggleBtn.textContent = '🎵';
        }
        isMusicPlaying = !isMusicPlaying;
    });

    // Auto-advance to the next rhyme when one finishes
    bgMusic.addEventListener('ended', () => {
        playNextRhyme();
    });

    function playNextRhyme() {
        currentRhymeIndex = (currentRhymeIndex + 1) % nurseryRhymes.length;
        bgMusic.src = nurseryRhymes[currentRhymeIndex];
        if (isMusicPlaying) {
            bgMusic.play().catch(e => console.log('Audio autoplay blocked', e));
        }
    }

    // --- Initialize Game ---
    startGameBtn.addEventListener('click', () => {
        startOverlay.classList.remove('active');
        startOverlay.classList.add('hidden');
        gameContainer.classList.remove('hidden');

        // Start background music playlist
        bgMusic.src = nurseryRhymes[currentRhymeIndex];
        bgMusic.play().catch(e => console.log('Audio autoplay blocked', e));

        initLevel();
    });

    languageSelect.addEventListener('change', () => {
        // Option to switch lang mid-game and repeat instruction
        if (currentTarget) {
            speakInstruction(currentTarget);
        }
    });

    repeatAudioBtn.addEventListener('click', () => {
        if (currentTarget) {
            speakInstruction(currentTarget);
        }
    });

    // --- Core Logic ---
    function initLevel() {
        remainingAlphabets = [...alphabets];
        shuffleArray(remainingAlphabets);
        renderLetters(remainingAlphabets);
        pickNextTarget();
    }

    function renderLetters(letters) {
        lettersArea.innerHTML = '';
        const colors = ['#e91e63', '#9c27b0', '#3f51b5', '#00bcd4', '#4caf50', '#ff9800', '#ff5722', '#795548'];

        // Grid approach to avoid overlap
        const columns = 6;
        const rows = 5;
        // Total 30 cells. We need 26 for alphabets.
        let availableCells = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                availableCells.push({ r, c });
            }
        }
        shuffleArray(availableCells);

        const cellWidth = 100 / columns; // percentage
        const cellHeight = 100 / rows;   // percentage

        letters.forEach((letter, index) => {
            const letterEl = document.createElement('div');
            letterEl.classList.add('alphabet-letter');
            letterEl.textContent = letter;
            letterEl.id = `letter-${letter}`;

            const cell = availableCells[index];

            // Base position is top/left of the cell
            const baseX = cell.c * cellWidth;
            const baseY = cell.r * cellHeight;

            // Add a small random offset within the cell to keep it looking slightly jumbled
            // Keep it bounded so it doesn't cross the cell boundaries too much
            const offsetX = (Math.random() * (cellWidth * 0.4)) + (cellWidth * 0.1);
            const offsetY = (Math.random() * (cellHeight * 0.4)) + (cellHeight * 0.1);

            // Make sure letters don't go under the top bar by pushing everything down slightly
            // if we are in the top row (r == 0)
            const yOffsetPushed = cell.r === 0 ? offsetY + 15 : offsetY;

            letterEl.style.left = `${baseX + offsetX}%`;
            letterEl.style.top = `${baseY + yOffsetPushed}%`;

            // Random color
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            letterEl.style.color = randomColor;

            // Optional: Random slight rotation for jumbled look
            const rot = Math.floor(Math.random() * 40) - 20;
            letterEl.style.transform = `rotate(${rot}deg)`;

            letterEl.addEventListener('click', () => handleLetterClick(letter, letterEl));
            lettersArea.appendChild(letterEl);
        });
    }

    function pickNextTarget() {
        if (remainingAlphabets.length === 0) {
            winGame();
            return;
        }

        // Pick a random letter from the remaining ones
        const randomIndex = Math.floor(Math.random() * remainingAlphabets.length);
        currentTarget = remainingAlphabets[randomIndex];

        speakInstruction(currentTarget);
    }

    function handleLetterClick(letter, el) {
        if (!currentTarget || isPlaying) return; // Prevent clicking during animations/speech

        if (letter === currentTarget) {
            // Correct!
            el.classList.add('letter-correct');
            isPlaying = true; // lock interactions

            speakCongratulations();
            showAnimalPopup();

            setTimeout(() => {
                // Remove the clicked letter out of the DOM visually
                el.style.display = 'none';
                // Remove from remaining
                remainingAlphabets = remainingAlphabets.filter(l => l !== letter);
                hideAnimalPopup();
                isPlaying = false;
                pickNextTarget();
            }, 3000); // 3 seconds to enjoy celebration

        } else {
            // Incorrect
            el.classList.add('letter-incorrect');
            setTimeout(() => {
                el.classList.remove('letter-incorrect');
            }, 500);

            speakTryAgain();
        }
    }

    // --- Animations ---
    function showAnimalPopup() {
        character.classList.remove('hidden');
        character.classList.add('show');
    }

    function hideAnimalPopup() {
        character.classList.remove('show');
    }

    function winGame() {
        instructionText.textContent = languageSelect.value === 'te-IN' ? "మీరు గెలిచారు!" : "You Won!";
        showAnimalPopup();
        animalMessage.textContent = languageSelect.value === 'te-IN' ? "మళ్ళీ ఆడుతావా?" : "Play Again?";

        setTimeout(() => {
            initLevel();
            hideAnimalPopup();
        }, 5000);
    }

    // --- Speech Synthesis ---
    // Make sure voices are loaded
    let voices = [];
    synth.onvoiceschanged = () => {
        voices = synth.getVoices();
    };

    function speak(text, lang) {
        // Cancel any ongoing speech
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        if (lang === 'en-US') {
            // Prioritize clearer English voices on Mac/Google
            const engVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en-US')) ||
                voices.find(v => v.name === 'Samantha') ||
                voices.find(v => v.name === 'Alex') ||
                voices.find(v => v.lang === 'en-US');
            if (engVoice) {
                utterance.voice = engVoice;
            }
            // Use default rate and pitch for clearest English audio
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
        } else {
            // Telugu or other language settings
            const specificVoice = voices.find(v => v.lang.startsWith(lang));
            if (specificVoice) {
                utterance.voice = specificVoice;
            }
            // Slower/higher pitch modifications for Telugu
            utterance.rate = 0.9;
            utterance.pitch = 1.2;
        }

        synth.speak(utterance);
    }

    function speakInstruction(letter) {
        const lang = languageSelect.value;
        let text = "";

        if (lang === 'te-IN') {
            text = `అక్షరం ${letter} ని గుర్తించండి`;
            instructionText.innerText = `Recognize ${letter}`; // Keep visual English/mixed or localized
        } else {
            text = `Can you find the letter ${letter}?`;
            instructionText.innerText = `Find ${letter}`;
        }

        speak(text, lang);
    }

    function speakCongratulations() {
        const lang = languageSelect.value;
        const teGreetings = ["అద్భుతం!", "చాలా బాగుంది!", "సూపర్!"];
        const enGreetings = ["Excellent!", "Great job!", "Awesome!"];

        const arr = lang === 'te-IN' ? teGreetings : enGreetings;
        const msg = arr[Math.floor(Math.random() * arr.length)];

        // Pick random animal and set image
        const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
        animalImg.src = randomAnimal.src;

        animalMessage.textContent = msg;

        // Play the real audio file for the animal first
        const animalAudio = new Audio(randomAnimal.audioUrl);
        animalAudio.play().catch(e => console.log('Audio error:', e));

        // Let the animal sound play for a moment before saying congratulations
        setTimeout(() => {
            speak(msg, lang);
        }, 800);
    }

    function speakTryAgain() {
        // Don't overwhelm, just a short prompt
        const lang = languageSelect.value;
        if (lang === 'te-IN') {
            speak("మళ్లీ ప్రయత్నించండి", lang); // Malli prayatninchandi
        } else {
            speak("Try again!", lang);
        }
    }

    // --- Utils ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // --- Screen Lock Logic ---
    lockBtn.addEventListener('click', () => {
        if (!isLocked) {
            // Enter lock mode
            document.documentElement.requestFullscreen().then(() => {
                isLocked = true;
                lockBtn.textContent = '🔒';
            }).catch(err => {
                alert(`Cannot enter fullscreen mode: ${err.message}`);
            });
        } else {
            // Ask for PIN to unlock
            showUnlockModal();
        }
    });

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && isLocked) {
            // User escaped full screen while locked
            resumeModal.classList.remove('hidden');
        }
    });

    resumeBtn.addEventListener('click', () => {
        document.documentElement.requestFullscreen().then(() => {
            resumeModal.classList.add('hidden');
        }).catch(err => alert("Error entering fullscreen"));
    });

    unlockBtnFromResume.addEventListener('click', () => {
        showUnlockModal();
    });

    function showUnlockModal() {
        unlockModal.classList.remove('hidden');
        currentPin = '';
        updatePinDisplay();
        pinError.textContent = '';
    }

    function hideUnlockModal() {
        unlockModal.classList.add('hidden');
    }

    pinBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentPin.length < 4) {
                currentPin += btn.textContent;
                updatePinDisplay();
                if (currentPin.length === 4) {
                    checkPin();
                }
            }
        });
    });

    pinCancel.addEventListener('click', () => {
        hideUnlockModal();
    });

    pinClear.addEventListener('click', () => {
        currentPin = '';
        updatePinDisplay();
        pinError.textContent = '';
    });

    function updatePinDisplay() {
        pinDisplay.textContent = currentPin.padEnd(4, '_').split('').join(' ');
    }

    function checkPin() {
        if (currentPin === PIN_CODE) {
            // Unlock successful
            isLocked = false;
            lockBtn.textContent = '🔓';
            hideUnlockModal();
            resumeModal.classList.add('hidden');
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log(err));
            }
        } else {
            // Unlock failed
            pinError.textContent = 'Incorrect PIN. Try again.';
            currentPin = '';
            setTimeout(() => {
                updatePinDisplay();
            }, 500);
        }
    }
});
