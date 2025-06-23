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
// Stellen Sie sicher, dass gameConfig.js (oder die Scripte mit den globalen Variablen) VOR js.js geladen wird!
const {
    maxLives,
    gameDuration,
    spawnInterval,
    canvasWidth,
    canvasHeight
} = window.gameConstants; // Zugriff auf die globalen Variablen

// Canvas-Größe setzen
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Spielvariablen
let score = 0;
let lives = maxLives;
let timeLeft = gameDuration;
let gameRunning = false;
let targetSpawnIntervalId; // Umbenannt, um Konflikte zu vermeiden
let gameTimerIntervalId; // Umbenannt, um Konflikte zu vermeiden

const targets = [];
const pointsAnimations = []; // Globale Deklaration für Punkte-Animationen

// --- Bilder laden ---
const loadedImages = {}; // Speichert die tatsächlich geladenen Bildobjekte

let imagesLoadedCount = 0;
const totalImagesToLoad = Object.keys(window.imagePaths).length;

// Funktion, die aufgerufen wird, wenn ein Bild geladen wurde
function imageLoadComplete() {
    imagesLoadedCount++;
    if (imagesLoadedCount === totalImagesToLoad) {
        console.log('Alle Schwein-Bilder erfolgreich geladen!');
        loadingText.style.display = 'none'; // Lade-Text ausblenden
        resetGame(); // Spiel nach dem Laden der Bilder initialisieren
    }
}

// Initialisiere und lade alle Bilder
function preloadAllImages() {
    Object.keys(window.imagePaths).forEach(key => {
        const img = new Image();
        img.src = window.imagePaths[key]; // Korrekter Pfad wird verwendet
        img.onload = imageLoadComplete;
        img.onerror = () => {
            console.error(`Fehler beim Laden von Bild: ${window.imagePaths[key]}! Fallback auf ${window.imagePaths.normal}`);
            // Fallback auf das normale Schwein-Bild, wenn ein spezifisches Bild fehlschlägt
            img.src = window.imagePaths.normal; 
            // Wichtig: Auch der Fallback muss geladen werden, damit der Counter weiterläuft
            // Wenn der Fallback auch fehlschlägt, gibt es ein ernsteres Problem
            img.onload = imageLoadComplete; 
            img.onerror = () => {
                console.error(`Auch Fallback-Bild ${window.imagePaths.normal} konnte nicht geladen werden!`);
                imageLoadComplete(); // Trotzdem den Zähler erhöhen, um das Spiel nicht zu blockieren
            };
        };
        loadedImages[key] = img; // Speichert das Image-Objekt
    });
}

// Startet den Ladevorgang der Bilder
preloadAllImages();


// --- Ziel-Klasse ---
class Target {
    constructor(type) {
        this.type = type;
        const config = window.pigTypes[type]; // Zugriff auf die globalen Variablen

        this.x = -config.width - 50;
        this.y = Math.random() * (canvas.height - config.height - 100) + 50;
        this.speed = Math.random() * (config.maxSpeed - config.minSpeed) + config.minSpeed;
        this.width = config.width;
        this.height = config.height;
        this.hit = false;
        this.points = config.points;
        this.image = loadedImages[config.image]; // Verwendet das bereits geladene Bildobjekt
        this.isExtraLife = config.isExtraLife || false;
        this.isExtraTime = config.isExtraTime || false;
        this.timeBonus = config.timeBonus || 0;
        
        if (this.isExtraLife || this.isExtraTime) {
            this.floatOffset = Math.random() * Math.PI * 2; // Zufälliger Startpunkt für sanfteres Floaten
            this.floatSpeed = 0.05;
        }
    }

    update() {
        if (!this.hit) {
            this.x += this.speed;
            
            if (this.isExtraLife || this.isExtraTime) {
                this.floatOffset += this.floatSpeed;
                this.y += Math.sin(this.floatOffset) * 0.5; // Sanfteres Auf- und Ab-Bewegen
            }
        }
    }

    draw() {
        if (!this.hit && this.image.complete && this.image.naturalHeight !== 0) { // Überprüfen, ob das Bild vollständig geladen ist
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

    for (const [type, config] of Object.entries(window.pigTypes)) { // Zugriff auf globale Variable
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

    // Iteriere rückwärts, um Splice-Operationen während der Iteration zu ermöglichen
    for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];
        if (!target.hit && target.checkHit(clickX, clickY)) {
            target.hit = true; // Markiere als getroffen, damit es nicht mehr gezeichnet/gecheckt wird
            
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

            targets.splice(i, 1); // Entferne das getroffene Ziel
            break; // Nur ein Ziel pro Klick treffen
        }
    }
});

