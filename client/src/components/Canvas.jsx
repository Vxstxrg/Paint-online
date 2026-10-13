import React, { useEffect, useRef, useState } from 'react';
import '../styles/canvas.scss';
import { observer } from 'mobx-react-lite';
import canvasState from '../store/canvasState';
import toolState from '../store/toolState';

import Brush from '../tools/Brush';
import Rect from '../tools/Rect';
import Circle from '../tools/Circle';
import Eraser from '../tools/Eraser';
import Line from '../tools/Line';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Canvas = observer(() => {
	const canvasRef = useRef();
	const usernameRef = useRef();
	const [modal, setModal] = useState(true);
	const params = useParams();

	const saveCanvasStateOnServer = () => {
		axios.post(`http://localhost:5000/image`, {
			id: params.id,
			img: canvasRef.current.toDataURL()
		})
			.then(response => console.log("Состаяние сохранено на сервре:", response.data))
			.catch(err => console.error("Ошибка сохранения на сервере:", err))
	}

	// 1. Загрузка ранее сохраненного изображения при старте
	useEffect(() => {
		canvasState.setCanvas(canvasRef.current);

		axios.get(`http://localhost:5000/image?id=${params.id}`)
			.then(response => {
				// Проверяем, что сервер успешно вернул картинку
				if (response.data && response.data.img) {
					const img = new Image();
					img.src = response.data.img; // ИСПРАВЛЕНО: берем .img из JSON ответа

					// ИСПРАВЛЕНО: Ждем, пока картинка загрузится в память
					img.onload = () => {
						const ctx = canvasRef.current.getContext('2d');
						const width = canvasRef.current.width;
						const height = canvasRef.current.height;

						// ИСПРАВЛЕНО: убрали 'this'
						ctx.clearRect(0, 0, width, height);
						ctx.drawImage(img, 0, 0, width, height); // ИСПРАВЛЕНО: передаем img первым аргументом
						ctx.stroke();
					};
				}
			})
			.catch(err => console.log("Изображение еще не создано или ошибка сервера", err));
	}, [params.id]); ``

	// 2. Инициализация Вебсокета при вводе имени
	useEffect(() => {
		if (canvasState.username) {
			const socket = new WebSocket('ws://localhost:5000/');
			canvasState.setSocket(socket);
			canvasState.setSessionId(params.id);
			toolState.setTool(new Brush(canvasRef.current, socket, params.id));

			socket.onopen = () => {
				socket.send(JSON.stringify({
					method: `connection`,
					id: params.id,
					username: canvasState.username,
				}));
			};

			socket.onmessage = (event) => {
				let msg = JSON.parse(event.data);
				const isInitiator = msg.username === canvasState.username;
				switch (msg.method) {
					case "connection":
						console.log(`Пользователь ${msg.username} подключился`);
						break;
					case "draw":
						drawHandler(msg);
						break;
					case "snapshot":
						canvasState.pushToUndo(msg.dataUrl)
						break;
					case "undo":
						canvasState.executeUndo();
						break;
					case "redo":
						canvasState.executeRedo();
						break;
				}
			};

			return () => {
				socket.close();
			};
		}
	}, [canvasState.username, params.id]);

	// 3. Обработчик сетевого рисования
	const drawHandler = (msg) => {
		const figure = msg.figure;
		const ctx = canvasRef.current.getContext('2d');

		switch (figure.type) {
			case "brush":
				Brush.draw(ctx, figure.x, figure.y, figure.strokeColor, figure.lineWidth);
				break;
			case "rect":
				Rect.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillColor, figure.strokeColor, figure.lineWidth);
				ctx.beginPath();
				break;
			case "circle":
				Circle.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillColor, figure.strokeColor, figure.lineWidth);
				ctx.beginPath();
				break;
			case "eraser":
				Eraser.draw(ctx, figure.x, figure.y, figure.lineWidth);
				break;
			case "line":
				Line.draw(ctx, figure.startX, figure.startY, figure.endX, figure.endY, figure.strokeColor, figure.lineWidth);
				ctx.beginPath();
				break;
			case "finish":
				ctx.beginPath();
				saveCanvasStateOnServer();
				break;
		}
	};

	// ИСПРАВЛЕНО: Отправляем id внутри body, как требует сервер
	const mouseDownHandler = () => {
		canvasState.sendSnapshot();
	};

	const connectionHandler = () => {
		if (usernameRef.current.value.trim()) {
			canvasState.setUsername(usernameRef.current.value);
			setModal(false);
		}
	};

	return (
		<div className="canvas">
			<Modal show={modal} onHide={() => { }}>
				<Modal.Header>
					<Modal.Title>Введите ваше имя</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<input
						type="text"
						ref={usernameRef}
						onKeyDown={(e) => e.key === 'Enter' && connectionHandler()}
					/>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={connectionHandler}>
						Войти
					</Button>
				</Modal.Footer>
			</Modal>

			<canvas
				onMouseDown={mouseDownHandler}
				ref={canvasRef}
				width={600}
				height={400}
			/>
		</div>
	);
});

export default Canvas;
