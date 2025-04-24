export class HandsDetector {
  constructor(videoEl, canvasEl, distanceThreshold = 0.1, draw=true) {
    this.video = videoEl;
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.distanceThreshold = distanceThreshold;

    this.lastDetection = null;
    this.currentDetection = null;
    this.poses = [];

    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    });

    this.draw = draw;

    this.hands.onResults(this.onResults.bind(this));
  }

  async process(image) {
    await this.hands.send({ image });
  }

  onResults(results) {
    this.lastDetection = this.currentDetection;
    this.currentDetection = results;
  
    const ctx = this.ctx;
    if(this.draw) ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(this.draw) ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
  
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const validPose = this.checkPoses();
      
      if(!this.draw)
            return;
            
      for (const landmarks of results.multiHandLandmarks) {
        const color = validPose ? '#00FF00' : '#FF0000'; // verde si match, rojo si no
  
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color, lineWidth: 2 });
        drawLandmarks(ctx, landmarks, { color, radius: 3 });
      }
    }
  }

  addPose(pose) {
    this.poses.push(pose);
  }

  checkPoses() {
    let someValid = false;

    for (const pose of this.poses) {
      const [isValid, movement] = this.getPose(pose);
    
      if (isValid) {
        // Si la pose es movable, pasamos tambi¨¦n la posici¨®n central de la mano
        let center = null;
        if (pose.movable && this.currentDetection?.multiHandLandmarks) {
          const points = this.currentDetection.multiHandLandmarks[0];
          center = pose.calculateCenter(points);
        }
        if(pose.callback) pose.callback({movement, center});
        someValid = true;
      }
    }
    return someValid;
  }

  getPoints() {
    if (!this.currentDetection?.multiHandLandmarks) return [];
    return this.currentDetection.multiHandLandmarks[0].map((lm) => ({ x: lm.x, y: lm.y, z: lm.z }));
  }

  getLandmark(handIndex, landmarkIndex) {
    if (!this.currentDetection?.multiHandLandmarks) return null;
    return this.currentDetection.multiHandLandmarks[handIndex]?.[landmarkIndex] || null;
  }

  getPose(pose) {
    if (!this.currentDetection?.multiHandLandmarks) return [false, 0];
    const points = this.currentDetection.multiHandLandmarks[0];

    if (!pose.validate(points)) return [false, 0];
    if (!pose.movable) return [true, 0];

    if (!this.lastDetection?.multiHandLandmarks) return [true, 0];

    const prevPoints = this.lastDetection.multiHandLandmarks[0];
    let distance = 0;
    if (pose.movable && prevPoints){
      distance = pose.calculateMovement(prevPoints, points);
    }
    
    return [true, distance];
  }
}

