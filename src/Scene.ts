import { Sound } from "@pixi/sound";
import gsap from "gsap";
import { Application, Container, NineSlicePlane, Sprite, Text, TextStyle, Texture } from "pixi.js";

export class Scene extends Container {
    app: Application;
    contentContainer: Container;
    handle: Sprite;
    isHandleDown = false;
    handleTimer = 1.5;
    reels: Sprite[] = [];
    isRotating = false;
    reelTimer = 0;
    reelsCount = 0;
    middleMinRange = -48;
    middleMaxRange = 48;
    reelsResults: number[] = [];
    translationSpeed = 12;
    money = 1000;
    moneyText: Text;
    playCost = 50;
    winMultipler = 10;
    infoMoneyText: Text;
    allPositions: number[] = [];

    leverSfx: Sound;
    clankSfx: Sound;
    reelSfx: Sound;
    winSfx: Sound;
    loseSfx: Sound;

    constructor(app: Application) {
        super();
        this.app = app;
        this.update = this.update.bind(this);

        this.leverSfx = Sound.from("assets/sfx/lever.mp3");
        this.clankSfx = Sound.from("assets/sfx/clank.mp3");
        this.reelSfx = Sound.from("assets/sfx/reel.mp3");
        this.reelSfx.loop = true;
        this.winSfx = Sound.from("assets/sfx/win.mp3");
        this.loseSfx = Sound.from("assets/sfx/lose.mp3");

        this.contentContainer = new Container();
        this.contentContainer.position.set(window.innerWidth / 2, window.innerHeight / 2);
        this.addChild(this.contentContainer);

        const background = Sprite.from("assets/background.jpg");
        background.alpha = 0.5;
        background.anchor.set(0.5);
        this.contentContainer.addChild(background);

        const reelsPos = [-194, -38, 118];

        for (let i = 0; i < 3; i++) {
            this.reels[i] = this.createReel("reel.png", reelsPos[i]);
            this.contentContainer.addChild(this.reels[i]);
            const cherry_symbol = this.createSymbol("cherry_symbol.png", 0);
            this.reels[i].addChild(cherry_symbol);

            const symbolHeight = cherry_symbol.height;
            this.assignReelPositions(symbolHeight);

            const bell_symbol = this.createSymbol("bell_symbol.png", -symbolHeight);
            this.reels[i].addChild(bell_symbol);

            const _7Symbol = this.createSymbol("7_symbol.png", symbolHeight);
            this.reels[i].addChild(_7Symbol);

            const bar_symbol = this.createSymbol("bar_symbol.png", -symbolHeight * 2);
            this.reels[i].addChild(bar_symbol);
        }

        const upperPanel = new NineSlicePlane(Texture.from("assets/panel.png"));
        upperPanel.width = 475;
        upperPanel.height = 130;
        upperPanel.pivot.set(upperPanel.width, 0);
        upperPanel.x = window.innerWidth / 2;
        upperPanel.y = -window.innerHeight / 2;
        this.contentContainer.addChild(upperPanel);

        const lowerPanel = new NineSlicePlane(Texture.from("assets/panel.png"));
        lowerPanel.width = 485;
        lowerPanel.height = 115;
        lowerPanel.pivot.set(lowerPanel.width, lowerPanel.height);
        lowerPanel.x = window.innerWidth / 2;
        lowerPanel.y = window.innerHeight / 2;

        this.contentContainer.addChild(lowerPanel);

        const mainTextStyle = new TextStyle({ fill: 0x000000, fontSize: 30 });

        this.moneyText = new Text("Dinero: " + this.money.toString());
        this.moneyText.style = { fill: 0x000000, fontSize: 50 };
        this.moneyText.anchor.set(0.5);
        this.moneyText.position.set(upperPanel.width / 2, upperPanel.height / 2 - 10);
        upperPanel.addChild(this.moneyText);

        const playCost = new Text("Costo por tirada: " + this.playCost);
        playCost.style = mainTextStyle;
        playCost.anchor.set(0.5);
        playCost.position.set(lowerPanel.width / 2, lowerPanel.height / 2 + 25);
        lowerPanel.addChild(playCost);

        const winMultiplierText = new Text("Multiplicador al ganar: x" + this.winMultipler);
        winMultiplierText.style = mainTextStyle;
        winMultiplierText.anchor.set(0.5);
        winMultiplierText.position.set(lowerPanel.width / 2 + 25, lowerPanel.height / 2 - 25);
        lowerPanel.addChild(winMultiplierText);

        this.infoMoneyText = new Text("");
        this.infoMoneyText.style = mainTextStyle;
        this.infoMoneyText.anchor.set(0.5);
        this.infoMoneyText.position.set(upperPanel.width / 2 + 80, upperPanel.height / 2 + 35);
        upperPanel.addChild(this.infoMoneyText);

        const jackpot_machine = this.createSymbol("jackpot_machine.png");
        jackpot_machine.anchor.set(0.5);
        jackpot_machine.scale.set(1.2);
        this.contentContainer.addChild(jackpot_machine);

        this.handle = Sprite.from("assets/handle_up.png");
        this.handle.anchor.set(0.5);
        this.handle.position.set(272.5, 120);
        this.handle.interactive = true;
        this.handle.on("pointerdown", this.executePlay.bind(this));
        jackpot_machine.addChild(this.handle);

        window.addEventListener("resize", this.resizeCanvas.bind(this));

        app.ticker.add(this.update);
    }

