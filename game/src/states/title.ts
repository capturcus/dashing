import * as Assets from '../assets';

const ACCELERATION = 200;
const FRICTION_OFFSET = 10;
const X_JUMP_FACTOR = 40;
const Y_JUMP_FACTOR = 0.6;
const STATIONARY_JUMP = 300;
const Y_JUMP_NERF = 0.5;

export default class Title extends Phaser.State {

    private white: Phaser.BitmapData;
    private playerBD: Phaser.BitmapData;
    private blocks: Phaser.Group;
    private player: Phaser.Sprite;
    private cursors: Phaser.CursorKeys;
    private previousVelocity: Phaser.Point = new Phaser.Point();

    public create(): void {
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.world.setBounds(-1000, -1000, 2000, 2000);

        this.blocks = this.game.add.group();
        this.blocks.enableBody = true;

        this.white = new Phaser.BitmapData(this.game, "white", 1, 1);
        this.white.fill(255, 255, 255);

        this.playerBD = new Phaser.BitmapData(this.game, "player", 32, 48);
        this.playerBD.fill(255, 0, 0);

        this.player = this.game.add.sprite(350, 100, this.playerBD);
        this.game.physics.arcade.enable(this.player);
        this.player.body.gravity.y = 1000;
        this.player.body.collideWorldBounds = true;

        let level = this.game.cache.getJSON('level');
        for (let b of level.blocks) {
            let s = this.blocks.create(b.x, b.y, this.white) as Phaser.Sprite;
            s.scale.x = b.width;
            s.scale.y = b.height;
            s.body.immovable = true;
        }

        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.game.camera.reset();
        this.game.camera.follow(this.player, Phaser.Camera.FOLLOW_TOPDOWN);
    }

    private getJumpVelocity(v: Phaser.Point) {
        /*let squareJump = (Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2)));
        console.log("SQRT JUMP", Math.sqrt(squareJump));
        let jump = Math.max(Math.sqrt(squareJump)*JUMP_MODIFIER, STATIONARY_JUMP);
        return -jump;*/
        let jump = Math.sqrt(Math.abs(v.x))*X_JUMP_FACTOR + Math.abs(v.y)*Y_JUMP_FACTOR;
        return -Math.max(jump, STATIONARY_JUMP);
    }

    public update(): void {
        var hitPlatform = this.game.physics.arcade.collide(this.player, this.blocks);

        this.player.body.acceleration.x = 0;

        if (this.cursors.left.isDown) {
            this.player.body.acceleration.x = -ACCELERATION;
        }
        else if (this.cursors.right.isDown) {
            this.player.body.acceleration.x = ACCELERATION;
        }

        if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
            this.player.body.velocity.x = Math.sign(this.player.body.velocity.x) *
                Math.max(Math.abs(this.player.body.velocity.x) - FRICTION_OFFSET, 0);
        }

        if (this.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && this.player.body.touching.down && hitPlatform) {
            console.log(this.player.body.velocity, this.previousVelocity);

            this.player.body.velocity.y =
                Math.min(this.getJumpVelocity(this.player.body.velocity), this.getJumpVelocity(this.previousVelocity));
        }

        // this.previousVelocity = new Phaser.Point(this.player.body.velocity);
        this.previousVelocity.x = this.player.body.velocity.x;
        this.previousVelocity.y = this.player.body.velocity.y;
    }
}
