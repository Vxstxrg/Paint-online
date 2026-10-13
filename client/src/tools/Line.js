import Tool from './Tool'

export default class Line extends Tool {
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

		// Сохраняем состояние холста в картинку сразу при клике (без onload в процессе движения)
		this.savedImg.src = this.canvas.toDataURL();
	}

	mouseMoveHandler(e) {
		if (this.mouseDown) {
			const rect = e.target.getBoundingClientRect();
			const currentX = e.clientX - rect.left;
			const currentY = e.clientY - rect.top;

			// Очищаем и перерисовываем старый холст синхронно и без задержек
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.ctx.drawImage(this.savedImg, 0, 0, this.canvas.width, this.canvas.height);

			// Отрисовываем превью линии локально с текущими стилями пользователя
			Line.draw(this.ctx, this.startX, this.startY, currentX, currentY, this.strokeColor, this.lineWidth);
		}
	}

	mouseUpHandler(e) {
		if (this.mouseDown) {
			this.mouseDown = false;
			const rect = e.target.getBoundingClientRect();
			const currentX = e.clientX - rect.left;
			const currentY = e.clientY - rect.top;

			// Финальная отправка координат и стилей линии на сервер
			this.socket.send(JSON.stringify({
				method: "draw",
				id: this.id,
				figure: {
					type: "line",
					startX: this.startX,
					startY: this.startY,
					endX: currentX,
					endY: currentY,
					strokeColor: this.strokeColor, // Передаем цвет линии из Tool
					lineWidth: this.lineWidth       // Передаем толщину линии из Tool
				}
			}));
		}
	}

	// Статический метод принимает контекст, координаты и индивидуальные стили автора
	static draw(ctx, startX, startY, endX, endY, strokeColor, lineWidth) {
		ctx.save(); // Сохраняем глобальные стили, чтобы не перетереть палитру соседа

		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = lineWidth;

		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();

		ctx.restore(); // Восстанавливаем оригинальные стили контекста
	}
};
