export default class ForceDirectedGraph {

    MIN_X = -1000;
    MIN_Y = -1000;
    MAX_X = 1000;
    MAX_Y = 1000;

    MIN_SCALE = 0.1;
    MAX_SCALE = 10;
    ZOOM_FACTOR = 1.1;

    constructor(graph, canvasId) {
        this.WIDTH = window.innerWidth
        this.HEIGHT = window.innerHeight

        this.graph = graph;

        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.WIDTH
        this.canvas.height = this.HEIGHT

        this.nodePositions = new Map();

        this.animationFrameRequest = null;
        this.repulsionForce = 80; // Сила отталкивания
        this.attractionForce = 0.1; // Сила притяжения
        this.lastMoveTimestamp = 0; // Для throttling обработки событий мыши
        this.moveThrottleInterval = 20; // Интервал в миллисекундах


        this.windowCenter = {
            x: this.WIDTH / 2,
            y: this.HEIGHT / 2
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

    startAnimation() {
        // Анимационный цикл
        this.animationFrameRequest = true;

        const animate = () => {
            if (!this.animationFrameRequest) return;
            console.log('animation')
            this.updateNodePositions(); // Обновляем позиции узлов
            this.draw(); // Перерисовываем граф
            requestAnimationFrame(animate);
        };
        animate();

        // Установка задержки и остановка анимации
        // setTimeout(() => {
        //     this.stop();
        // }, 3500); // 5000 миллисекунд = 5 секунд
    }

    start() {
        // Инициализация начальных позиций узлов
        const centerX = 1;
        const centerY = 1;

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

        this.startAnimation()
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

    drawGraph() {
        // this.ctx.save();
        // this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

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

        this.ctx.fillStyle = 'red'
        this.ctx.fillRect(-25, -25, 50, 50)
        this.ctx.fillStyle = 'blue'
        this.ctx.fillRect(1000, 1000, 50, 50)
        this.ctx.fillRect(-1000, 1000, 50, 50)
        this.ctx.fillRect(-1000, -1000, 50, 50)
        this.ctx.fillRect(1000, -1000, 50, 50)

        // Рисуйте узлы
        for (let [node, position] of this.nodePositions) {
            this.ctx.fillStyle = 'red';
            this.ctx.beginPath();
            this.ctx.arc(position.x, position.y, 10, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.fillStyle = 'blue';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node,position.x, position.y);
        }


    }

    draw() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.windowCenter.x, this.windowCenter.y);
        this.ctx.translate(this.offsetX, this.offsetY)

        this.drawGraph()
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
        const mousePosX = parseInt(((event.clientX - this.canvas.offsetLeft) - this.windowCenter.x)/this.scale)+(-this.offsetX);
        const mousePosY = parseInt(((event.clientY - this.canvas.offsetTop) - this.windowCenter.y)/this.scale)+ (-this.offsetY);

        // console.log(this.graph)
        // console.log(this.nodePositions)

        for (let [node, position] of this.nodePositions) {
            const dx = mousePosX - position.x;
            const dy = mousePosY - position.y;

            // https://chat.openai.com/share/5c4462c8-4603-478c-b430-c43437c9faa4
            // if (distance <= radius) { // Предположим, что радиус узла - это radius
            //     this.draggingNode = node;
            //     break;
            // }
            if (dx * dx + dy * dy < 100) { // Предполагается, что размер узла около 10x10 пикселей
                this.draggingNode = node;
                console.log(node)
                break;
            }
        }

        this.isDragging = true;
        // this.stop();
        this.startX = event.clientX;
        this.startY = event.clientY;
        console.log('x:', mousePosX, 'y:', mousePosY)
        // console.log('xTR:', transformedX, 'yTR:', transformedY)
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

            this.startAnimation()
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
        const mousePosX = parseInt(((event.clientX - this.canvas.offsetLeft) - this.windowCenter.x)/this.scale)+(-this.offsetX);
        const mousePosY = parseInt(((event.clientY - this.canvas.offsetTop) - this.windowCenter.y)/this.scale)+ (-this.offsetY);


        this.draggingNode = null;
        // if (this.isDragging)
        //     this.start();
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
        // this.stop();
        const wheelDelta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
        this.zoom(wheelDelta)
        // this.start();
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
            this.animationFrameRequest = null;
        }
    }

}