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

export default class Title extends Phaser.State {

    private graphics: Phaser.Graphics;
    private recs: Array<GameRectangle> = [];

    private draggedRecs: Array<GameRectangle> = [];

    public drawGameRectangle(r: GameRectangle) {

        // draw the rectangle itself
        this.graphics.beginFill(0xffffff, 1);
        this.graphics.drawRect(r.rect.x, r.rect.y, r.rect.width, r.rect.height);

        // draw handles
        this.graphics.beginFill(r.clickedCorner === Corner.UpperLeft ? CLICKED_CORNER_COLOR : CORNER_COLOR, 1);
        this.graphics.drawCircle(r.rect.x, r.rect.y, CIRCLE_RADIUS*2);
        this.graphics.beginFill(r.clickedCorner === Corner.UpperRight ? CLICKED_CORNER_COLOR : CORNER_COLOR, 1);
        this.graphics.drawCircle(r.rect.x+r.rect.width, r.rect.y, CIRCLE_RADIUS*2);
        this.graphics.beginFill(r.clickedCorner === Corner.LowerLeft ? CLICKED_CORNER_COLOR : CORNER_COLOR, 1);
        this.graphics.drawCircle(r.rect.x, r.rect.y+r.rect.height, CIRCLE_RADIUS*2);
        this.graphics.beginFill(r.clickedCorner === Corner.LowerRight ? CLICKED_CORNER_COLOR : CORNER_COLOR, 1);
        this.graphics.drawCircle(r.rect.x+r.rect.width, r.rect.y+r.rect.height, CIRCLE_RADIUS*2);


        this.graphics.endFill();
    }

    public create(): void {
        this.graphics = this.game.add.graphics(0, 0);

        this.recs.push(new GameRectangle(100, 100, 100, 100));
        this.recs.push(new GameRectangle(300, 200, 200, 50));

        this.game.input.onDown.add((pointer, event) => {
            for(var r of this.recs) {
                this.checkPointerWithRec(this.input.activePointer.worldX, this.input.activePointer.worldY, r);
            }
        }, this);

        this.game.input.onUp.add((pointer, event) => {
            this.draggedRecs = [];
        }, this);
    }

    public checkPointerWithRec(pointerX: number, pointerY: number, r: GameRectangle) {
        if (Phaser.Math.distance(pointerX, pointerY, r.rect.x, r.rect.y) < CIRCLE_RADIUS) {
            r.clickedCorner = Corner.UpperLeft;
            this.draggedRecs.push(r);
            return;
        }
        if (Phaser.Math.distance(pointerX, pointerY, r.rect.x+r.rect.width, r.rect.y) < CIRCLE_RADIUS) {
            r.clickedCorner = Corner.UpperRight;
            this.draggedRecs.push(r);
            return;
        }
        if (Phaser.Math.distance(pointerX, pointerY, r.rect.x, r.rect.y+r.rect.height) < CIRCLE_RADIUS) {
            r.clickedCorner = Corner.LowerLeft;
            this.draggedRecs.push(r);
            return;
        }
        if (Phaser.Math.distance(pointerX, pointerY, r.rect.x+r.rect.width, r.rect.y+r.rect.height) < CIRCLE_RADIUS) {
            r.clickedCorner = Corner.LowerRight;
            this.draggedRecs.push(r);
            return;
        }

        r.clickedCorner = Corner.None;

        if(r.rect.contains(pointerX, pointerY)) {
            r.draggedVector = new Phaser.Point(r.rect.x - pointerX, r.rect.y - pointerY);
            this.draggedRecs.push(r);
        }
    }

    public updateDraggedRec(r: GameRectangle) {
        switch(r.clickedCorner) {
            case Corner.LowerRight:
            r.rect.width = this.input.activePointer.worldX - r.rect.x;
            r.rect.height = this.input.activePointer.worldY - r.rect.y;
            break;

            case Corner.LowerLeft:
            r.rect.width = r.rect.x - this.input.activePointer.worldX + r.rect.width;
            r.rect.x = this.input.activePointer.worldX;
            r.rect.height = this.input.activePointer.worldY - r.rect.y;
            break;

            case Corner.UpperRight:
            r.rect.width = this.input.activePointer.worldX - r.rect.x;
            r.rect.height = r.rect.y - this.input.activePointer.worldY + r.rect.height;
            r.rect.y = this.input.activePointer.worldY;
            break;

            case Corner.UpperLeft:
            r.rect.width = r.rect.x - this.input.activePointer.worldX + r.rect.width;
            r.rect.x = this.input.activePointer.worldX;
            r.rect.height = r.rect.y - this.input.activePointer.worldY + r.rect.height;
            r.rect.y = this.input.activePointer.worldY;
            break;

            case Corner.None:
            for (let r of this.draggedRecs) {
                if(r.clickedCorner !== Corner.None) {
                    break;
                }
            }
            r.rect.x = this.input.activePointer.worldX + r.draggedVector.x;
            r.rect.y = this.input.activePointer.worldY + r.draggedVector.y;
            break;
        }
    }

    public updateDraggedRecs() {
        for (let r of this.draggedRecs) {
            this.updateDraggedRec(r);
        }
    }

    public update(): void {
        this.updateDraggedRecs();
    }

    public render(): void {
        this.graphics.clear();

        for (var r of this.recs) {
            this.drawGameRectangle(r);
        }
    }
}
