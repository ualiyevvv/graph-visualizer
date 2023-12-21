class GraphNode {
    /**
     * Конструктор для создания узла графа.
     * @param {any} id Уникальный идентификатор узла.
     * @param {number} size Размер узла.
     * @param {Object} properties Объект свойств узла.
     */
    constructor(id, size, properties) {
        this.id = id; // Уникальный идентификатор узла
        this.size = size; // Размер узла
        this.properties = properties || {}; // Свойства узла (можно передать объект с дополнительными данными)
    }
}

class GraphEdge {
    /**
     * Конструктор для создания ребра графа.
     * @param {any} source Исходный узел.
     * @param {any} target Узел-назначение.
     * @param {number} [weight=1] Вес ребра.
     * @param {Object} properties Объект свойств ребра.
     */
    constructor(source, target, weight, properties) {
        this.source = source; // Исходный узел
        this.target = target; // Узел-назначение
        this.weight = weight || 1; // Вес ребра (по умолчанию 1)
        this.properties = properties || {}; // Вес ребра (по умолчанию 1)
    }
}

export class Graph {
    constructor() {
        this.nodes = new Map(); // Хранение узлов графа
        this.edges = []; // Хранение рёбер графа
    }

    /**
     * Добавляет узел в граф.
     * @param {GraphNode} node Узел для добавления.
     */
    addNode(node) {
        if (this.nodes.has(node.id)) {
            // throw new Error("Узел с таким ID уже существует.");
            return
        }

        this.nodes.set(node.id, node);
    }


    /**
     * Возвращает узел по его идентификатору.
     * @param {any} nodeId Идентификатор узла.
     * @returns {GraphNode|undefined} Узел, если он найден, иначе undefined.
     */
    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }


    /**
     * Добавление направленного ребра между узлами.
     * @param {any} source Исходный узел.
     * @param {any} target Узел-назначение.
     * @param {number} weight Вес ребра.
     * @param {Object} properties Свойства ребра.
     */
    addDirectedEdge(source, target, weight, properties) {
        if (!this.nodes.has(source.id) || !this.nodes.has(target.id)) {
            throw new Error("Узлы должны существовать в графе.");
        }

        const edge = new GraphEdge(source, target, weight, properties);
        this.edges.push(edge);
    }

    /**
     * Возвращает ребро между двумя узлами, если оно существует.
     * @param {any} source Исходный узел.
     * @param {any} target Узел-назначение.
     * @returns {GraphEdge|undefined} Ребро, если оно найдено, иначе undefined.
     */
    getEdge(source, target) {
        return this.edges.find(edge => edge.source === source && edge.target === target);
    }

    hasNode(nodeId) {
        return this.nodes.has(nodeId);

    }

    // Получение всех соседних узлов для данного узла
    getNeighbors(node) {
        if (!this.nodes.has(node.id)) {
            throw new Error("Узел не существует в графе.");
        }

        const neighbors = [];
        for (const edge of this.edges) {
            if (edge.source === node) {
                neighbors.push({ node: edge.target, weight: edge.weight });
            }
        }

        return neighbors;
    }

    // Получение всех узлов в графе
    getAllNodes() {
        return Array.from(this.nodes.values());
    }

}

