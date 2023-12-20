export default class ForceDirectedGraph {

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
        this.animationStopTimeout = null
        this.repulsionForce = 80; // Сила отталкивания
        this.attractionForce = 0.1; // Сила притяжения


        this.windowCenter = {
            x: this.WIDTH / 2,
            y: this.HEIGHT / 2
        }

        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoomDelta = 1;
        this.startX = 0;
        this.startY = 0;

        this.draggingNode = null;
        this.nodeRadius = 10

        this.initializeMouseEvents();
    }

    initializeMouseEvents() {
        this.canvas.addEventListener('wheel', (event) => this.handleZoom(event));
        this.canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        this.canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
    }

    stopAnimatingGraph() {
        // Установка задержки и остановка анимации
        this.animationStopTimeout = setTimeout(() => {
            this.stopAnimationFrame();
        }, 3500);
    }

    // запускает раскладку графа
    graphInit() {
        this.initGraphStructure()
        this.startAnimatingGraph()
        this.stopAnimatingGraph()
    }
    initGraphStructure() {
        // центр канваса
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
    }
    updateNodePositions() {
        for (let [node, position] of this.nodePositions) {
            let forceX = 0, forceY = 0;

            // // Рассчитываем силу отталкивания от других узлов
            // for (let [otherNode, otherPosition] of this.nodePositions) {
            //     if (node !== otherNode) {
            //         let dx = position.x - otherPosition.x;
            //         let dy = position.y - otherPosition.y;
            //         let distance = Math.sqrt(dx * dx + dy * dy);
            //         if (distance > 0) {
            //             let repulsion = this.repulsionForce / distance;
            //             forceX += repulsion * dx / distance;
            //             forceY += repulsion * dy / distance;
            //         }
            //     }
            // }

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

    startAnimatingGraph() {
        this.animationFrameRequest = true;
        const animate = () => {
            if (!this.animationFrameRequest) return;
            console.log('animation')
            this.updateNodePositions(); // Обновляем позиции узлов
            this.drawGraph(); // Перерисовываем граф
            requestAnimationFrame(animate);
        };
        animate();
    }

    stopAnimationFrame() {
        if (this.animationFrameRequest) {
            cancelAnimationFrame(this.animationFrameRequest);
            this.animationFrameRequest = null;
        }
    }

    drawGraph() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.windowCenter.x, this.windowCenter.y);
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
        for (let [node, position] of this.nodePositions) {
            this.ctx.fillStyle = 'red';
            this.ctx.beginPath();
            this.ctx.arc(position.x, position.y, this.nodeRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.fillStyle = 'blue';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node,position.x, position.y);
        }

        this.ctx.restore(); // очень важен!! при setTransform
    }

    draw() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.windowCenter.x, this.windowCenter.y);
        this.ctx.translate(this.offsetX, this.offsetY)

        this.drawGraph()
        this.zoomDelta = 1;
        this.ctx.restore();
    }


    handleMouseDown(event) {
        const mousePosX = parseInt(((event.clientX - this.canvas.offsetLeft) - this.windowCenter.x)/this.scale)+(-this.offsetX);
        const mousePosY = parseInt(((event.clientY - this.canvas.offsetTop) - this.windowCenter.y)/this.scale)+ (-this.offsetY);

        for (let [node, position] of this.nodePositions) {
            if (mousePosX > position.x-(this.nodeRadius/2) && mousePosX < position.x+(this.nodeRadius/2) ) { // Предполагается, что размер узла около 10x10 пикселей
                this.draggingNode = node;
                this.startAnimatingGraph()
                break;
            } else {
                this.draggingNode = null
            }
        }

        this.startX = event.clientX;
        this.startY = event.clientY;
    }

    handleMouseMove(event) {
        const mousePosX = parseInt(((event.clientX - this.canvas.offsetLeft) - this.windowCenter.x)/this.scale)+(-this.offsetX);
        const mousePosY = parseInt(((event.clientY - this.canvas.offsetTop) - this.windowCenter.y)/this.scale)+ (-this.offsetY);

        if (this.draggingNode) {
            clearTimeout(this.animationStopTimeout);
            const position = this.nodePositions.get(this.draggingNode);
            position.x = mousePosX;
            position.y = mousePosY;
        }
    }

    handleMouseUp() {
        if (this.draggingNode) {
            this.stopAnimatingGraph()
        }
        this.draggingNode = null;
    }


    handleZoom(event) {
        const wheelDelta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
        this.zoom(wheelDelta)
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

}