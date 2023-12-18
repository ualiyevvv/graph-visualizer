
export default class Graph {
    constructor() {
        this.nodes = new Map();
    }

    addNode(node) {
        if (!this.nodes.has(node)) {
            this.nodes.set(node, new Set());
        }
    }

    addEdge(node1, node2) {
        if (!this.nodes.has(node1) || !this.nodes.has(node2)) {
            throw new Error("Both nodes must be added to the graph before adding an edge.");
        }
        this.nodes.get(node1).add(node2);
        this.nodes.get(node2).add(node1); // Remove this line if you want a directed graph
    }

    removeNode(node) {
        if (this.nodes.has(node)) {
            for (let neighbor of this.nodes.get(node)) {
                this.nodes.get(neighbor).delete(node);
            }
            this.nodes.delete(node);
        }
    }

    removeEdge(node1, node2) {
        if (this.nodes.has(node1) && this.nodes.has(node2)) {
            this.nodes.get(node1).delete(node2);
            this.nodes.get(node2).delete(node1); // Remove this line if you want a directed graph
        }
    }

    getNeighbors(node) {
        return this.nodes.has(node) ? Array.from(this.nodes.get(node)) : [];
    }

    hasNode(node) {
        return this.nodes.has(node);
    }

    hasEdge(node1, node2) {
        return this.nodes.has(node1) && this.nodes.get(node1).has(node2);
    }
}

// console.log(graph.getNeighbors('A')); // ['B']
// graph.removeEdge('A', 'B');
// console.log(graph.getNeighbors('A')); // []