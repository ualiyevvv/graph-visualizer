export class GraphLayoutNew {
    constructor(nodes, edges) {
        this.nodes = nodes; // массив вершин
        this.edges = edges; // массив рёбер

        // Параметры алгоритма
        this.attraction_constant = 0.1; // Константа притяжения
        this.repulsion_constant = 10000; // Константа отталкивания
        this.max_velocity = 50; // Максимальная скорость вершины
        this.cooling_factor = 0.95; // Фактор охлаждения
        this.temperature = 100; // Начальная "температура" системы
    }

    // Расчёт силы отталкивания
    calculateRepulsionForce(node1, node2) {
        const dx = node1.position.x - node2.position.x;
        const dy = node1.position.y - node2.position.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Установка минимального расстояния
        const minDistance = 5;
        distance = Math.max(distance, minDistance);

        const forceMagnitude = this.repulsion_constant / (distance * distance);
        const forceX = forceMagnitude * dx / distance;
        const forceY = forceMagnitude * dy / distance;

        return { x: forceX, y: forceY };
    }

    // Расчёт силы притяжения
    calculateAttractionForce(edge) {
        const dx = edge.target.position.x - edge.source.position.x;
        const dy = edge.target.position.y - edge.source.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const forceMagnitude = this.attraction_constant * distance;

        const forceX = forceMagnitude * dx / distance;
        const forceY = forceMagnitude * dy / distance;

        return { x: forceX, y: forceY };
    }

    // Обновление положений вершин
    updatePositions() {
        if (this.temperature < 1) return; // Критерий остановки

        // Расчёт сил
        this.nodes.forEach(node => {
            node.force = { x: 0, y: 0 };

            // Силы отталкивания
            this.nodes.forEach(otherNode => {
                if (node !== otherNode) {
                    const force = this.calculateRepulsionForce(node, otherNode);
                    node.force.x += force.x;
                    node.force.y += force.y;
                }
            });

            // Силы притяжения
            this.edges.forEach(edge => {
                if (edge.source === node || edge.target === node) {
                    const force = this.calculateAttractionForce(edge);
                    node.force.x += force.x;
                    node.force.y += force.y;
                }
            });
        });

        // Перемещение вершин и охлаждение системы
        this.nodes.forEach(node => {
            node.velocity = {
                x: Math.min(node.force.x, this.max_velocity),
                y: Math.min(node.force.y, this.max_velocity)
            };

            node.position.x += node.velocity.x;
            node.position.y += node.velocity.y;
        });

        this.temperature *= this.cooling_factor;
    }
}