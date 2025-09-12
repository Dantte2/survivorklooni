const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    pixelArt: true,
    backgroundColor: '#1d1d1d',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 1100 },
        }
    },
    plugins: {
        scene: [
            {
                key: 'AnimatedTiles',
                plugin: window.AnimatedTiles, 
                mapping: 'animatedTiles'
            }
        ]
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
    this.load.image('sky', 'assets/tiles/sky.png');
    this.load.image('Yellow-Tree', 'assets/tiles/Yellow-Tree.png');
    this.load.image('background', 'assets/tiles/background.png');
    this.load.tilemapTiledJSON('map', 'assets/tiles/testi.json');
}

function create() {
    // ==== TILEMAP ====
    const map = this.make.tilemap({ key: 'map' });

    // Add tilesets matching your tileset names in Tiled and preload keys
    const tilesTileset = map.addTilesetImage('Tiles', 'tiles');
    const backgroundTileset = map.addTilesetImage('Background', 'background');
    const skyTileset = map.addTilesetImage('sky', 'sky');
    const yellowTreeTileset = map.addTilesetImage('Yellow-Tree', 'Yellow-Tree');

    // Create layers by their names from Tiled
    const backgroundLayer = map.createLayer('background', [tilesTileset, skyTileset], 0, 0);
    const cliffsLayer = map.createLayer('cliffs', backgroundTileset, 0, 0);
    const trees2Layer = map.createLayer('trees2', backgroundTileset, 0, 0);
    const treesLayer = map.createLayer('trees', [backgroundTileset, yellowTreeTileset], 0, 0);
    const groundLayer = map.createLayer('ground', tilesTileset, 0, 0);
    const decorLayer = map.createLayer('decor', tilesTileset, 0, 0);
    console.log('animatedTiles plugin:', this.animatedTiles);
    this.sys.animatedTiles.init(map);
    
    // ==== SPAWN PLAYER FROM OBJECT LAYER ====
    const spawnLayer = map.getObjectLayer('spawn');
    console.log('spawnLayer:', spawnLayer);
    let spawnX = 400;
    let spawnY = 1300;

    if (!spawnLayer) {
        console.warn("⚠️ Spawn layer not found! Using default spawn position.");
    } else {
        const playerSpawn = spawnLayer.objects.find(obj => obj.name === 'playerspawn');
        console.log('playerSpawn:', playerSpawn);
        if (playerSpawn) {
            spawnX = playerSpawn.x;
            spawnY = playerSpawn.y;
        } else {
            console.warn("⚠️ 'playerspawn' object not found in spawn layer. Using default.");
        }
    }

    // ✅ Create the player at spawn position (whether default or object)
    this.player = this.physics.add.sprite(spawnX, spawnY, 'playerIdle', 0);
    this.player.setOrigin(0.5, 1);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(48, 64);
    this.player.setDepth(10);
    decorLayer.setDepth(15);

    // ==== CAMERA SETUP ====
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // ==== COLLISION FROM OBJECT LAYER 'collision' ====
    const collisionObjects = map.getObjectLayer('collision');

    if (collisionObjects && collisionObjects.objects.length > 0) {
        this.collisionGroup = this.physics.add.staticGroup();

        collisionObjects.objects.forEach(obj => {
            const centerX = obj.x + obj.width / 2;
            const centerY = obj.y + obj.height / 2; // Important Y offset!

            // Create a rectangle physics body (invisible)
            const rect = this.collisionGroup.create(centerX, centerY, null);
            rect.setOrigin(0.5, 0.5);
            rect.body.setSize(obj.width, obj.height);
        });

        // Add collider between player and collision group
        this.physics.add.collider(this.player, this.collisionGroup);
    } else {
        console.warn("No collision objects found in the 'collision' object layer!");
    }

    // ==== ANIMATIONS ====
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

    // ==== PLAYER STATE ====
    this.playerState = 'idle';
    this.playerSpeed = 200;
    this.jumpVelocity = -600;
    this.player.body.setDragX(800);

    // ==== INPUT ====
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.input.mouse.disableContextMenu();

    this.input.on('pointerdown', (pointer) => {
        if (pointer.leftButtonDown()) {
            if (this.player.body.blocked.down && !['attack1', 'attack2'].includes(this.playerState)) {
                changeState.call(this, 'attack1');
            }
        } else if (pointer.rightButtonDown()) {
            if (!['attack1', 'attack2'].includes(this.playerState)) {
                changeState.call(this, 'attack2');
            }
        }
    });

    // ==== ANIMATION CALLBACKS ====
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

    this.player.on('animationcomplete-land', () => {
        if (isMoving(this)) {
            changeState.call(this, 'walk');
        } else {
            changeState.call(this, 'idle');
        }
    });

    this.wasOnGround = true;
}



function update(time, delta) {
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