const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1d1d1d',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
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
}

function create() {
    // Create player sprite from idle spritesheet
    this.player = this.physics.add.sprite(400, 300, 'playerIdle', 0);
    this.player.setOrigin(0.5, 1);
    this.player.setCollideWorldBounds(true);

    // Set physics body size to better match idle sprite
    this.player.body.setSize(48, 64); // narrower than sprite width for better collision

    // idle animation
    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('playerIdle', { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
    });

    // run animation
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('playerwalk', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });

    // jump animation
    this.anims.create({
        key: 'jump',
        frames: this.anims.generateFrameNumbers('playerjump', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: 0
    });

    // landing animation
    this.anims.create({
        key: 'land',
        frames: this.anims.generateFrameNumbers('playerland', { start: 0, end: 2 }),
        frameRate: 8,
        repeat: 0
    });

    // Play idle animation by default
    this.player.play('idle');

    // Create ground
    this.ground = this.physics.add.staticGroup();
    this.ground.create(400, 590, null).setDisplaySize(800, 20).refreshBody();

    // Collisions
    this.physics.add.collider(this.player, this.ground);

    // Player movement config
    this.playerSpeed = 200;
    this.jumpVelocity = -600;

    // Add some horizontal drag for smoother stops
    this.player.body.setDragX(800);

    // Input keys
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Variables to track vertical velocity and landing state
    this.prevVelocityY = 0;
    this.falling = false;
    this.landingPlaying = false;
    this.wasOnGround = true;

    // When landing animation completes, go to idle if still landing
    this.player.on('animationcomplete-land', () => {
        if (this.landingPlaying) {
            this.player.play('idle');
            this.landingPlaying = false;
        }
    });
}

function update() {
    const body = this.player.body;
    let velocityX = 0;

    // Left/right movement
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
        velocityX = -this.playerSpeed;
        this.player.setFlipX(true);
        this.player.body.setSize(60, 64);
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
        velocityX = this.playerSpeed;
        this.player.setFlipX(false);
        this.player.body.setSize(60, 64);
    } else {
        this.player.body.setSize(48, 64);
    }

    body.setVelocityX(velocityX);

    const onGround = body.blocked.down;

    // Detect start of fall (velocityY switches from <=0 to >0)
    if (!onGround && this.prevVelocityY <= 0 && body.velocity.y > 0) {
        this.falling = true;
        this.player.play('land', true);  // Play landing animation when starting to fall
    }

    // Jump input
    if ((this.cursors.up.isDown || this.wasd.up.isDown) && onGround) {
        body.setVelocityY(this.jumpVelocity);
        this.player.play('jump', true);
        this.falling = false;
        this.landingPlaying = false;
    }

    if (onGround) {
        if (!this.wasOnGround) {
            // Just landed on ground
            this.landingPlaying = true;
            this.falling = false;
            this.player.play('land');
        }

        if (this.landingPlaying) {
            if (velocityX !== 0) {
                this.player.play('walk');
                this.landingPlaying = false;
            }
            // else wait for landing animation to finish
        } else {
            if (velocityX !== 0) {
                if (this.player.anims.currentAnim?.key !== 'walk') {
                    this.player.play('walk');
                }
            } else {
                if (this.player.anims.currentAnim?.key !== 'idle') {
                    this.player.play('idle');
                }
            }
        }
    } else {
        // Airborne and not falling start, keep jump animation if not already playing
        if (!this.falling && this.player.anims.currentAnim?.key !== 'jump') {
            this.player.play('jump');
        }
    }

    this.prevVelocityY = body.velocity.y;
    this.wasOnGround = onGround;
}
