import { Application, Loader, Texture, AnimatedSprite } from "pixi.js";
import "./style.css";
import * as PIXI from "pixi.js";
import { Scene as Scene } from "./Scene";

const gameWidth = 1920;
const gameHeight = 1080;

const app = new Application({
    backgroundColor: 0xd3d3d3,
    width: gameWidth,
    height: gameHeight,
});

const main = async () => {
    // Main app
    let app = new PIXI.Application();

    // Display application properly
    document.body.style.margin = "0";
    app.renderer.view.style.position = "absolute";
    app.renderer.view.style.display = "block";

    // View size = windows
    app.renderer.resize(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", (e) => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
    });

    // Load assets
    await loadGameAssets();
    document.body.appendChild(app.view);

    // Set scene
    var scene = new Scene(app);
    app.stage.addChild(scene);
};

main();

async function loadGameAssets(): Promise<void> {
    return new Promise((res, rej) => {
        const loader = Loader.shared;
        loader
            .add("assets/jackpot_machine.png")
            .add("assets/handle_up.png")
            .add("assets/handle_down.png")
            .add("assets/reel.png")
            .add("assets/cherry_symbol.png")
            .add("assets/bell_symbol.png")
            .add("assets/7_symbol.png")
            .add("assets/bar_symbol.png")
            .add("assets/sfx/clank.mp3")
            .add("assets/sfx/lever.mp3")
            .add("assets/sfx/reel.mp3")
            .add("assets/sfx/win.mp3")
            .add("assets/sfx/lose.mp3")
            .add("assets/panel.png")
            .add("assets/background.jpg");

        loader.onComplete.once(() => {
            res();
        });

        loader.onError.once(() => {
            rej();
        });

        loader.load();
    });
}
