import * as d3 from "d3";

export class ForceDirectedGraph {

    MIN_X = -1000;
    MIN_Y = -1000;
    MAX_X = 1000;
    MAX_Y = 1000;

    MIN_SCALE = 0.1;
    MAX_SCALE = 10;
    ZOOM_FACTOR = 1.1;

    constructor(graph, canvas) {
        this.WIDTH = window.innerWidth
        this.HEIGHT = window.innerHeight

        this.graph = graph;

        // this.canvas = document.getElementById(canvasId);
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.WIDTH
        this.canvas.height = this.HEIGHT

        this.nodePositions = new Map();

        this.windowCenter = {
            x: this.WIDTH / 2,
            y: this.HEIGHT / 2
        }

        // Изначальное состояние canvas
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoomDelta = 1;
        this.startX = 0;
        this.startY = 0;

        this.isDraggingCanvas = false;
        this.draggingNode = null;
        this.hoveredEdge = null;

        this.arrowPosition = 0
        this.animationFrameId = null;

        this.nodeRadius = 40

        this.initializeMouseEvents();
    }

    initializeMouseEvents() {
        this.canvas.addEventListener('wheel', (event) => this.handleZoom(event));
        this.canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        this.canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
    }

    graphInit() {
        this.runForceLayout()
    }
    drawGraph() {
        // Отрисовка рёбер
        this.ctx.strokeStyle = "steelblue";
        this.ctx.lineWidth = 2;

        for (const edge of this.graph.edges) {
            this.ctx.beginPath();
            this.ctx.moveTo(edge.source.x, edge.source.y);
            this.ctx.lineTo(edge.target.x, edge.target.y);

            // Установка толщины линии на основе веса ребра
            this.ctx.lineWidth = this.getLineWidthBasedOnWeight(edge.weight);

            let colorLine = edge === this.hoveredEdge ? 'red' : 'black'
            this.ctx.strokeStyle = colorLine; // Изменение цвета при наведении
            this.ctx.stroke();

            !(edge === this.hoveredEdge) && this.drawArrow(edge.source, edge.target);
        }


        // Отрисовка узлов
        this.ctx.fillStyle = "steelblue";

        for (const node of this.graph.getAllNodes()) {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.nodeRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }

    }

    getLineWidthBasedOnWeight(weight) {
        const logWeight = Math.log(weight + 1)/this.scale;

        return Math.max(5, Math.min(80, logWeight));
    }

    animateArrowOnEdge() {
        // Проверка, что ребро для анимации стрелки выбрано
        if (!this.hoveredEdge) {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            return;
        }

        this.arrowPosition += 0.005; // Скорость движения стрелки
        if (this.arrowPosition > 1) {
            this.arrowPosition = 0;
        }

        this.draw();

        this.animationFrameId = requestAnimationFrame(() => this.animateArrowOnEdge());
    }

    draw() {
        // console.log("DRAW()")
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.windowCenter.x, this.windowCenter.y);
        this.ctx.translate(this.offsetX, this.offsetY)

        this.drawGraph()

        if (this.hoveredEdge) {
            this.drawArrow(this.hoveredEdge.source, this.hoveredEdge.target, 'grey', this.arrowPosition);
        }