// --- Punkte-Animationen Helferfunktionen ---
function showPointsAnimation(x, y, points, type) {
    let color = 'white';
    let text = `+${points}`;
    let size = 24;
    
    if (type === 'gold') {
        color = 'gold';
        size = 30; // Goldpunkte größer
    } else if (type === 'mini') {
        color = 'lightblue';
        size = 20; // Minischweine kleiner
    } else if (type === 'bonus') {
        color = 'lime';
        text = `+${points} BONUS!`;
        size = 32; // Bonus größer
    }

    pointsAnimations.push({
        x: x,
        y: y,
        text: text,
        color: color,
        opacity: 1,
        offsetY: 0,
        size: size,
        lifespan: 60 // Wie viele Frames die Animation sichtbar ist
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
        size: 30,
        lifespan: 70
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
        size: 30,
        lifespan: 70
    });
}

function updatePointsAnimations() {
    for (let i = pointsAnimations.length - 1; i >= 0; i--) {
        const anim = pointsAnimations[i];
        anim.offsetY -= 2; // Bewegung nach oben
        anim.opacity = anim.lifespan / 60; // Opazität basierend auf Lebensdauer (60 Frames pro Sekunde)
        anim.lifespan--;

        if (anim.lifespan <= 0) {
            pointsAnimations.splice(i, 1); // Animation entfernen, wenn Lebensdauer abgelaufen ist
        }
    }
}

function drawPointsAnimations() {
    pointsAnimations.forEach(anim => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, anim.opacity); // Sicherstellen, dass Opazität nicht negativ wird
        ctx.fillStyle = anim.color;
        ctx.font = `bold ${anim.size}px Arial`;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center'; // Text zentrieren am Klickpunkt
        ctx.textBaseline = 'middle'; // Text vertikal zentrieren
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
        // Sicherstellen, dass das 'leben' Bild existiert und geladen ist
        lifeImg.src = loadedImages.leben ? loadedImages.leben.src : window.imagePaths.leben; 
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
    if (timeLeft <= 30 && timeLeft > 0) { // Nur warnen, wenn Zeit noch nicht abgelaufen ist
        timerDisplay.style.color = 'red';
    } else {
        timerDisplay.style.color = 'white';
    }
}

// --- Game Over Logik ---
function gameOver() {
    gameRunning = false;
    clearInterval(targetSpawnIntervalId); // Lösche das Spawn-Intervall
    clearInterval(gameTimerIntervalId); // Lösche das Game Timer-Intervall

    finalScoreDisplay.textContent = `Dein Score: ${score}`;
    gameOverScreen.style.display = 'flex'; // Zeige den Game Over Bildschirm
}

// --- Spiel zurücksetzen / starten ---
function resetGame() {
    // Falls Timer oder Spawner noch laufen, sie stoppen
    clearInterval(targetSpawnIntervalId);
    clearInterval(gameTimerIntervalId);

    score = 0;
    lives = maxLives;
    timeLeft = gameDuration;
    targets.length = 0; // Alle Ziele entfernen
    pointsAnimations.length = 0; // Alle Punkte-Animationen entfernen

    updateScoreDisplay();
    initializeLivesDisplay(); // Muss neu initialisiert werden, um alle Bilder neu zu setzen
    updateLivesDisplay();
    updateTimerDisplay();

    gameOverScreen.style.display = 'none'; // Game Over Bildschirm ausblenden

    gameRunning = true;
    gameLoop(); // Starte den Game Loop
    targetSpawnIntervalId = setInterval(spawnTarget, spawnInterval);
    gameTimerIntervalId = setInterval(gameTimer, 1000);
}

// --- Game Timer ---
function gameTimer() {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
        timeLeft = 0; // Sicherstellen, dass die Zeit nicht negativ wird
        updateTimerDisplay(); // Noch einmal aktualisieren, um 00:00 anzuzeigen
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

        // Überprüfen, ob das Ziel vom Bildschirm ist UND nicht getroffen wurde (d.h. "entkommen")
        if (target.isOffScreen() && !target.hit) {
            targets.splice(i, 1);
            
            // Nur Leben verlieren, wenn es kein Extra-Ziel ist (Leben/Zeit)
            if (!target.isExtraLife && !target.isExtraTime) {
                lives--;
                updateLivesDisplay();
                if (lives <= 0) {
                    gameOver();
                }
            }
        }
    }

    // Punkte-Animationen aktualisieren und zeichnen
    updatePointsAnimations();
    drawPointsAnimations();

    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}