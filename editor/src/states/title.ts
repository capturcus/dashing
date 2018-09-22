import * as Assets from '../assets';

enum Corner {
    UpperLeft,
    UpperRight,
    LowerLeft,
    LowerRight,
    None
}

class GameRectangle {
    public rect: Phaser.Rectangle;
    public clickedCorner: Corner = Corner.None;
    public draggedVector: Phaser.Point;

    constructor(x, y, width, height) {
        this.rect = new Phaser.Rectangle(x, y, width, height);
    }
}

const CIRCLE_RADIUS = 5;
const CORNER_COLOR = 0xff0000;
const CLICKED_CORNER_COLOR = 0x0000ff;
const DEFAULT_REC_SIZE = 100;
const ZOOM_AMOUT = 0.05;

export default class Title extends Phaser.State {

    private graphics: Phaser.Graphics;
    private recs: Array<GameRectangle> = [];

    private draggedRecs: Array<GameRectangle> = [];

    private dragVector: Phaser.Point;

    public drawGameRectangle(r: GameRectangle) {

        // draw the rectangle itself
        this.graphics.beginFill(0xffffff, 1);
        this.graphics.drawRect(r.rect.x, r.rect.y, r.rect.width, r.rect.height);

        // draw handles
        this.graphics.beginFill(r.clickedCorner === Corner.UpperLeft ? CLICKED_CORNER_COLOR : CORNER_COLOR, 1);
        this.graphics.drawCircle(r.rect.x, r.rect.y, CIRCLE_RADIUS * 2);
        this.graphics.beginFill(r.clickedCorner === Corner.UpperRight ? CLICKED_CORNER_COLOR : CORNER_COLOR, 1);
        this.graphics.drawCircle(r.rect.x + r.rect.width, r.rect.y, CIRCLE_RADIUS * 2);
        this.graphics.beginFill(r.clickedCorner === Corner.LowerLeft ? CLICKED_CORNER_COLOR : CORNER_COLOR, 1);
        this.graphics.drawCircle(r.rect.x, r.rect.y + r.rect.height, CIRCLE_RADIUS * 2);
        this.graphics.beginFill(r.clickedCorner === Corner.LowerRight ? CLICKED_CORNER_COLOR : CORNER_COLOR, 1);
        this.graphics.drawCircle(r.rect.x + r.rect.width, r.rect.y + r.rect.height, CIRCLE_RADIUS * 2);


        this.graphics.endFill();
    }

    public getPointerWorldX() {
        return this.input.activePointer.worldX / this.game.camera.scale.x;
    }

    public getPointerWorldY() {
        return this.input.activePointer.worldY / this.game.camera.scale.y;
    }

    public addBlock() {
        this.recs.push(new GameRectangle(
            this.getPointerWorldX() - DEFAULT_REC_SIZE / 2,
            this.getPointerWorldY() - DEFAULT_REC_SIZE / 2,
            DEFAULT_REC_SIZE,
            DEFAULT_REC_SIZE
        ));
    }

    public deleteBlock() {
        let j = -1;
        for (let i = 0; i < this.recs.length; i++) {
            if (this.recs[i].rect.contains(this.getPointerWorldX(), this.getPointerWorldY())) {
                j = i;
                break;
            }
        }
        if (j !== -1) {
            this.recs.splice(j, 1);
        }
    }

    public create(): void {
        this.game.canvas.oncontextmenu = function(e) { e.preventDefault(); }
        this.game.world.setBounds(0, 0, 10000, 10000);

        this.graphics = this.game.add.graphics(0, 0);

        this.recs.push(new GameRectangle(100, 100, 100, 100));
        this.recs.push(new GameRectangle(300, 200, 200, 50));

        this.game.input.onDown.add((pointer, event) => {
            if (this.input.activePointer.leftButton.isDown) {
                for (var r of this.recs) {
                    let draggingWholeBlock = this.checkPointerWithRec(this.getPointerWorldX(), this.getPointerWorldY(), r);
                    if (draggingWholeBlock) {
                        break;
                    }
                }
            }
            if (this.input.activePointer.rightButton.isDown) {
                this.dragVector = new Phaser.Point(this.getPointerWorldX(), this.getPointerWorldY());
            }
        }, this);

        this.game.input.onUp.add((pointer, event) => {
            this.draggedRecs = [];
            this.dragVector = undefined;
        }, this);

        this.game.input.keyboard.onDownCallback = (e) => {
            if (e.key === "1") {
                this.addBlock();
            }
            if (e.key === "2") {
                this.deleteBlock();
            }
        };

        this.game.input.mouse.mouseWheelCallback = (event) => {
            this.zoom(this.game.input.mouse.wheelDelta);
        }
    }

