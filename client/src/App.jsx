import React from 'react';
import './styles/app.scss';
import Toolbar from './components/Toolbar';
import SettingBar from './components/SettingBar';
import Canvas from './components/Canvas';
// Заменили Switch на Routes, а Redirect на Navigate
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const App = () => {
	// Генерируем случайный ID для редиректа
	const defaultId = `f${(+new Date()).toString(16)}`;

	return (
		<BrowserRouter>
			<div className="app">
				<Routes>
					{/* В v6 компоненты обязательно передаются в проп element */}
					<Route
						path="/:id"
						element={
							<>
								<Toolbar />
								<SettingBar />
								<Canvas />
							</>
						}
					/>
					{/* Вместо Redirect используем Navigate с пропом replace */}
					<Route
						path="*"
						element={<Navigate to={`/${defaultId}`} replace />}
					/>
				</Routes>
			</div>
		</BrowserRouter>
	);
};

export default App;
