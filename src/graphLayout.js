export default class ForceDirectedGraph {

    MIN_X = -1000;
    MIN_Y = -1000;
    MAX_X = 1000;
    MAX_Y = 1000;

    MIN_SCALE = 0.5;
    MAX_SCALE = 10;
    ZOOM_FACTOR = 1.1;

    constructor(graph, canvasId) {
        // this.WIDTH = window.innerWidth
        // this.HEIGHT = window.innerHeight

        this.graph = graph;

        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        // this.canvas.width = this.WIDTH
        // this.canvas.height = this.HEIGHT

        this.nodePositions = new Map();

        this.animationFrameRequest = null;
        this.repulsionForce = 80; // Сила отталкивания
        this.attractionForce = 0.1; // Сила притяжения
        this.lastMoveTimestamp = 0; // Для throttling обработки событий мыши
        this.moveThrottleInterval = 20; // Интервал в миллисекундах


        this.windowCenter = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        }
        // Изначальные параметры зумирования
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        // this.lastZoomAction = null;
        this.zoomDelta = 1; // в чем отличие от zoom_factor? проверить потом вдруг лишняя перменная
        this.startX = 0;
        this.startY = 0;

        this.isDragging = false;
        this.draggingNode = null;

        this.#getURLParams()
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
        this.ctx.save();
        // Очистите холст
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // this.ctx.setTransform(this.scale, 0, 0, this.scale, this.windowCenter.x, this.windowCenter.y);
        // this.ctx.translate(this.offsetX, this.offsetY)


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


        // // Обновление URL с параметрами GET
        this.#updateURLParams();
        this.zoomDelta = 1;
        this.ctx.restore();
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
        this.canvas.addEventListener('wheel', (event) => this.handleZoom(event));
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

        this.isDragging = true;
        this.startX = event.clientX;
        this.startY = event.clientY;
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
        } else if (this.isDragging) {
            // Calculate the distance moved by the mouse
            // const dx = mousePosX - this.offsetX;
            // const dy = mousePosY - this.offsetY;
            const dx = (event.clientX - this.startX)/this.scale;
            const dy = (event.clientY - this.startY)/this.scale;

            this.offsetX += dx;
            this.offsetY += dy;

            if (this.offsetX < this.MIN_X) this.offsetX = this.MIN_X;
            if (this.offsetX > this.MAX_X) this.offsetX = this.MAX_X;
            if (this.offsetY < this.MIN_Y) this.offsetY = this.MIN_Y;
            if (this.offsetY > this.MAX_Y) this.offsetY = this.MAX_Y;

            this.startX = event.clientX;
            this.startY = event.clientY;

            this.draw();

        }
    }

    handleMouseUp() {
        this.draggingNode = null;
        this.isDragging = false
    }


    zoom(coefficient) {
        if (coefficient > 0) {
            this.zoomDelta = this.ZOOM_FACTOR;
            // this.lastZoomAction = 'zoomed in';
        } else {
            this.zoomDelta = 1 / this.ZOOM_FACTOR;
            // this.lastZoomAction = 'zoomed out';
        }

        this.scale *= this.zoomDelta;
        if (this.scale < this.MIN_SCALE) this.scale = this.MIN_SCALE;
        if (this.scale > this.MAX_SCALE) this.scale = this.MAX_SCALE;

        this.draw()
    }

    handleZoom(event) {
        const wheelDelta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
        this.zoom(wheelDelta)
    }

    // Обновление URL с параметрами GET
    #updateURLParams() {
        const params = new URLSearchParams(window.location.search);
        params.set('scale', this.scale.toFixed(1));
        params.set('offsetX', parseInt(this.offsetX));
        params.set('offsetY', parseInt(this.offsetY));
        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    }

    // Получение параметров из URL
    #getURLParams() {
        const params = new URLSearchParams(window.location.search);
        this.scale = parseFloat(params.get('scale')) || this.scale;
        this.offsetX = parseInt(params.get('offsetX')) || this.offsetX;
        this.offsetY = parseInt(params.get('offsetY')) || this.offsetY;
    }

    stop() {
        if (this.animationFrameRequest) {
            cancelAnimationFrame(this.animationFrameRequest);
        }
    }

}