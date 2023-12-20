/**
 * Класс Graph представляет структуру данных для графа.
 * Он поддерживает как ориентированные, так и неориентированные графы.
 */
export class Graph {
    /**
     * Создает экземпляр Graph.
     * @param {boolean} isDirected Указывает, является ли граф ориентированным. По умолчанию false.
     */
    constructor(isDirected = false) {
        this.nodes = new Map(); // Словарь для хранения узлов
        this.edges = [];        // Массив для хранения рёбер
        this.isDirected = isDirected;
    }

    /**
     * Добавляет узел в граф.
     * @param {number} id Уникальный идентификатор узла.
     * @param {*} value Значение, связанное с узлом.
     * @param {Object} [properties={}] Дополнительные свойства узла.
     */
    addNode(id, value, properties = {}) {
        this.nodes.set(id, { id, value, properties });
    }

    /**
     * Добавляет ребро в граф.
     * @param {number} source Идентификатор начального узла ребра.
     * @param {number} target Идентификатор конечного узла ребра.
     * @param {*} value Значение, связанное с ребром.
     */
    addEdge(source, target, value) {
        const edge = { source, target, value };
        this.edges.push(edge);
        if (!this.isDirected) {
            this.edges.push({ source: target, target: source, value });
        }
    }

    /**
     * Добавляет несколько узлов в граф.
     * @param {Array} nodesArray Массив узлов для добавления.
     */
    addNodes(nodesArray) {
        for (const { id, value, properties } of nodesArray) {
            this.addNode(id, value, properties);
        }
    }

    /**
     * Добавляет несколько рёбер в граф.
     * @param {Array} edgesArray Массив рёбер для добавления.
     */
    addEdges(edgesArray) {
        for (const { source, target, value } of edgesArray) {
            this.addEdge(source, target, value);
        }
    }

    /**
     * Возвращает все узлы, которые имеют рёбра, направленные к указанному узлу.
     * @param {number} nodeId Идентификатор узла, входящие узлы которого необходимо найти.
     * @returns {Array} Массив узлов, направленных к указанному узлу.
     */
    getIncomingNodes(nodeId) {
        const incomingNodes = new Set();
        for (const edge of this.edges) {
            if (edge.target === nodeId) {
                const sourceNode = this.nodes.get(edge.source);
                if (sourceNode) {
                    incomingNodes.add(sourceNode);
                }
            }
        }
        return Array.from(incomingNodes);
    }

    /**
     * Выводит информацию о графе в консоль.
     */
    printGraph() {
        for (let [id, node] of this.nodes) {
            const edges = this.edges.filter(edge => edge.source === id);
            const formattedEdges = edges.map(edge => `${edge.source} -> ${edge.target} [${edge.value}]`);
            console.log(`Node ${id}:`, node);
            console.log('Edges:', formattedEdges.join(', '));
        }
    }
}