    public checkPointerWithRec(pointerX: number, pointerY: number, r: GameRectangle) {
        if (Phaser.Math.distance(pointerX, pointerY, r.rect.x, r.rect.y) < CIRCLE_RADIUS) {
            r.clickedCorner = Corner.UpperLeft;
            this.draggedRecs.push(r);
            return false;
        }
        if (Phaser.Math.distance(pointerX, pointerY, r.rect.x + r.rect.width, r.rect.y) < CIRCLE_RADIUS) {
            r.clickedCorner = Corner.UpperRight;
            this.draggedRecs.push(r);
            return false;
        }
        if (Phaser.Math.distance(pointerX, pointerY, r.rect.x, r.rect.y + r.rect.height) < CIRCLE_RADIUS) {
            r.clickedCorner = Corner.LowerLeft;
            this.draggedRecs.push(r);
            return false;
        }
        if (Phaser.Math.distance(pointerX, pointerY, r.rect.x + r.rect.width, r.rect.y + r.rect.height) < CIRCLE_RADIUS) {
            r.clickedCorner = Corner.LowerRight;
            this.draggedRecs.push(r);
            return false;
        }

        r.clickedCorner = Corner.None;

        if (r.rect.contains(pointerX, pointerY)) {
            r.draggedVector = new Phaser.Point(r.rect.x - pointerX, r.rect.y - pointerY);
            this.draggedRecs.push(r);
            return true;
        }
    }

    public updateDraggedRec(r: GameRectangle) {
        let worldX = this.getPointerWorldX();
        let worldY = this.getPointerWorldY();
        switch (r.clickedCorner) {
            case Corner.LowerRight:
                r.rect.width = worldX - r.rect.x;
                r.rect.height = worldY - r.rect.y;
                break;

            case Corner.LowerLeft:
                r.rect.width = r.rect.x - worldX + r.rect.width;
                r.rect.x = worldX;
                r.rect.height = worldY - r.rect.y;
                break;

            case Corner.UpperRight:
                r.rect.width = worldX - r.rect.x;
                r.rect.height = r.rect.y - worldY + r.rect.height;
                r.rect.y = worldY;
                break;

            case Corner.UpperLeft:
                r.rect.width = r.rect.x - worldX + r.rect.width;
                r.rect.x = worldX;
                r.rect.height = r.rect.y - worldY + r.rect.height;
                r.rect.y = worldY;
                break;

            case Corner.None:
                for (let r of this.draggedRecs) {
                    if (r.clickedCorner !== Corner.None) {
                        break;
                    }
                }
                r.rect.x = worldX + r.draggedVector.x;
                r.rect.y = worldY + r.draggedVector.y;

                break;
        }
    }

    public updateDraggedRecs() {
        for (let r of this.draggedRecs) {
            this.updateDraggedRec(r);
        }
    }

    public zoom(dir) {
        this.game.camera.scale.x += ZOOM_AMOUT * dir;
        this.game.camera.scale.y += ZOOM_AMOUT * dir;
    }

    public update(): void {
        this.updateDraggedRecs();

        if (typeof this.dragVector !== 'undefined') {
            let deltaX = this.getPointerWorldX() - this.dragVector.x;
            let deltaY = this.getPointerWorldY() - this.dragVector.y;
            this.camera.x -= deltaX;
            this.camera.y -= deltaY;
            this.dragVector.x = this.getPointerWorldX()
            this.dragVector.y = this.getPointerWorldY()
        }
    }

    public render(): void {
        this.graphics.clear();

        for (var r of this.recs) {
            this.drawGameRectangle(r);
        }
    }
}
