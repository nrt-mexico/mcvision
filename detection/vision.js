export class VisionManager{
    constructor(videEl, canvasEl, onFrame) {
        
        this.video = videEl;
        this.canvas = canvasEl;

        this.camera = new Camera(this.video, {
            onFrame,
            width: 640,
            height: 480,
          });
    }

    start() {
        this.camera.start();
    }
}   