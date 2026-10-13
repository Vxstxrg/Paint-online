import { makeAutoObservable } from "mobx";
import axios from 'axios';

class CanvasState {
	canvas = null;
	undoList = [];
	redoList = [];

	constructor() {
		makeAutoObservable(this);
	}



	setCanvas(canvas) {
		this.canvas = canvas;
	}

	pushToUndo(data) {
		this.undoList.push(data);
	}

	pushToRedo(data) {
		this.redoList.push(data);
	}
	sendSnapshot() {
		if (this.socket && this.sessionId && this.canvas) {
			this.redoList = [];
			this.socket.send(JSON.stringify({
				method: "snapshot",
				id: this.sessionId,
				dataUrl: this.canvas.toDataURL()
			}));
		}
	}

	sendUndo() {
		if (this.socket && this.sessionId) {
			this.socket.send(JSON.stringify({
				method: "undo",
				id: this.sessionId,
				username: this.username
			}));
		}
	}

	sendRedo() {
		if (this.socket && this.sessionId) {
			this.socket.send(JSON.stringify({
				method: "redo",
				id: this.sessionId,
				username: this.username
			}));
		}
	}

	//локальное undo и redo
	executeUndo(isInitiator) {
		let ctx = this.canvas.getContext('2d');
		if (this.undoList.length > 0) {
			let dataUrl = this.undoList.pop();
			this.redoList.push(this.canvas.toDataURL());
			this.drawSnapshot(dataUrl, ctx);
		}
		else {
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			if (isInitiator) {
				this.saveCurrentStateToServer();
			}
		}

	}

	executeRedo(isInitator) {
		let ctx = this.canvas.getContext('2d');
		if (this.redoList.length > 0) {
			let dataUrl = this.redoList.pop();
			this.undoList.push(this.canvas.toDataURL());
			this.drawSnapshot(dataUrl, ctx);
		}
	}

	drawSnapshot(dataUrl, ctx, isInitiator) {
		let img = new Image();
		img.src = dataUrl;
		img.onload = () => {
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

			if (isInitiator) {
				this.saveCurrentStateToServer();
			}
		}
	}

}

export default new CanvasState;