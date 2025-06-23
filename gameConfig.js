// gameConfig.js (oder wo auch immer diese Variablen definiert sind)
// NUR DIESEN TEIL ANPASSEN:

// Mache die Variablen global verfügbar
window.imagePaths = {
    normal1: 'img/schwein_1.png',
    normal2: 'img/schwein_2.png',
    gold: 'img/schwein_gold.png',
    mini: 'img/schwein_schnell.png',
    leben: 'img/schwein_leben.png',
    extralife: 'img/schwein_extralife.png', // Bitte prüfen, ob das Bild auch so heißt
    extratime: 'img/schwein_extratime.png' // Bitte prüfen, ob das Bild auch so heißt
};

window.pigTypes = {
    normal1: { // Typname
        image: 'normal1', // **Korrektur hier!** Muss 'normal1' sein, um den Schlüssel in imagePaths zu matchen
        width: 140,
        height: 90,
        minSpeed: 4,
        maxSpeed: 7,
        points: 10,
        spawnChance: 0.25
    },
    normal2: { // Typname
        image: 'normal2', // **Korrektur hier!** Muss 'normal2' sein, um den Schlüssel in imagePaths zu matchen
        width: 140,
        height: 90,
        minSpeed: 4,
        maxSpeed: 7,
        points: 15,
        spawnChance: 0.25
    },
    gold: {
        image: 'gold',
        width: 160,
        height: 100,
        minSpeed: 7,
        maxSpeed: 10,
        points: 50,
        spawnChance: 0.1
    },
    mini: {
        image: 'mini',
        width: 80,
        height: 50,
        minSpeed: 10,
        maxSpeed: 12,
        points: 25,
        spawnChance: 0.3
    },
    extralife: {
        image: 'extralife', // Hier passt der Schlüssel
        width: 80,
        height: 50,
        minSpeed: 3,
        maxSpeed: 5,
        points: 0,
        spawnChance: 0.05,
        isExtraLife: true
    },
    extratime: {
        image: 'extratime', // Hier passt der Schlüssel
        width: 80,
        height: 50,
        minSpeed: 3,
        maxSpeed: 5,
        points: 0,
        spawnChance: 0.05,
        isExtraTime: true,
        timeBonus: 30
    }
};

window.gameConstants = {
    maxLives: 5,
    gameDuration: 1 * 60,
    spawnInterval: 750,
    canvasWidth: 1400,
    canvasHeight: 600
};