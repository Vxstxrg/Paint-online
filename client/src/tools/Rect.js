import Tool from './Tool'

export default class Rect extends Tool {
	constructor(canvas, socket, id) {
		super(canvas, socket, id);
		this.listen();
		this.savedImg = new Image(); // Создаем один объект картинки для переиспользования
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

		// Сохраняем снимок холста и сразу же загружаем его в объект картинки
		this.savedImg.src = this.canvas.toDataURL();
	}

	mouseMoveHandler(e) {
		if (this.mouseDown) {
			const rect = e.target.getBoundingClientRect();
			const currentX = e.clientX - rect.left;
			const currentY = e.clientY - rect.top;

			const width = currentX - this.startX;
			const height = currentY - this.startY;

			// Картинка гарантированно загрузится к первому движению мыши, 
			// поэтому рисуем превью синхронно, без onload
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.ctx.drawImage(this.savedImg, 0, 0, this.canvas.width, this.canvas.height);

			// Рисуем рамку поверх старого изображения локально
			Rect.draw(this.ctx, this.startX, this.startY, width, height, this.fillColor, this.strokeColor, this.lineWidth);
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

			// Отправляем финальные параметры и ВСЕ стили на сервер
			this.socket.send(JSON.stringify({
				method: "draw",
				id: this.id,
				figure: {
					type: "rect",
					x: this.startX,
					y: this.startY,
					w: width,
					h: height,
					fillColor: this.fillColor,
					strokeColor: this.strokeColor,
					lineWidth: this.lineWidth
				}
			}));
		}
	}

	// Статический метод принимает контекст, координаты, размеры и все настройки стилей
	static draw(ctx, x, y, w, h, fillColor, strokeColor, lineWidth) {
		ctx.save(); // Сохраняем глобальный контекст холста

		ctx.fillStyle = fillColor;
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = lineWidth;

		ctx.beginPath();
		ctx.rect(x, y, w, h);

		ctx.stroke();
		ctx.fill(); // Раскомментируйте, если прямоугольники должны быть закрашенными

		ctx.restore(); // Восстанавливаем контекст, чтобы стили не протекали на другие инструменты
	}
};
