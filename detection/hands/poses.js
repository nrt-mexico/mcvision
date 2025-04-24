import {calculateDistance} from './utils.js'

const HAND_LANDMARKS = {
    WRIST: 0,
    THUMB_TIP: 4,
    INDEX_FINGER_TIP: 8,
    MIDDLE_FINGER_MCP: 9,
    MIDDLE_FINGER_TIP: 12,
    RING_FINGER_TIP: 16,
    PINKY_TIP: 20,
}

class HandPose {
    constructor(distanceThreshold = 0.1, callback = null) {
        this.distanceThreshold = distanceThreshold;
        this.movable = false;
        this.callback = callback;
    }

    // Métodos abstractos (deben ser implementados por subclases)
    calculateCenter(points) {
        throw new Error('calculateCenter debe ser implementado por la subclase');
    }

    validate(points) {
        throw new Error('validate debe ser implementado por la subclase');
    }

    getScaleReference(points) {
        // Calcula la referencia de escala basada en la distancia entre WRIST y MIDDLE_FINGER_MCP
        const base = points[HAND_LANDMARKS.WRIST];
        const middleMcp = points[HAND_LANDMARKS.MIDDLE_FINGER_MCP];
        return calculateDistance(base, middleMcp);
    }

    getPointsOfInterest(points) {
        // Obtiene los puntos clave de la mano
        return {
            base: points[HAND_LANDMARKS.WRIST],
            thumb: points[HAND_LANDMARKS.THUMB_TIP],
            index: points[HAND_LANDMARKS.INDEX_FINGER_TIP],
            middle: points[HAND_LANDMARKS.MIDDLE_FINGER_TIP],
            ring: points[HAND_LANDMARKS.RING_FINGER_TIP],
            pinky: points[HAND_LANDMARKS.PINKY_TIP],
        };
    }

    calculateNormalizedDistances(base, points, scaleReference) {
        // Calcula las distancias normalizadas desde un punto base a otros puntos
        return points.map(point => calculateDistance(base, point) / scaleReference);
    }
}

export class OpenHandPose extends HandPose{

    calculateCenter(points){
        return points[handSolution.HAND_LANDMARKS.INDEX_FINGER_PIP]
    }
    
    validate(points) {
        const points_of_interest = this.getPointsOfInterest(points);
        const scale_reference = this.getScaleReference(points);
        const distances = this.calculateNormalizedDistances(
            points_of_interest["base"],
            [points_of_interest["index"], points_of_interest["middle"], points_of_interest["ring"],
            points_of_interest["pinky"], points_of_interest["thumb"]],
            scale_reference
        );
        return distances.every((d) => d > this.distanceThreshold);
    }
}

export class CloseHandPose extends HandPose{

    calculateCenter(points){
        return points[handSolution.HAND_LANDMARKS.INDEX_FINGER_PIP]
    }
    
    validate(points) {
        const points_of_interest = this.getPointsOfInterest(points);
        const scale_reference = this.getScaleReference(points);
        const distances = this.calculateNormalizedDistances(
            points_of_interest["base"],
            [points_of_interest["index"], points_of_interest["middle"], points_of_interest["ring"],
            points_of_interest["pinky"], points_of_interest["thumb"]],
            scale_reference
        );
        return distances.every((d) => d < this.distanceThreshold);
    }
}

export class ClickPose extends HandPose {

    calculateCenter(points) {
        return points[HAND_LANDMARKS.INDEX_FINGER_TIP];
    }

    validate(points) {
        const points_of_interest = this.getPointsOfInterest(points);
        const scale_reference = this.getScaleReference(points);
        const distances = this.calculateNormalizedDistances(
            points_of_interest["thumb"],
            [points_of_interest["index"]],
            scale_reference
        );

        const areClose = distances[0] < this.distanceThreshold;
        const isBelow = points_of_interest["middle"].y > points_of_interest["index"].y;
        return areClose && isBelow;
    }
}

class HandPoseMovements extends HandPose {
    constructor(distanceThreshold = 0.1, movementThreshold = 0.005, callback = null) {
        super(distanceThreshold, callback);
        this.movementThreshold = movementThreshold;
        this.movable = true;
    }

    calculateMovement(lastPoints, currentPoints) {
        const center1 = this.calculateCenter(lastPoints);
        const center2 = this.calculateCenter(currentPoints);
        const distance = calculateDistance(center1, center2);
        return distance < this.movementThreshold ? 0 : distance;
    }
}

export class HandPointerPose extends HandPoseMovements {


    calculateCenter(points) {
        const index_pip = points[HAND_LANDMARKS.INDEX_FINGER_TIP];
        const middle_pip = points[HAND_LANDMARKS.MIDDLE_FINGER_TIP];

        const x = (index_pip.x + middle_pip.x) / 2;
        const y = (index_pip.y + middle_pip.y) / 2;

        return {x, y};
    }

    validate(points) {
        const points_of_interest = this.getPointsOfInterest(points);
        const scale_reference = this.getScaleReference(points);
        const index_middle_distance = calculateDistance(points_of_interest["index"], points_of_interest["middle"], scale_reference);
        const thumb_ring_distance = calculateDistance(points_of_interest["thumb"], points_of_interest["ring"], scale_reference);
        return index_middle_distance < this.distanceThreshold  && thumb_ring_distance < this.distanceThreshold;
    }

    calculate_movement(self, last_points, current_points){
        if (!laslast_points || !current_points)
            return 0;
        
        const center1 = self.calculate_center(last_points)
        const center2 = self.calculate_center(current_points)
        const distance = calculateDistance(center1, center2)
        
        // Verifica si el movimiento es significativo
        if (Math.abs(distance) < self.movement_threshold)
            return 0;
        
        
        // Si la dirección cambia, ignora el movimiento hasta que sea consistente
        return distance
    }
}