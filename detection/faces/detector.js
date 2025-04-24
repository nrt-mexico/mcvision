const drawingUtils = window;

export class FaceDetector {
  constructor(videoEl, canvasEl, callback = null, draw=true) {
    this.video = videoEl;
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.callback = callback;
    this.faceMesh = new FaceDetection({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
    });

    this.faceMesh.setOptions({
      model: 'short',
      minDetectionConfidence: 0.5
    });

    this.draw = draw;

    this.faceMesh.onResults(this.onResults.bind(this));
  }

    async process(image) {
        await this.faceMesh.send({ image });
    }

   onResults(results) {
      const ctx = this.ctx;
      if(this.draw) ctx.clearRect(0, 0, canvas.width, canvas.height);
      if(this.draw) ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
  
      if (results.detections.length > 0) {
          const detection = results.detections[0];
  
            
          // Medir el tamaño del bounding box para estimar "distancia"
          const box = detection.boundingBox;
          const boxWidth = box.width * canvas.width;
          const boxHeight = box.height * canvas.height;
  
          const area = boxWidth * boxHeight;
          const areaThreshold = 4000; // ajusta este valor según tus pruebas

          // Si la cara es lo suficientemente grande, ejecuta el callback
          this.callback({detection, nearest: area > areaThreshold});
         
            if(!this.draw)
            return;
           // Dibuja bounding box
           drawingUtils.drawRectangle(
            ctx, detection.boundingBox,
            { color: area > areaThreshold ? 'blue' : 'red', lineWidth: 4, fillColor: '#00000000' });
      }
  }

}