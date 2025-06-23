// js.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingText = document.getElementById('loadingText');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const timerDisplay = document.getElementById('timer');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// Konfigurationswerte aus gameConfig.js importieren
// Stellen Sie sicher, dass gameConfig.js VOR js.js geladen wird!
const {
    maxLives,
    gameDuration,
    spawnInterval,
    canvasWidth,
    canvasHeight
} = gameConstants;

// Canvas-Größe setzen
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Spielvariablen
let score = 0;
let lives = maxLives; // Jetzt korrekt aus gameConstants
let timeLeft = gameDuration; // Jetzt korrekt aus gameConstants
let gameRunning = false;
let targetSpawnInterval;
let gameTimerInterval;

const targets = [];

// --- Bilder laden ---
const schweinImages = {};

// Initialisiere die Bilder basierend auf der Konfiguration
function initializeImages() {
    Object.keys(imagePaths).forEach(key => {
        schweinImages[key] = new Image();
        schweinImages[key].src = imagePaths[key];
    });
}

initializeImages();

let imagesLoaded = 0;
const totalImages = Object.keys(schweinImages).length;

// Funktion, die aufgerufen wird, wenn ein Bild geladen wurde
function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        console.log('Alle Schwein-Bilder erfolgreich geladen!');
        loadingText.style.display = 'none';
        resetGame();
    }
}

// Event-Listener für jedes Bild
Object.values(schweinImages).forEach(img => {
    img.onload = imageLoaded;
    img.onerror = () => {
        console.error('Fehler beim Laden eines Schwein-Bildes! Fallback auf schwein.png');
        img.src = 'schwein.png';
    };
});

// --- Ziel-Klasse ---
class Target {
    constructor(type) {
        this.type = type;
        const config = pigTypes[type];

        this.x = -config.width - 50;
        this.y = Math.random() * (canvas.height - config.height - 100) + 50;
        this.speed = Math.random() * (config.maxSpeed - config.minSpeed) + config.minSpeed;
        this.width = config.width;
        this.height = config.height;
        this.hit = false;
        this.points = config.points;
        this.image = schweinImages[config.image];
        this.isExtraLife = config.isExtraLife || false;
        this.isExtraTime = config.isExtraTime || false;
        this.timeBonus = config.timeBonus || 0;
        
        if (this.isExtraLife || this.isExtraTime) {
            this.floatOffset = 0;
            this.floatSpeed = 0.05;
        }
    }

    update() {
        if (!this.hit) {
            this.x += this.speed;
            
            if (this.isExtraLife || this.isExtraTime) {
                this.floatOffset += this.floatSpeed;
                this.y += Math.sin(this.floatOffset) * 0.5;
            }
        }
    }

    draw() {
        if (!this.hit) {
            ctx.save();
            
            if (this.isExtraLife) {
                ctx.shadowColor = 'rgba(255, 100, 100, 0.8)';
                ctx.shadowBlur = 20;
            } else if (this.isExtraTime) {
                ctx.shadowColor = 'rgba(100, 100, 255, 0.8)';
                ctx.shadowBlur = 20;
            }
            
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            ctx.restore();
        }
    }

    isOffScreen() {
        return this.x > canvas.width + this.width;
    }

    checkHit(mouseX, mouseY) {
        return mouseX > this.x && mouseX < this.x + this.width &&
               mouseY > this.y && mouseY < this.y + this.height;
    }
}

// --- Funktion zum Auswählen eines zufälligen Schweintyps ---
function getRandomPigType() {
    const random = Math.random();
    let cumulativeChance = 0;

    for (const [type, config] of Object.entries(pigTypes)) {
        cumulativeChance += config.spawnChance;
        if (random <= cumulativeChance) {
            return type;
        }
    }
    return 'normal'; // Fallback
}

// --- Mausklick-Handler ---
canvas.addEventListener('click', (e) => {
    if (!gameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];
        if (!target.hit && target.checkHit(clickX, clickY)) {
            target.hit = true;
            
            // Behandlung für Extra-Leben
            if (target.isExtraLife) {
                if (lives < maxLives) {
                    lives++;
                    updateLivesDisplay();
                    showLifeAnimation(clickX, clickY);
                } else {
                    // Wenn bereits maximale Leben, gib Bonuspunkte
                    score += 100;
                    updateScoreDisplay();
                    showPointsAnimation(clickX, clickY, 100, 'bonus');
                }
            } 
            // Behandlung für Extra-Zeit
            else if (target.isExtraTime) {
                timeLeft += target.timeBonus;
                updateTimerDisplay();
                showTimeAnimation(clickX, clickY, target.timeBonus);
            } 
            // Normale Punkte
            else {
                score += target.points;
                updateScoreDisplay();
                showPointsAnimation(clickX, clickY, target.points, target.type);
            }

            targets.splice(i, 1);
            break;
        }
    }
});

// --- Punkte-Animation ---
const pointsAnimations = [];

function showPointsAnimation(x, y, points, type) {
    let color = 'white';
    let text = `+${points}`;
    
    if (type === 'gold') color = 'gold';
    else if (type === 'mini') color = 'lightblue';
    else if (type === 'bonus') {
        color = 'lime';
        text = `+${points} BONUS!`;
    }

    pointsAnimations.push({
        x: x,
        y: y,
        text: text,
        color: color,
        opacity: 1,
        offsetY: 0
    });
}