        this.zoomDelta = 1;
        this.ctx.restore();
    }


    handleMouseDown(event) {
        const mousePosX = parseInt(((event.clientX - this.canvas.offsetLeft) - this.windowCenter.x)/this.scale)+(-this.offsetX);
        const mousePosY = parseInt(((event.clientY - this.canvas.offsetTop) - this.windowCenter.y)/this.scale)+ (-this.offsetY);


        this.draggingNode = this.forceSimulation.nodes().find(node =>
            Math.sqrt((node.x - mousePosX) ** 2 + (node.y - mousePosY) ** 2) < this.nodeRadius/this.scale
        );

        if (this.draggingNode) {
            this.forceSimulation.alphaTarget(0.3).restart();
        } else {
            this.isDraggingCanvas = true
        }

        this.startX = event.clientX;
        this.startY = event.clientY;

    }

    isCursorNearLine(x, y, a, b, weight) {
        const lineWidth = this.getLineWidthBasedOnWeight(weight) / this.scale;
        const offset = this.nodeRadius / this.scale;

        // Корректировка начала и конца линии на основе смещения
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const normX = dx / dist;
        const normY = dy / dist;

        const aOffset = { x: a.x + normX * offset, y: a.y + normY * offset };
        const bOffset = { x: b.x - normX * offset, y: b.y - normY * offset };

        // Расчет расстояния от курсора до скорректированной линии
        const distance = Math.abs((bOffset.y - aOffset.y) * x - (bOffset.x - aOffset.x) * y + bOffset.x * aOffset.y - bOffset.y * aOffset.x) /
            Math.sqrt((bOffset.y - aOffset.y) ** 2 + (bOffset.x - aOffset.x) ** 2);

        // Проверка нахождения точки между скорректированными началом и концом ребра
        const dotProduct = (x - aOffset.x) * (bOffset.x - aOffset.x) + (y - aOffset.y) * (bOffset.y - aOffset.y);
        const squaredLengthBA = (bOffset.x - aOffset.x) * (bOffset.x - aOffset.x) + (bOffset.y - aOffset.y) * (bOffset.y - aOffset.y);
        const param = dotProduct / squaredLengthBA;

        const proximityThreshold = ((lineWidth / 2) * this.scale) + 4;
        return distance < proximityThreshold && param >= 0 && param <= 1;
    }

    handleMouseMove(event) {
        const mousePosX = parseInt(((event.clientX - this.canvas.offsetLeft) - this.windowCenter.x)/this.scale)+(-this.offsetX);
        const mousePosY = parseInt(((event.clientY - this.canvas.offsetTop) - this.windowCenter.y)/this.scale)+ (-this.offsetY);


        this.hoveredEdge = null;
        this.graph.edges.forEach(edge => {
            if (this.isCursorNearLine(mousePosX, mousePosY, edge.source, edge.target, edge.weight)) {
                this.hoveredEdge = edge;
            }
        });
        // console.log(this.hoveredEdge)

        if (this.hoveredEdge && !this.animationFrameId) {
            this.animateArrowOnEdge();
        } else if (!this.hoveredEdge && this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            this.arrowPosition = 0;
            this.draw();
        }

        if (this.draggingNode) {
            // Обновляем позицию перетаскиваемого узла
            this.draggingNode.fx = mousePosX;
            this.draggingNode.fy = mousePosY;
        }
        else if (this.isDraggingCanvas) {
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

    drawArrow(source, target, color='grey', position = 0.5) {
        const offset = this.nodeRadius+30; // Смещение от начала и конца ребра
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const normX = dx / dist;
        const normY = dy / dist;

        // Новые координаты для начала и конца стрелки с учетом смещения
        const sourceOffsetX = source.x + offset * normX;
        const sourceOffsetY = source.y + offset * normY;
        const targetOffsetX = target.x - offset * normX;
        const targetOffsetY = target.y - offset * normY;

        color = color === 'black' ? 'grey' : color;
        const angle = Math.atan2(targetOffsetY - sourceOffsetY, targetOffsetX - sourceOffsetX);
        const headLength = 30; // размер головки стрелки
        const headAngle1 = angle - Math.PI / 7;
        const headAngle2 = angle + Math.PI / 7;

        // Рассчитываем новую позицию для стрелки
        const edgePoint = {
            x: sourceOffsetX + (targetOffsetX - sourceOffsetX) * position,
            y: sourceOffsetY + (targetOffsetY - sourceOffsetY) * position
        };

        // Координаты для крыльев стрелки
        const wing1 = {
            x: edgePoint.x - headLength * Math.cos(headAngle1),
            y: edgePoint.y - headLength * Math.sin(headAngle1)
        };
        const wing2 = {
            x: edgePoint.x - headLength * Math.cos(headAngle2),
            y: edgePoint.y - headLength * Math.sin(headAngle2)
        };

        // Рисуем стрелку
        this.ctx.beginPath();
        this.ctx.moveTo(edgePoint.x, edgePoint.y); // Вершина стрелки
        this.ctx.lineTo(wing1.x, wing1.y); // Первое крыло
        this.ctx.lineTo(wing2.x, wing2.y); // Второе крыло
        this.ctx.lineTo(edgePoint.x, edgePoint.y); // Обратно к вершине стрелки
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.closePath();
    }


    handleMouseUp() {
        if (this.draggingNode) {
            this.forceSimulation.alphaTarget(0);
            this.draggingNode.fx = null;
            this.draggingNode.fy = null;
        }
        this.draggingNode = null;
        this.isDraggingCanvas = false
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


    // Запуск силовой раскладки и обновление визуализации
    runForceLayout() {
        const simulation = d3.forceSimulation(this.graph.getAllNodes())
            .force("charge", d3.forceManyBody()
                .strength(-2000) // Увеличиваем силу отталкивания
                .distanceMax(500) // Максимальное расстояние воздействия
            )
            .force("link", d3.forceLink(this.graph.edges).distance(300))
            .force("center", d3.forceCenter(0, 0))
            .on("tick", () => this.draw());

        this.forceSimulation = simulation;
    }

}


