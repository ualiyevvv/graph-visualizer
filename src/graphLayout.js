export default class ForceDirectedGraph {
    constructor(graph, canvasId) {
        this.graph = graph;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodePositions = new Map();
        this.animationFrameRequest = null;
        this.repulsionForce = 80; // Сила отталкивания
        this.attractionForce = 0.1; // Сила притяжения
        this.lastMoveTimestamp = 0; // Для throttling обработки событий мыши
        this.moveThrottleInterval = 20; // Интервал в миллисекундах
        this.draggingNode = null;
        this.initializeMouseEvents();
    }


    start() {
        // Инициализация начальных позиций узлов
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) / 2;
        const nodesCount = this.graph.nodes.size;
        let angleIncrement = (2 * Math.PI) / nodesCount;

        let i = 0;
        for (let node of this.graph.nodes.keys()) {
            let angle = i * angleIncrement;
            this.nodePositions.set(node, {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
            i++;
        }

        // Анимационный цикл
        const animate = () => {
            this.updateNodePositions(); // Обновляем позиции узлов
            this.draw(); // Перерисовываем граф
            requestAnimationFrame(animate);
        };
        animate();
    }

    // initializeNodePositions() {
    //     const centerX = this.canvas.width / 2;
    //     const centerY = this.canvas.height / 2;
    //     const radius = Math.min(centerX, centerY) / 2;
    //     const nodesCount = this.graph.nodes.size;
    //     let angleIncrement = (2 * Math.PI) / nodesCount;
    //
    //     let i = 0;
    //     for (let node of this.graph.nodes.keys()) {
    //         let angle = i * angleIncrement;
    //         this.nodePositions.set(node, {
    //             x: centerX + radius * Math.cos(angle),
    //             y: centerY + radius * Math.sin(angle)
    //         });
    //         i++;
    //     }
    // }


    draw() {
        // Очистите холст
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Рисуйте ребра
        this.ctx.strokeStyle = 'black';
        for (let [node, neighbors] of this.graph.nodes) {
            neighbors.forEach(neighbor => {
                if (this.nodePositions.has(node) && this.nodePositions.has(neighbor)) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.nodePositions.get(node).x, this.nodePositions.get(node).y);
                    this.ctx.lineTo(this.nodePositions.get(neighbor).x, this.nodePositions.get(neighbor).y);
                    this.ctx.stroke();
                }
            });
        }

        // Рисуйте узлы
        this.ctx.fillStyle = 'red';
        for (let [node, position] of this.nodePositions) {
            this.ctx.beginPath();
            this.ctx.arc(position.x, position.y, 10, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    // Здесь должен быть код для обновления позиций узлов на основе силовой раскладки
    // Это может быть достаточно сложно для реализации в рамках данного примера
    // Пример: Простое отталкивание узлов друг от друга
    updateNodePositions() {
        for (let [node, position] of this.nodePositions) {
            let forceX = 0, forceY = 0;

            // Рассчитываем силу отталкивания от других узлов
            for (let [otherNode, otherPosition] of this.nodePositions) {
                if (node !== otherNode) {
                    let dx = position.x - otherPosition.x;
                    let dy = position.y - otherPosition.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > 0) {
                        let repulsion = this.repulsionForce / distance;
                        forceX += repulsion * dx / distance;
                        forceY += repulsion * dy / distance;
                    }
                }
            }

            // Рассчитываем силу притяжения к соседям
            for (let neighbor of this.graph.getNeighbors(node)) {
                if (this.nodePositions.has(neighbor)) {
                    let neighborPosition = this.nodePositions.get(neighbor);
                    let dx = neighborPosition.x - position.x;
                    let dy = neighborPosition.y - position.y;
                    forceX += this.attractionForce * dx;
                    forceY += this.attractionForce * dy;
                }
            }

            position.x += forceX;
            position.y += forceY;
        }
    }


    initializeMouseEvents() {
        this.canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        this.canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
    }

    handleMouseDown(event) {
        const { offsetX, offsetY } = event;
        for (let [node, position] of this.nodePositions) {
            const dx = offsetX - position.x;
            const dy = offsetY - position.y;
            if (dx * dx + dy * dy < 100) { // Предполагается, что размер узла около 10x10 пикселей
                this.draggingNode = node;
                break;
            }
        }

    }

    handleMouseMove(event) {
        // const now = Date.now();
        // if (now - this.lastMoveTimestamp > this.moveThrottleInterval && this.draggingNode) {
        //     this.lastMoveTimestamp = now;
        //     const position = this.nodePositions.get(this.draggingNode);
        //     position.x = event.offsetX;
        //     position.y = event.offsetY;
        // }
        if (this.draggingNode) {
            const position = this.nodePositions.get(this.draggingNode);
            position.x = event.offsetX;
            position.y = event.offsetY;
        }
    }

    handleMouseUp() {
        this.draggingNode = null;
    }

    stop() {
        if (this.animationFrameRequest) {
            cancelAnimationFrame(this.animationFrameRequest);
        }
    }

}