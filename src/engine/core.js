export class CanvasMap {

    MIN_X = -1000;
    MIN_Y = -1000;
    MAX_X = 1000;
    MAX_Y = 1000;

    MIN_SCALE = 0.5;
    MAX_SCALE = 10;
    ZOOM_FACTOR = 1.1;

    constructor(canvas) {
        this.WIDTH = window.innerWidth
        this.HEIGHT = window.innerHeight

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

        this.canvas = canvas
        this.ctx = this.canvas.getContext('2d')
        this.canvas.width = this.WIDTH
        this.canvas.height = this.HEIGHT

        this.isDragging = false;
        this.isHovering = false;
        this.isDrawing = false;
        this.isInside = false;


        this.#getURLParams()
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

    render() {

    }
}

