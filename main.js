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

    this.load.spritesheet('playerattack', 'assets/player/attack/attack-01-sheet.png', {
        frameWidth: 96,
        frameHeight: 64
    });
}

function create() {
    this.player = this.physics.add.sprite(400, 300, 'playerIdle', 0);
    this.player.setOrigin(0.5, 1);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(48, 64);

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
        key: 'land',
        frames: this.anims.generateFrameNumbers('playerland', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: 0
    });

    this.anims.create({
        key: 'attack',
        frames: this.anims.generateFrameNumbers('playerattack', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: 0
    });

    this.player.play('idle');

    this.ground = this.physics.add.staticGroup();
    this.ground.create(400, 590, null).setDisplaySize(800, 20).refreshBody();
    this.physics.add.collider(this.player, this.ground);

    this.playerSpeed = 200;
    this.jumpVelocity = -600;
    this.player.body.setDragX(800);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.isAttacking = false;

    this.input.on('pointerdown', (pointer) => {
        if (
            pointer.leftButtonDown() &&
            !this.isAttacking &&
            this.player.body.blocked.down // only allow attack on ground
        ) {
            this.isAttacking = true;
            this.player.play('attack');
        }
    });

    this.player.on('animationstart-attack', () => {
        this.isAttacking = true;
    });

    this.player.on('animationcomplete-attack', () => {
        this.isAttacking = false;

        const body = this.player.body;
        const onGround = body.blocked.down;

        const isMoving = this.cursors.left.isDown || this.cursors.right.isDown || this.wasd.left.isDown || this.wasd.right.isDown;

        if (onGround) {
            if (isMoving) {
                this.player.play('walk');
            } else {
                this.player.play('idle');
            }
        } else {
            this.player.play('jump');
        }
    });

    this.prevVelocityY = 0;
    this.falling = false;
    this.landingPlaying = false;
    this.wasOnGround = true;

    this.player.on('animationcomplete-land', () => {
        if (this.landingPlaying) {
            this.player.play('idle');
            this.landingPlaying = false;
        }
    });
}

function update() {
    const body = this.player.body;
    const onGround = body.blocked.down;
    let velocityX = 0;

    const justLanded = !this.wasOnGround && onGround;

    const animKey = this.player.anims.currentAnim?.key;

    // Block movement/jump input if attacking
    const blockAnim = (animKey === 'attack');

    if (blockAnim) {
        body.setVelocityX(0);
    } else {
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

        if ((this.cursors.space.isDown || this.wasd.space.isDown) && onGround) {
            body.setVelocityY(this.jumpVelocity);
            this.player.play('jump', true);
            this.falling = false;
            this.landingPlaying = false;
        }
    }

    if (justLanded && !this.landingPlaying && !blockAnim) {
        this.landingPlaying = true;
        this.player.play('land');
        // Removed the lastLandingTime and cooldown here
    }

    if (!blockAnim) {
        if (!onGround) {
            if (!this.falling && animKey !== 'jump') {
                this.player.play('jump');
            }
            this.falling = true;
        } else {
            this.falling = false;
            if (this.landingPlaying) {
                // waiting for landing animation to finish
            } else {
                if (velocityX !== 0) {
                    if (animKey !== 'walk') {
                        this.player.play('walk');
                    }
                } else {
                    if (animKey !== 'idle') {
                        this.player.play('idle');
                    }
                }
            }
        }
    }

    this.prevVelocityY = body.velocity.y;
    this.wasOnGround = onGround;
}
