const config = {
    type: Phaser.AUTO, // "Phaser" with capital P
    width: 800,
    height: 600,
    backgroundColor: '#1d1d1d',
    scene: {
        preload,
        create,
        update
    }
};

const game = new Phaser.Game(config); // Capital "P" and capital "G" in Phaser.Game

function preload() {
    // Load assets later
}

function create() {
    this.add.text(300, 280, 'Hello, Phaser!', { color: '#ffffff' });
}

function update() {
    // Game loop logic later
}
