const express = require("express");
const app = express();
const WSServer = require("express-ws")(app);
const aWss = WSServer.getWss();
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5000;
const FILES_DIR = path.resolve(__dirname, 'files');

// Гарантируем, что папка для файлов существует
if (!fs.existsSync(FILES_DIR)) {
	fs.mkdirSync(FILES_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Ограничение на размер base64 картинок

// Вспомогательная функция для безопасной валидации ID файла
const getSafeFilePath = (id) => {
	if (!id || typeof id !== 'string') return null;
	const safeId = path.basename(id); // Защита от Path Traversal (убирает ../)
	return path.join(FILES_DIR, `${safeId}.jpg`);
};

// Хендлеры (объявлены ДО использования)
const broadcastConnection = (ws, msg) => {
	aWss.clients.forEach(client => {
		if (client.id === msg.id) {
			client.send(JSON.stringify(msg));
		}
	});
};

const connectionHandler = (ws, msg) => {
	ws.id = msg.id;
	broadcastConnection(ws, msg);
};

// Вебсокет-роут
app.ws('/', (ws, req) => {
	console.log("Клиент успешно подключился!");
	ws.send(JSON.stringify({ message: "Вы успешно подключились к серверу!" }));

	ws.on('message', (msg) => {
		try {
			const parseMsg = JSON.parse(msg);

			switch (parseMsg.method) {
				case "connection":
					connectionHandler(ws, parseMsg);
					break;
				case "undo":
				case "redo":
				case "snapshot":
				case "draw":
					broadcastConnection(ws, parseMsg);
					break;
			}
			console.log("Получено от клиента:", parseMsg);
		} catch (error) {
			console.error("Ошибка обработки WS сообщения:", error.message);
			// Отправляем ошибку обратно клиенту, а не просто делаем return
			ws.send(JSON.stringify({ success: false, error: "Некорректный формат JSON" }));
		}
	});
});

// Сохранение картинки
app.post('/image', (req, res) => {
	try {
		const filePath = getSafeFilePath(req.body.id);
		if (!filePath) {
			return res.status(400).json({ success: false, error: 'Неверный ID' });
		}

		const data = req.body.img.replace(/^data:image\/\w+;base64,/, "");
		fs.writeFileSync(filePath, data, 'base64');

		return res.status(200).json({ success: true, message: 'Изображение успешно сохранено на сервере' });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, error: error.message });
	}
});

// Получение картинки (ИСПРАВЛЕНО зависание)
app.get('/image', (req, res) => {
	try {
		const filePath = getSafeFilePath(req.query.id);
		if (!filePath || !fs.existsSync(filePath)) {
			return res.status(404).json({ success: false, error: 'Файл не найден' });
		}

		const file = fs.readFileSync(filePath);
		const data = `data:image/jpeg;base64,${file.toString('base64')}`;

		// Отправляем результат клиенту!
		return res.status(200).json({ success: true, img: data });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, error: error.message });
	}
});

// Запускаем сервер
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
