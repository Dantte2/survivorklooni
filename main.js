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
    // Load your bullet spritesheet, 16x16 frames
    this.load.spritesheet('bullets', 'assets/bullets/firebullets.png', {
        frameWidth: 16,
        frameHeight: 16
    });
    // Load player spritesheet with idle animations
    this.load.spritesheet('playerSheet', 'assets/player/idle/idleAnimations.png', {
        frameWidth: 64,
        frameHeight: 64
    });
}

function shootBullet() {
    // Create bullet at player's current position
    const bullet = this.bullet.create(this.player.x, this.player.y);

    bullet.play('fireBullet');          // play animation
    bullet.setScale(2);                  // scale bullet up
    bullet.body.setAllowGravity(false); // no gravity on bullets

    // Calculate flip and rotation based on playerDirectionX/Y
    const dirX = this.playerDirectionX;
    const dirY = this.playerDirectionY;

    if (dirX === -1 && dirY === 0) {
        // Shooting left — flip horizontally
        bullet.setFlipX(true);
        bullet.setRotation(0);
    } else if (dirX === 0 && dirY === -1) {
        // Shooting up — rotate -90 degrees
        bullet.setFlipX(false);
        bullet.setRotation(-Math.PI / 2);
    } else if (dirX === 0 && dirY === 1) {
        // Shooting down — rotate 90 degrees
        bullet.setFlipX(false);
        bullet.setRotation(Math.PI / 2);
    } else if (dirX === 1 && dirY === 0) {
        // Shooting right — no flip, no rotation
        bullet.setFlipX(false);
        bullet.setRotation(0);
    } else {
        // Diagonal shooting — no flip, rotate to angle
        bullet.setFlipX(false);
        const angle = Math.atan2(dirY, dirX);
        bullet.setRotation(angle);
    }

    // Set bullet velocity based on direction & speed
    const speed = 300;
    bullet.body.setVelocityX(speed * dirX);
    bullet.body.setVelocityY(speed * dirY);
}

function create() {
    this.bullet = this.physics.add.group(); // bullet group

    // Create bullet animation frames 456-459 (your spritesheet frames)
    this.anims.create({
        key: 'fireBullet',
        frames: this.anims.generateFrameNumbers('bullets', { start: 456, end: 459 }),
        frameRate: 10,
        repeat: -1
    });

    // Auto-shoot every 1000 ms
    this.time.addEvent({
        delay: 1000,
        callback: shootBullet,
        callbackScope: this,
        loop: true
    });

    // Create player with physics
    this.player = this.physics.add.sprite(400, 300, 'playerSheet', 40);
    this.player.setCollideWorldBounds(true);

    // Configure player physics body
    const body = this.player.body;
    body.setCollideWorldBounds(true);
    body.setCircle(20);
    body.setOffset(-20, -20);

    // Add drag to stop sliding
    body.setDrag(1000, 1000);

    // Limit max velocity
    body.setMaxVelocity(200, 200);

    this.playerSpeed = 200;

    // Keyboard inputs setup
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
    // Remove offscreen bullets
    this.bullet.children.each(bullet => {
        if (bullet.x > 800 || bullet.x < 0 || bullet.y > 600 || bullet.y < 0) {
            bullet.destroy();
        }
    });

    // Reset player velocity explicitly for both axes
    const body = this.player.body;
    body.setVelocity(0, 0);

    // Track current input direction
    let newDirX = 0;
    let newDirY = 0;

    // Horizontal movement input
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
        body.setVelocityX(-this.playerSpeed);
        newDirX = -1;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
        body.setVelocityX(this.playerSpeed);
        newDirX = 1;
    }

    // Vertical movement input
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
        body.setVelocityY(-this.playerSpeed);
        newDirY = -1;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
        body.setVelocityY(this.playerSpeed);
        newDirY = 1;
    }

    // Update facing direction only if input detected
    if (newDirX !== 0 || newDirY !== 0) {
        this.playerDirectionX = newDirX;
        this.playerDirectionY = newDirY;
    }

    // Set default facing right if undefined
    if (typeof this.playerDirectionX === 'undefined' || typeof this.playerDirectionY === 'undefined') {
        this.playerDirectionX = 1;
        this.playerDirectionY = 0;
    }
}