// Extra-Leben Animation
function showLifeAnimation(x, y) {
    pointsAnimations.push({
        x: x,
        y: y,
        text: '+1 LEBEN!',
        color: 'red',
        opacity: 1,
        offsetY: 0,
        size: 30
    });
}

// Extra-Zeit Animation
function showTimeAnimation(x, y, seconds) {
    pointsAnimations.push({
        x: x,
        y: y,
        text: `+${seconds} SEKUNDEN!`,
        color: 'blue',
        opacity: 1,
        offsetY: 0,
        size: 30
    });
}

function updatePointsAnimations() {
    for (let i = pointsAnimations.length - 1; i >= 0; i--) {
        const anim = pointsAnimations[i];
        anim.offsetY -= 2;
        anim.opacity -= 0.02;

        if (anim.opacity <= 0) {
            pointsAnimations.splice(i, 1);
        }
    }
}

function drawPointsAnimations() {
    pointsAnimations.forEach(anim => {
        ctx.save();
        ctx.globalAlpha = anim.opacity;
        ctx.fillStyle = anim.color;
        ctx.font = `bold ${anim.size || 24}px Arial`;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(anim.text, anim.x, anim.y + anim.offsetY);
        ctx.fillText(anim.text, anim.x, anim.y + anim.offsetY);
        ctx.restore();
    });
}

// --- Neue Ziele spawnen ---
function spawnTarget() {
    if (gameRunning) {
        const pigType = getRandomPigType();
        targets.push(new Target(pigType));
    }
}

// --- Display-Updates ---
function updateScoreDisplay() {
    scoreDisplay.textContent = `Punkte: ${score}`;
}

// --- Lebensanzeige mit Bildern ---
function initializeLivesDisplay() {
    livesDisplay.innerHTML = ''; // Leere die Anzeige
    livesDisplay.style.display = 'flex';
    livesDisplay.style.gap = '10px';
    livesDisplay.style.alignItems = 'center';
    
    // Erstelle die Lebensbilder
    for (let i = 0; i < maxLives; i++) {
        const lifeImg = document.createElement('img');
        lifeImg.src = 'schwein_leben.png';
        lifeImg.classList.add('life-image');
        lifeImg.style.width = '40px';
        lifeImg.style.height = '40px';
        lifeImg.style.objectFit = 'contain';
        lifeImg.style.transition = 'all 0.3s ease';
        lifeImg.dataset.lifeIndex = i;
        livesDisplay.appendChild(lifeImg);
    }
}

function updateLivesDisplay() {
    const lifeImages = livesDisplay.querySelectorAll('.life-image');
    
    // Aktualisiere die Anzeige der Lebensbilder
    lifeImages.forEach((img, index) => {
        if (index >= lives) {
            img.style.opacity = '0.2';
            img.style.filter = 'grayscale(100%)';
            img.style.transform = 'scale(0.8)';
        } else {
            img.style.opacity = '1';
            img.style.filter = 'none';
            img.style.transform = 'scale(1)';
        }
    });
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `Zeit: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Warnung bei wenig Zeit
    if (timeLeft <= 30) {
        timerDisplay.style.color = 'red';
    } else {
        timerDisplay.style.color = 'white';
    }
}

// --- Game Over Logik ---
function gameOver() {
    gameRunning = false;
    clearInterval(targetSpawnInterval);
    clearInterval(gameTimerInterval);

    finalScoreDisplay.textContent = `Dein Score: ${score}`;
    gameOverScreen.style.display = 'flex'; // Zeige den Game Over Bildschirm
}

// Beispiel: In resetGame()
function resetGame() {
    score = 0;
    lives = maxLives; // Verwendet die deklarierte Konstante
    timeLeft = gameDuration; // Verwendet die deklarierte Konstante
    targets.length = 0;
    pointsAnimations.length = 0;

    updateScoreDisplay();
    initializeLivesDisplay();
    updateLivesDisplay();
    updateTimerDisplay();

    gameOverScreen.style.display = 'none';

    gameRunning = true;
    gameLoop();
    targetSpawnInterval = setInterval(spawnTarget, spawnInterval); // Nutzt den Wert aus der Konfig
    gameTimerInterval = setInterval(gameTimer, 1000);
}

// --- Game Timer ---
function gameTimer() {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
        gameOver();
    }
}

// --- Restart Button Event Listener ---
restartButton.addEventListener('click', resetGame);

// --- Game Loop ---
function gameLoop() {
    // Canvas löschen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ziele aktualisieren und zeichnen
    for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];
        target.update();
        target.draw();

        if (target.isOffScreen() && !target.hit) {
            targets.splice(i, 1);
            
            // Nur Leben verlieren, wenn es kein Extra ist
            if (!target.isExtraLife && !target.isExtraTime) {
                lives--;
                updateLivesDisplay();
                if (lives <= 0) {
                    gameOver();
                }
            }
        }
    }

    // Punkte-Animationen
    updatePointsAnimations();
    drawPointsAnimations();

    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}