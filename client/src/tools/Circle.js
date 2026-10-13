import Tool from './Tool'

export default class Circle extends Tool {
	constructor(canvas, socket, id) {
		super(canvas, socket, id);
		this.listen();
		this.savedImg = new Image(); // Создаем один объект картинки для локального превью
	}

	listen() {
		this.canvas.onmousemove = this.mouseMoveHandler.bind(this)
		this.canvas.onmousedown = this.mouseDownHandler.bind(this)
		this.canvas.onmouseup = this.mouseUpHandler.bind(this)
	}

	mouseDownHandler(e) {
		this.mouseDown = true;
		const rect = e.target.getBoundingClientRect();

		this.startX = e.clientX - rect.left;
		this.startY = e.clientY - rect.top;

		// Снимок холста загружаем в картинку мгновенно при клике
		this.savedImg.src = this.canvas.toDataURL();
	}

	mouseMoveHandler(e) {
		if (this.mouseDown) {
			const rect = e.target.getBoundingClientRect();
			const currentX = e.clientX - rect.left;
			const currentY = e.clientY - rect.top;

			const width = currentX - this.startX;
			const height = currentY - this.startY;

			// Очищаем и перерисовываем холст синхронно (без мерцания)
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.ctx.drawImage(this.savedImg, 0, 0, this.canvas.width, this.canvas.height);

			// Отображаем превью круга локально, используя текущие стили
			Circle.draw(this.ctx, this.startX, this.startY, width, height, this.fillColor, this.strokeColor, this.lineWidth);
		}
	}

	mouseUpHandler(e) {
		if (this.mouseDown) {
			this.mouseDown = false;
			const rect = e.target.getBoundingClientRect();
			const currentX = e.clientX - rect.left;
			const currentY = e.clientY - rect.top;

			const width = currentX - this.startX;
			const height = currentY - this.startY;

			// Фигура готова — отправляем параметры и ВСЕ стили всем клиентам
			this.socket.send(JSON.stringify({
				method: "draw",
				id: this.id,
				figure: {
					type: "circle",
					x: this.startX,
					y: this.startY,
					w: width,
					h: height,
					fillColor: this.fillColor,     // Цвет заливки из Tool
					strokeColor: this.strokeColor, // Цвет обводки из Tool
					lineWidth: this.lineWidth       // Толщина контура из Tool
				}
			}));
		}
	}

	// Статический метод изолирует контекст и применяет персональные стили автора фигуры
	static draw(ctx, x, y, w, h, fillColor, strokeColor, lineWidth) {
		ctx.save(); // Сохраняем глобальные стили (чтобы не перекрасить соседа)

		ctx.fillStyle = fillColor;
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = lineWidth;

		ctx.beginPath();
		const radiusX = Math.abs(w / 2);
		const radiusY = Math.abs(h / 2);
		const centerX = x + w / 2;
		const centerY = y + h / 2;

		ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);

		ctx.fill();   // Заливаем цветом
		ctx.stroke(); // Обводим контур

		ctx.restore(); // Восстанавливаем оригинальные стили контекста
	}
};
