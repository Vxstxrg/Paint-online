export default class Tool {
	constructor(canvas, socket, id) {
		this.canvas = canvas;
		this.socket = socket;
		this.id = id
		this.ctx = canvas.getContext('2d');
		this.destroyEvents();
	}

	set fillColor(color) {
		this.ctx.fillStyle = color;
	}

	set strokeColor(color) {
		this.ctx.strokeStyle = color;
	}

	set lineWidth(width) {
		this.ctx.lineWidth = width;
	}

	// ДОБАВЬТЕ ГЕТТЕРЫ, чтобы читать текущие настройки из контекста
	get fillColor() {
		return this.ctx.fillStyle;
	}

	get strokeColor() {
		return this.ctx.strokeStyle;
	}

	get lineWidth() {
		return this.ctx.lineWidth;
	}

	destroyEvents() {
		this.canvas.onmousemove = null
		this.canvas.onmousedown = null
		this.canvas.onmouseup = null
	}
}
