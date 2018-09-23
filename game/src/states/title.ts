import * as Assets from '../assets';

export default class Title extends Phaser.State {

    private white: Phaser.BitmapData;
    private playerBD: Phaser.BitmapData;
    private blocks: Phaser.Group;
    private player: Phaser.Sprite;
    private cursors: Phaser.CursorKeys;

    public create(): void {
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

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
    }

    public update(): void {
        var hitPlatform = this.game.physics.arcade.collide(this.player, this.blocks);

        this.player.body.velocity.x = 0;

        if (this.cursors.left.isDown) {
            this.player.body.velocity.x = -150;
        }
        else if (this.cursors.right.isDown) {
            this.player.body.velocity.x = 150;
        }
    }
}
