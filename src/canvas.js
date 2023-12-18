export default class CanvasMap {

    MIN_X = -1000;
    MIN_Y = -1000;
    MAX_X = 1000;
    MAX_Y = 1000;

    MIN_SCALE = 0.5;
    MAX_SCALE = 10;
    ZOOM_FACTOR = 1.1;

    constructor(canvasId) {
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

        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d')
        this.canvas.width = this.WIDTH
        this.canvas.height = this.HEIGHT

        this.isDragging = false;
        this.isHovering = false;
        this.isInside = false;


        this.#getURLParams()
        this.initializeCanvasEvents()
    }

    initializeCanvasEvents() {
        this.canvas.addEventListener('wheel', (event) => this.handleZoom(event));
        this.canvas.addEventListener('mousedown', (event) => this.onMouseDown(event));
        this.canvas.addEventListener('mouseup', (event) => this.onMouseUp(event));
        this.canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));
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


    onMouseMove(event) {
        const mousePosX = parseInt(((event.clientX - canvas.offsetLeft) - this.windowCenter.x)/this.scale)+(-this.offsetX);
        const mousePosY = parseInt(((event.clientY - canvas.offsetTop) - this.windowCenter.y)/this.scale)+ (-this.offsetY);

        if (this.isDragging) {
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

        } else {

            // let isInside = this.isMouseInsideAnyPolygon(mousePosX, mousePosY);
            // // console.log('isInside', isInside)
            //
            // if (isInside) {
            //     this.canvas.style.cursor = 'pointer';
            //     // console.log('OBJ IS HOVERED')
            // } else {
            //     this.canvas.style.cursor = 'default';
            // }
        }
        // console.log('x:', mousePosX, 'y:', mousePosY)

    }

    // пкм в нажатом положении
    onMouseDown(event) {
        const mousePosX = parseInt(((event.clientX - canvas.offsetLeft) - this.windowCenter.x)/this.scale)+(-this.offsetX);
        const mousePosY = parseInt(((event.clientY - canvas.offsetTop) - this.windowCenter.y)/this.scale)+ (-this.offsetY);

        // if (this.isDrawing) {
        //     // this.drawingObject.push([(mousePosX + this.offsetX), (mousePosY + this.offsetY)]);
        //     // this.drawingObject.push([(mousePosX + (-this.offsetX))/this.scale, (mousePosY + (-this.offsetY)/this.scale)]);
        //     // this.drawingObject.push([(mousePosX + (-this.offsetX)/this.scale), (mousePosY + (-this.offsetY)/this.scale)]);
        //     this.drawingObject.geometry.push([(mousePosX), (mousePosY)]);
        //     console.log(this.drawingObject)
        //     // this.drawPolygon(this.drawingObject)
        //     // this.drawLive(this.drawingObject)
        //     this.draw();
        // }
        this.isDragging = true;

        this.startX = event.clientX;
        this.startY = event.clientY;

        // const mouseX = (event.clientX - canvas.offsetLeft) / scale;
        // const mouseY = (event.clientY - canvas.offsetTop) / scale;
        // selectedObject = getObjectAt(mouseX, mouseY);

        // if (selectedObject) {
        //     offsetX = mouseX - selectedObject.x;
        //     offsetY = mouseY - selectedObject.y;
        // }
    }

    // пкм отпустили
    onMouseUp(event) {
        const mousePosX = parseInt(((event.clientX - canvas.offsetLeft) - this.windowCenter.x)/this.scale)+(-this.offsetX);
        const mousePosY = parseInt(((event.clientY - canvas.offsetTop) - this.windowCenter.y)/this.scale)+ (-this.offsetY);

        this.isDragging = false
        console.log('x:', mousePosX, 'y:', mousePosY)
        // selectedObject = null;
    }


    draw() {
        this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        this.ctx.save();

        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.windowCenter.x, this.windowCenter.y);
        this.ctx.translate(this.offsetX, this.offsetY)

        // Обновление URL с параметрами GET
        this.#updateURLParams();
        this.zoomDelta = 1;

        this.ctx.restore();
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

    render() {

    }
}