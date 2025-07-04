// Calcula la distancia euclidiana entre dos puntos (en este caso, cada punto de la mano)
export function calculateDistance(point1, point2) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}
