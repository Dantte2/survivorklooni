const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1d1d1d',
    physics: {
        default: 'arcade',
        arcade: {
            // debug: true, // Uncomment for debugging physics bodies
            gravity: { y: 1100 },
        }
    },
    scene: {
        preload,
        create,
        update
    }
};

const game = new Phaser.Game(config);

function preload() {
    // Load all player spritesheets with frame sizes
    this.load.spritesheet('playerIdle', 'assets/player/idle/idle-sheet.png', {
        frameWidth: 64,
        frameHeight: 64
    });

    this.load.spritesheet('playerwalk', 'assets/player/moving/run-sheet.png', {
        frameWidth: 80,
        frameHeight: 64
    });

    this.load.spritesheet('playerjump', 'assets/player/jumpstart/jump-start-sheet.png', {
        frameWidth: 64,
        frameHeight: 64
    });

    this.load.spritesheet('playerland', 'assets/player/jumpend/jump-end-sheet.png', {
        frameWidth: 64,
        frameHeight: 64
    });

    this.load.spritesheet('playerattack', 'assets/player/attack/attack-01-sheet.png', {
        frameWidth: 96,
        frameHeight: 64
    });

    //load tiles
    this.load.image('tiles', 'assets/tiles/tiles.png');
    this.load.tilemapTiledJSON('map', 'assets/tiles/tiledtest.json');
}

function create() {
    // Create player sprite with physics enabled, positioned at (400, 300)
    this.player = this.physics.add.sprite(400, 300, 'playerIdle', 0);

    // Set origin to bottom-center of the sprite (important for jumping/landing visuals)
    this.player.setOrigin(0.5, 1);

    // Prevent player from leaving game world bounds
    this.player.setCollideWorldBounds(true);

    // Adjust player physics body size for better collision
    this.player.body.setSize(48, 64);

    // Create all animations from loaded spritesheets
    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('playerIdle', { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('playerwalk', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'jump',
        frames: this.anims.generateFrameNumbers('playerjump', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: 0
    });

    this.anims.create({
        key: 'fall',
        frames: this.anims.generateFrameNumbers('playerland', { start: 0, end: 1 }),
        frameRate: 10,
        repeat: 0
    });

    this.anims.create({
        key: 'land',
        frames: this.anims.generateFrameNumbers('playerland', { start: 1, end: 2 }),
        frameRate: 10,
        repeat: 0
    });

    this.anims.create({
        key: 'attack1',
        frames: this.anims.generateFrameNumbers('playerattack', { start: 0, end: 7 }),
        frameRate: 14,
        repeat: 0
    });

    this.anims.create({
        key: 'attack2',
        frames: this.anims.generateFrameNumbers('playerattack', { start: 4, end: 7 }),
        frameRate: 10,
        repeat: 0
    });

    // Start player state at idle
    this.playerState = 'idle';

    // Create ground as a static physics group for collision
    this.ground = this.physics.add.staticGroup();
    this.ground.create(400, 590, null).setDisplaySize(800, 20).refreshBody();

    // Set up collision between player and ground
    this.physics.add.collider(this.player, this.ground);

    // Player movement and jump speeds
    this.playerSpeed = 200;
    this.jumpVelocity = -600;

    // Add horizontal drag to slow player when no input
    this.player.body.setDragX(800);

    // Create input handlers for cursors and WASD keys
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Disable browser right-click context menu on game canvas
    this.input.mouse.disableContextMenu();

    // Input: Attack on mouse left or right click, only if on ground and not already attacking
    this.input.on('pointerdown', (pointer) => {
    if (pointer.leftButtonDown()) {
        // Block left click in air
        if (this.player.body.blocked.down && !['attack1', 'attack2'].includes(this.playerState)) {
            changeState.call(this, 'attack1');
        }
    } else if (pointer.rightButtonDown()) {
        // Allow right click always
        if (!['attack1', 'attack2'].includes(this.playerState)) {
            changeState.call(this, 'attack2');
        }
    }
});


    // When attack animation finishes, decide next state based on player status
    this.player.on('animationcomplete-attack1', () => {
        if (!this.player.body.blocked.down) {
            changeState.call(this, 'fall');
        } else if (isMoving(this)) {
            changeState.call(this, 'walk');
        } else {
            changeState.call(this, 'idle');
        }
    });

    this.player.on('animationcomplete-attack2', () => {
        if (!this.player.body.blocked.down) {
            changeState.call(this, 'fall');
        } else if (isMoving(this)) {
            changeState.call(this, 'walk');
        } else {
            changeState.call(this, 'idle');
        }
    });

    // When landing animation finishes, decide next state based on movement
    this.player.on('animationcomplete-land', () => {
        if (isMoving(this)) {
            changeState.call(this, 'walk');
        } else {
            changeState.call(this, 'idle');
        }
    });

    // Track if player was on the ground last frame (to detect landing)
    this.wasOnGround = true;
}

function update() {
    const body = this.player.body;
    const onGround = body.blocked.down;

    // Check input for left/right movement and jump
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const space = this.cursors.space.isDown || this.wasd.space.isDown;

    let velocityX = 0;

    if (!['attack1', 'attack2'].includes(this.playerState)) {
        // Horizontal movement input
        if (left) {
            velocityX = -this.playerSpeed;
            this.player.setFlipX(true); // Face left
        } else if (right) {
            velocityX = this.playerSpeed;
            this.player.setFlipX(false); // Face right
        }

        // Apply horizontal velocity
        this.player.setVelocityX(velocityX);

        // Jump input: only if on ground and space is pressed
        if (space && onGround) {
            this.player.setVelocityY(this.jumpVelocity);
            changeState.call(this, 'jump');
        }
    } else {
        // If attacking, stop horizontal movement
        this.player.setVelocityX(0);
    }

    // Detect landing event (was in air last frame, now on ground)
    const justLanded = !this.wasOnGround && onGround;
    if (justLanded && !['attack1', 'attack2'].includes(this.playerState)) {
        changeState.call(this, 'land');
    }

    // Detect transition from jump to fall (when moving downwards)
    if (!onGround) {
        if (this.playerState === 'jump' && body.velocity.y > 0) {
            changeState.call(this, 'fall');
        }
        // If not in jump, fall, or attack, but falling, switch to fall state
        else if (!['jump', 'fall', 'attack1', 'attack2'].includes(this.playerState) && body.velocity.y > 0) {
            changeState.call(this, 'fall');
        }
    }

    // Handle grounded movement animations if not in jump, fall, attack or land states
    if (onGround && !['jump', 'fall', 'attack1', 'attack2', 'land'].includes(this.playerState)) {
        if (velocityX !== 0 && this.playerState !== 'walk') {
            changeState.call(this, 'walk');
        } else if (velocityX === 0 && this.playerState !== 'idle') {
            changeState.call(this, 'idle');
        }
    }

    // Update ground state for next frame
    this.wasOnGround = onGround;
}

// Utility: Check if player is moving left or right
function isMoving(ctx) {
    return ctx.cursors.left.isDown || ctx.wasd.left.isDown || ctx.cursors.right.isDown || ctx.wasd.right.isDown;
}

// Change player animation state and play the animation
function changeState(newState) {
    if (this.playerState === newState) return; // Ignore if already in this state

    // console.log(`Changing state from ${this.playerState} to ${newState}`); // Debug line
    this.playerState = newState;
    this.player.play(newState);
}