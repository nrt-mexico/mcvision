import { HandsDetector } from './hands/detector.js';
import { VisionManager} from './vision.js'
import { OpenHandPose, ClickPose, HandPointerPose } from './hands/poses.js';
import { isColliding } from './utils.js';	

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');


const detector = new HandsDetector(videoElement, canvasElement);
const cursor = document.querySelector('#cursor');

detector.addPose(new HandPointerPose(0.1,0.05,({movement, center})=>{
    // Mueve el cursor a la posición de la mano (center)
    if (!cursor || !center) return;

    // Convierte coordenadas normalizadas a píxeles según el tamaño del viewport
    const x = center.x * window.innerWidth;
    const y = center.y * window.innerHeight;
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;

}
)); // Añadir la pose de mano abierta con un umbral de 0.1


let clickableElements = []

const customEvent = new CustomEvent('handclick', { bubbles: true });
detector.addPose(new ClickPose(0.3,()=>{  
    clickableElements?.forEach((element)=>element.dispatchEvent(customEvent));

})); // Añadir la pose de mano abierta con un umbral de 0.1



let blocked = false;
export const bindClick = (element,callback) => {
  
    element.addEventListener('handclick', ()=>{
        if (blocked) return;
        if (!isColliding(element, cursor)) {
           return
        }
     
        blocked = true;
        callback();
        setTimeout(() => {
            blocked = false;
        }, 1000);
    });
    clickableElements.push(element);
}

const manager = new VisionManager(videoElement, canvasElement, async () => {
    await detector.process(videoElement);
    // await faceDetector.process(videoElement);
})

manager.start();





