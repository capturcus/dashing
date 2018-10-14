import * as Assets from '../assets';

const ACCELERATION = 400;
const FRICTION_OFFSET = 10;
const X_JUMP_FACTOR = 20;
const Y_JUMP_FACTOR = 0.6;
const STATIONARY_JUMP = 300;
const Y_JUMP_NERF = 0.5;
const JUMP_WINDOW = 12;
const SIDE_JUMP_ANGLE = 40;

const GAME_SCALE = 0.5;

export default class Title extends Phaser.State {

    private white: Phaser.BitmapData;
    private playerBD: Phaser.BitmapData;
    private blocks: Phaser.Group;
    private player: Phaser.Sprite;
    private cursors: Phaser.CursorKeys;
    private previousVelocity: Phaser.Point = new Phaser.Point();

    private jumpWindow: number = 0;

    public restart(): void {
        this.game.world.removeAll(true, false, true);

        this.world.setBounds(-10000, -10000, 20000, 20000);

        this.blocks = this.game.add.group();
        this.blocks.enableBody = true;

        this.white = new Phaser.BitmapData(this.game, "white", 1, 1);
        this.white.fill(255, 255, 255);

        this.playerBD = new Phaser.BitmapData(this.game, "player", 1, 1);
        this.playerBD.fill(0, 255, 0);

        this.player = this.game.add.sprite(350, 100, this.playerBD);
        this.player.width = 32;
        this.player.height = 48;

        this.game.physics.arcade.enable(this.player);
        this.player.body.gravity.y = 1000;
        this.player.body.width = this.player.body.width * GAME_SCALE;
        this.player.body.height = this.player.body.height * GAME_SCALE;
        this.player.body.collideWorldBounds = true;

        let level = this.game.cache.getJSON('level');
        for (let b of level.blocks) {
            let s = this.blocks.create(b.x, b.y, this.white) as Phaser.Sprite;
            s.width = b.width;
            s.height = b.height;
            s.body.setSize(GAME_SCALE, GAME_SCALE);
            s.body.immovable = true;
        }

        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.game.camera.reset();
        this.game.camera.scale.x = .5;
        this.game.camera.scale.y = .5;
        this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_PLATFORMER);
    }

    public create(): void {
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.restart();

        this.input.keyboard.onDownCallback = ((e) => {
            if (e.key === "r") {
                console.log("RESTART");
                this.restart();
            }
            if (e.key === " ") {
                this.jumpWindow = JUMP_WINDOW;
            }
        })
    }

    private getJumpVelocity(v: Phaser.Point) {
        let jump = Math.sqrt(Math.abs(v.x)) * X_JUMP_FACTOR + Math.abs(v.y) * Y_JUMP_FACTOR;
        return Math.max(jump, STATIONARY_JUMP);
    }

    private getFinalJumpVelocity(): number {
        return Math.max(this.getJumpVelocity(this.player.body.velocity), this.getJumpVelocity(this.previousVelocity));
    }

    private getAcceleration(b: Phaser.Physics.Arcade.Body): number {
        return Math.abs(ACCELERATION - Math.abs(b.velocity.x));
    }

    public update(): void {
        var hitPlatform = this.game.physics.arcade.collide(this.player, this.blocks);

        this.player.body.acceleration.x = 0;

        if (this.cursors.left.isDown) {
            this.player.body.acceleration.x = -this.getAcceleration(this.player.body);
        }
        else if (this.cursors.right.isDown) {
            this.player.body.acceleration.x = this.getAcceleration(this.player.body);
        }

        if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
            this.player.body.velocity.x = Math.sign(this.player.body.velocity.x) *
                Math.max(Math.abs(this.player.body.velocity.x) - FRICTION_OFFSET, 0);
        }

        if (this.jumpWindow > 0 && this.player.body.touching.down && hitPlatform) {
            this.player.body.velocity.y = -this.getFinalJumpVelocity();
            this.jumpWindow = 0;
        }
        else if (this.jumpWindow > 0 && this.player.body.touching.left && hitPlatform) {
            let jumpVector = new Phaser.Point(0, -this.getFinalJumpVelocity()).rotate(0, 0, 90-SIDE_JUMP_ANGLE, true);
            this.player.body.velocity.x = jumpVector.x;
            this.player.body.velocity.y = jumpVector.y;
            this.jumpWindow = 0;
        }
        else if (this.jumpWindow > 0 && this.player.body.touching.right && hitPlatform) {
            let jumpVector = new Phaser.Point(0, -this.getFinalJumpVelocity()).rotate(0, 0, -90+SIDE_JUMP_ANGLE, true);
            this.player.body.velocity.x += jumpVector.x;
            this.player.body.velocity.y += jumpVector.y;
            this.jumpWindow = 0;
        }

        // update player's color with regard to jumpWindow
        let blue = (this.jumpWindow / JUMP_WINDOW) * 255;
        this.playerBD.fill(0, 255, blue);

        if (this.jumpWindow > 0) {
            this.jumpWindow--;
        }

        this.previousVelocity.x = this.player.body.velocity.x;
        this.previousVelocity.y = this.player.body.velocity.y;
    }
}
