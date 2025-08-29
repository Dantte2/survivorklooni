const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1d1d1d',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
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
    // idle animations
    this.load.spritesheet('playerSheet', 'assets/player/idle/pinkidle.png', {
        frameWidth: 32,
        frameHeight: 32
    });
    //walking animation
    this.load.spritesheet('playerWalk', 'assets/player/moving/pnikwalking.png', {
        frameWidth: 32,
        frameHeight: 32
    });
}

function create() {
    //player walking animations all directions
    this.anims.create({
        key: 'walk_right',
        frames: this.anims.generateFrameNumbers('playerWalk', { start: 13, end: 16 }),
        frameRate: 8,
        repeat: -1
    });

    this.anims.create({
        key: 'walk_left',
        frames: this.anims.generateFrameNumbers('playerWalk', { start: 9, end: 11 }),
        frameRate: 8,
        repeat: -1
    });

    this.anims.create({
        key: 'walk_up',
        frames: this.anims.generateFrameNumbers('playerWalk', { start: 1, end: 3 }),
        frameRate: 8,
        repeat: -1
    });

    this.anims.create({
        key: 'walk_down',
        frames: this.anims.generateFrameNumbers('playerWalk', { start: 5, end: 7 }),
        frameRate: 8,
        repeat: -1
    });

    // Player idle animations for all directions
    this.anims.create({
        key: 'idle_down',
        frames: this.anims.generateFrameNumbers('playerSheet', { start: 6, end: 9 }),
        frameRate: 6,
        repeat: -1
    });

    this.anims.create({
        key: 'idle_right',
        frames: this.anims.generateFrameNumbers('playerSheet', { start: 16, end: 20 }),
        frameRate: 6,
        repeat: -1
    });

    this.anims.create({
        key: 'idle_left',
        frames: this.anims.generateFrameNumbers('playerSheet', { start: 11, end: 14 }),
        frameRate: 6,
        repeat: -1
    });

    this.anims.create({
        key: 'idle_up',
        frames: this.anims.generateFrameNumbers('playerSheet', { start: 1, end: 4 }),
        frameRate: 6,
        repeat: -1
    });

    // Create player sprite and scale it up 2x
    this.player = this.physics.add.sprite(400, 300, 'playerSheet', 6);
    const scale = 2;
    this.player.setScale(scale);
    this.player.setCollideWorldBounds(true);
    this.player.play('idle_down');

    const body = this.player.body;
    body.setCollideWorldBounds(true);
    body.setCircle(20 * scale);           // scale the circle radius
    body.setOffset(-20 * scale, -20 * scale); // scale the offset
    body.setDrag(1000, 1000);              // Smooth stop, no sliding
    body.setMaxVelocity(200, 200);

    this.playerSpeed = 200;

    // Keyboard inputs
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Default facing right
    this.playerDirectionX = 1;
    this.playerDirectionY = 0;
}

function update() {
    const body = this.player.body;
    body.setVelocity(0);

    let newDirX = 0;
    let newDirY = 0;

    // Only allow horizontal or vertical movement, no diagonal
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
        newDirX = -1;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
        newDirX = 1;
    } else if (this.cursors.up.isDown || this.wasd.up.isDown) {
        newDirY = -1;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
        newDirY = 1;
    }

    body.setVelocityX(newDirX * this.playerSpeed);
    body.setVelocityY(newDirY * this.playerSpeed);

    // Update direction only if moving
    if (newDirX !== 0 || newDirY !== 0) {
        this.playerDirectionX = newDirX;
        this.playerDirectionY = newDirY;

        // Play walking animation based on direction
        if (newDirX === 1) {
            if (this.player.anims.currentAnim?.key !== 'walk_right') {
                this.player.play('walk_right');
            }
            this.player.setFlipX(false);
        } else if (newDirX === -1) {
            if (this.player.anims.currentAnim?.key !== 'walk_right') {
                this.player.play('walk_right');
            }
            this.player.setFlipX(true);
        } else if (newDirY === 1) {
            if (this.player.anims.currentAnim?.key !== 'walk_down') {
                this.player.play('walk_down');
            }
        } else if (newDirY === -1) {
            if (this.player.anims.currentAnim?.key !== 'walk_up') {
                this.player.play('walk_up');
            }
        }
    } else {
        // Player stopped: play idle animation based on last direction
        if (this.playerDirectionX === 1) {
            if (this.player.anims.currentAnim?.key !== 'idle_right') {
                this.player.play('idle_right');
            }
            this.player.setFlipX(false);
        } else if (this.playerDirectionX === -1) {
            if (this.player.anims.currentAnim?.key !== 'idle_right') {
                this.player.play('idle_right');
            }
            this.player.setFlipX(true);
        } else if (this.playerDirectionY === 1) {
            if (this.player.anims.currentAnim?.key !== 'idle_down') {
                this.player.play('idle_down');
            }
            this.player.setFlipX(false);
        } else if (this.playerDirectionY === -1) {
            if (this.player.anims.currentAnim?.key !== 'idle_up') {
                this.player.play('idle_up');
            }
            this.player.setFlipX(false);
        }
    }
}
