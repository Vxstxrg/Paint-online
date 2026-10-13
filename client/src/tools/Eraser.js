import Tool from './Tool';

export default class Eraser extends Tool {
	constructor(canvas, socket, id) {
		super(canvas, socket, id);
		this.listen();
	}

	listen() {
		this.canvas.onmousemove = this.mouseMoveHandler.bind(this);
		this.canvas.onmousedown = this.mouseDownHandler.bind(this);
		this.canvas.onmouseup = this.mouseUpHandler.bind(this);
	}

	mouseUpHandler(e) {
		this.mouseDown = false;
	}

	mouseDownHandler(e) {
		this.mouseDown = true;

		// Сначала отправляем всем команду завершить/начать новый путь
		this.socket.send(JSON.stringify({
			method: "draw",
			id: this.id,
			figure: {
				type: "finish"
			}
		}));

		const rect = this.canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// Отправляем начальную точку стирания вместе с текущей толщиной ластика
		this.socket.send(JSON.stringify({
			method: "draw",
			id: this.id,
			figure: {
				type: "eraser",
				x: x,
				y: y,
				lineWidth: this.lineWidth // Берем текущую толщину из геттера Tool
			}
		}));
	}

	mouseMoveHandler(e) {
		if (this.mouseDown) {
			const rect = this.canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			// Отправляем текущую точку стирания и толщину на сервер
			this.socket.send(JSON.stringify({
				method: "draw",
				id: this.id,
				figure: {
					type: "eraser",
					x: x,
					y: y,
					lineWidth: this.lineWidth // Передаем толщину при каждом движении
				}
			}));
		}
	}

	// Статический метод теперь принимает контекст, координаты и толщину ластика
	static draw(ctx, x, y, lineWidth) {
		ctx.save();

		// Настраиваем параметры стирания индивидуально для этого пакета данных
		ctx.lineWidth = lineWidth;
		ctx.globalCompositeOperation = 'destination-out';

		ctx.lineTo(x, y);
		ctx.stroke();

		ctx.restore();
	}
}
