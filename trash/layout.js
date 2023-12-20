import * as d3 from 'd3';

export class GraphVisualization {
    constructor(graph, canvas) {
        this.graph = graph;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;
        this.nodeRadius = 5;
    }

    // Инициализация визуализации
    init() {
        // Обработчики событий для взаимодействия с узлами (по желанию)
        this.canvas.addEventListener("mousemove", this.handleMouseMove);
        this.canvas.addEventListener("click", this.handleMouseClick);

        // Запустить силовую раскладку и обновление визуализации
        this.runForceLayout();
    }

    // Обработчик события при движении мыши по canvas (по желанию)
    handleMouseMove(event) {
        const mouseX = event.clientX - this.canvas.getBoundingClientRect().left;
        const mouseY = event.clientY - this.canvas.getBoundingClientRect().top;

        // Ваш код для обработки события при движении мыши
    }

    // Обработчик события при клике на canvas (по желанию)
    handleMouseClick(event) {
        const mouseX = event.clientX - this.canvas.getBoundingClientRect().left;
        const mouseY = event.clientY - this.canvas.getBoundingClientRect().top;

        // Ваш код для обработки события при клике
    }

    // Запуск силовой раскладки и обновление визуализации
    runForceLayout() {
        const simulation = d3.forceSimulation(this.graph.getAllNodes())
            .force("charge", d3.forceManyBody().strength(-200))
            .force("link", d3.forceLink(this.graph.edges).distance(100))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))
            .on("tick", () => this.update());

        this.forceSimulation = simulation;
    }

    // Обновление позиций узлов и рёбер на canvas
    update() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;

        // Очистить canvas
        ctx.clearRect(0, 0, width, height);

        // Отрисовка рёбер
        ctx.strokeStyle = "steelblue";
        ctx.lineWidth = 2;

        for (const edge of this.graph.edges) {
            ctx.beginPath();
            ctx.moveTo(edge.source.x, edge.source.y);
            ctx.lineTo(edge.target.x, edge.target.y);
            ctx.stroke();
        }

        // Отрисовка узлов
        ctx.fillStyle = "steelblue";

        for (const node of this.graph.getAllNodes()) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, this.nodeRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}