import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject, fromEvent, map } from 'rxjs';

@Injectable({
	providedIn: "root",
})
export class WebSocketService {
	private channel: Subject<string> = new Subject();
	private socket?: WebSocket;

	private domain?: string;
	private port?: number;

	private _isConnected$ = new BehaviorSubject<boolean>(false);
	public get isConnected$(): Observable<boolean> {
		return this._isConnected$.asObservable();
	}

	private async getWsPort(): Promise<number> {
		// call "/___tauri/ws_port" GET endpoint to get the websocket port
		const port = window.location.href.split('/')[2].split(':')[1];
		const url = new URL('/___tauri/ws_port', `http://${this.domain}:${port}`);

		const response = await fetch(url.toString());
		const data = await response.text();

		return +data;
	}

	public connected(): boolean {
		return this.socket?.readyState === WebSocket.OPEN;
	}

	constructor() {
		this.init();
	}

	private async init() {
		this.domain = window.location.href.split('/')[2].split(':')[0].replace('localhost', '127.0.0.1');
		this.port = await this.getWsPort();

		this.socket = new WebSocket(`ws://${this.domain}:${this.port}/ws`);

		// this.socket.onmessage to Observable
		fromEvent<MessageEvent>(this.socket, 'message')
			.pipe(
				// tap(event => console.log(event.data)),
				map(message => message.data as string),
			)
			.subscribe(message => this.channel.next(message));

		// send a message to the server
		this.opened().then(() => {
			console.log('CONNECTED');
			this._isConnected$.next(true);
		})

		// if connection is closed, try to reconnect
		fromEvent<CloseEvent>(this.socket, 'close')
			.subscribe(async event => {
				console.log('CLOSED');
				this._isConnected$.next(false);

				await new Promise<void>(res => setTimeout(res, 2000));

				// while this.init() throws an error, keep trying
				while (true) {
					try {
						console.log('RECONNECTING');
						await this.init();
						break;
					} catch (e) {
						console.log('RECONNECT FAILED');
						await new Promise<void>(res => setTimeout(res, 2000));
					}
				}
			});
	}

	async opened(): Promise<void> {
		// wait for the socket to be initialized
		await new Promise<void>(async res => {
			while (!this.socket) { await new Promise<void>(r => setTimeout(r, 100)); }
			res();
		});

		// wait for the socket to be opened
		await new Promise<void>(res => {
			if (this.socket!.readyState === WebSocket.OPEN) return res();
			this.socket!.onopen = () => res();
		});
	}

	async postMessage(message: string) {
		await this.opened();
		this.socket!.send(message);
	}

	onMessage(): Observable<string> {
		// create a new Observable that pipes the messages from this.channel
		// and returns the message data
		return this.channel.asObservable();
	}
}