    resizeCanvas(): void {
        const resize = () => {
            this.app.renderer.resize(window.innerWidth, window.innerHeight);
            this.app.stage.scale.x = window.innerWidth / this.app.view.width;
            this.app.stage.scale.y = window.innerHeight / this.app.view.height;

            this.contentContainer.x = window.innerWidth / 2 - this.contentContainer.width / 2;
            this.contentContainer.y = window.innerHeight / 2 - this.contentContainer.height / 2;
            this.contentContainer.position.set(window.innerWidth / 2, window.innerHeight / 2);
        };

        resize();

        window.addEventListener("resize", resize);
    }

    createReel(textureName: string, xPos: number): Sprite {
        const reel = Sprite.from("assets/" + textureName);
        reel.anchor.set(0.5);
        reel.scale.set(1.2);
        reel.position.set(xPos, 47);
        return reel;
    }

    createSymbol(textureName: string, yPosition = 0): Sprite {
        const spr = Sprite.from("assets/" + textureName);
        spr.anchor.set(0.5);
        spr.position.y = yPosition;
        return spr;
    }

    assignReelPositions(symbolHeight: number): void {
        this.allPositions[0] = -symbolHeight * 2;
        this.allPositions[1] = -symbolHeight;
        this.allPositions[2] = 0;
        this.allPositions[3] = symbolHeight;
        this.allPositions[4] = symbolHeight * 2;
    }

    update(delta: number) {
        if (this.isHandleDown) {
            this.handleTimer -= 0.01;
            if (this.handleTimer <= 0) {
                this.resetHandle();
            }
        }
        if (this.isRotating) {
            this.rotateReel();
            this.reelTimer -= 0.01;
            if (this.reelTimer <= 0) {
                this.reelTimer = this.setRandomNumber(1, 15);
                this.reelsCount += 1;
                this.setToMiddle(this.reelsCount);
            } else if (this.reelsCount == 3) {
                this.isRotating = false;
            }
        }
    }

    setRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min) + min);
    }

    executePlay(): void {
        if (!this.isRotating) {
            this.handle.texture = Texture.from("assets/handle_down.png");
            this.handle.position.y += 56;
            this.handle.removeAllListeners();
            this.leverSfx.play();
            this.reelSfx.play();
            this.updateMoney(-this.playCost);
            this.isHandleDown = true;
            this.reelTimer = this.setRandomNumber(1, 15);
            this.isRotating = true;
            this.reelsCount = 0;
        }
    }

    updateMoney(value: number): void {
        this.money += value;
        this.displayMoneyUpdate(value);
        this.updateMoneyUI();
    }

    updateMoneyUI(): void {
        this.moneyText.text = "Dinero: " + this.money;
    }

    displayMoneyUpdate(value: number): void {
        this.infoMoneyText.text = value > 0 ? "+" + value.toString() : value.toString();
        gsap.delayedCall(3, this.setOffMoneyDisplay.bind(this));
    }

    setOffMoneyDisplay(): void {
        this.infoMoneyText.text = "";
    }

    resetHandle(): void {
        this.handle.texture = Texture.from("assets/handle_up.png");
        this.handle.position.y -= 56;
        this.handle.on("pointerdown", this.executePlay.bind(this));
        this.isHandleDown = false;
        this.handleTimer = 1.5;
    }

    rotateReel(): void {
        for (let i = this.reelsCount; i < this.reels.length; i++) {
            this.reels[i].children.forEach((sprite) => {
                this.doSingleSymbolTranslation(sprite as Sprite, this.translationSpeed);
            });
        }
    }

    setToMiddle(index: number): void {
        this.clankSfx.play();
        this.reels[index - 1].children.forEach((element, symbolIndex) => {
            if (element.position.y >= this.middleMinRange && element.position.y <= this.middleMaxRange) {
                this.saveResults(index - 1, symbolIndex);
            }
        });
        this.reels[index - 1].children.forEach((element) => {
            for (let i = 0; i < this.allPositions.length; i++) {
                if (
                    element.position.y + this.middleMaxRange >= this.allPositions[i] &&
                    element.position.y + this.middleMinRange <= this.allPositions[i]
                ) {
                    gsap.to(element, { y: this.allPositions[i] });
                }
            }
            gsap.delayedCall(0.5, () => console.log(element.position.y));
        });
    }

    doSingleSymbolTranslation(symbol: Sprite, speed: number) {
        symbol.position.y += speed;
        if (symbol.position.y >= this.allPositions[4]) {
            symbol.position.y = this.allPositions[0];
        }
    }

    saveResults(reelIndex: number, symbolIndex: number): void {
        this.reelsResults[reelIndex] = symbolIndex;
        if (this.reelsResults.length == 3) {
            this.reelSfx.stop();
            this.checkForMatch();
            this.reelsResults = [];
        }
    }
    checkForMatch(): void {
        let matches = 0;
        this.reelsResults.forEach((value) => {
            if (this.reelsResults[0] === value) {
                matches += 1;
            }
        });
        matches == 3 ? this.wonBet() : this.loseBet();
    }
    wonBet(): void {
        this.updateMoney(this.playCost * this.winMultipler);
        this.winSfx.play();
    }
    loseBet(): void {
        this.loseSfx.play();
    }
}
