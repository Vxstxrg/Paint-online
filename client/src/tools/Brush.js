import Tool from './Tool'

export default class Brush extends Tool {
	constructor(canvas, socket, id) {
		super(canvas, socket, id);
		this.listen();
	}

	listen() {
		this.canvas.onmousemove = this.mouseMoveHandler.bind(this)
		this.canvas.onmousedown = this.mouseDownHandler.bind(this)
		this.canvas.onmouseup = this.mouseUpHandler.bind(this)
	}

	mouseUpHandler(e) {
		this.mouseDown = false;
	}

	mouseDownHandler(e) {
		this.mouseDown = true;

		// Получаем точные координаты внутри canvas
		const rect = e.target.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// Сначала отправляем команду всем участникам начать новый путь
		this.socket.send(JSON.stringify({
			method: "draw",
			id: this.id,
			figure: {
				type: "finish" // Сигнал для вызова ctx.beginPath()
			}
		}));

		// Затем отправляем начальную точку линии вместе с цветом и толщиной
		this.socket.send(JSON.stringify({
			method: "draw",
			id: this.id,
			figure: {
				type: "brush",
				x: x,
				y: y,
				strokeColor: this.strokeColor, // Берем из геттера базового класса Tool
				lineWidth: this.lineWidth       // Берем из геттера базового класса Tool
			}
		}));
	}

	mouseMoveHandler(e) {
		if (this.mouseDown) {
			const rect = e.target.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			// Отправляем текущие координаты, цвет и толщину линии
			this.socket.send(JSON.stringify({
				method: "draw",
				id: this.id,
				figure: {
					type: "brush",
					x: x,
					y: y,
					strokeColor: this.strokeColor, // Синхронизируем цвет линии
					lineWidth: this.lineWidth       // Синхронизируем толщину линии
				}
			}));
		}
	}

	// Статический метод теперь принимает контекст, координаты, цвет и толщину
	// Статический метод теперь изолирует стили каждого пользователя
	static draw(ctx, x, y, strokeColor, lineWidth) {
		ctx.save(); // 1. Сохраняем текущие стили (цвета соседа)

		ctx.strokeStyle = strokeColor; // Применяем цвет того, кто сейчас рисует
		ctx.lineWidth = lineWidth;     // Применяем толщину того, кто сейчас рисует
		ctx.lineTo(x, y);
		ctx.stroke();

		ctx.restore(); // 2. Возвращаем стили обратно (сосед снова рисует своим цветом)
	}

};
