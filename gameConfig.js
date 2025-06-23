// Mache die Variablen global verfügbar
window.imagePaths = {
    normal: 'img/schwein.png',
    gold: 'img/schwein_gold.png',
    mini: 'img/schwein_schnell.png',
    leben: 'img/schwein_leben.png',
    extralife: 'img/extralife.png',
    extratime: 'img/extratime.png'
};

window.pigTypes = {
    normal: {
        image: 'normal',
        width: 140,
        height: 90,
        minSpeed: 4,
        maxSpeed: 7,
        points: 10,
        spawnChance: 0.50
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
        image: 'extralife',
        width: 80,
        height: 50,
        minSpeed: 3,
        maxSpeed: 5,
        points: 0,
        spawnChance: 0.05,
        isExtraLife: true
    },
    extratime: {
        image: 'extratime',
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