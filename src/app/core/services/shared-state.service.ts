// a service that uses the WebSocketService to synchronize a common state between all clients
import { Injectable } from '@angular/core';
import { WebSocketService } from './websocket.service';
import { BehaviorSubject, Observable, debounceTime, filter, map, tap } from 'rxjs';

@Injectable({
	providedIn: "root",
})
export class SharedStateService {
	private elements: { [key: string]: BehaviorSubject<any> } = {};

	private get state(): any {
		const state: any = {};
		for (const key in this.elements) {
			state[key] = this.elements[key].value;
		}
		return state;
	}

	constructor(private ws: WebSocketService) {
		ws.isConnected$
			.pipe(
				filter(connected => connected),
				debounceTime(10),
				tap(() => console.log('REFRESHING STATE')),
			)
			.subscribe(() => this.getCurrentState());

		ws.onMessage()
			.pipe(
				map(msg => { try { return JSON.parse(msg) } catch (e) { return msg } }),
				filter(data => data?.type === 'state_update'),
				map(data => data?.state),
				debounceTime(10),
				tap(state => {
					for (const key in state) {
						this.set(key, state[key]);
					}

					// if key is not in state, set it to null
					for (const key in this.elements) {
						if (state[key] !== undefined) return;

						this.set(key, null);
					}
				}),
			)
			.subscribe();
	}

	private checkOrCreate(key: string): void {
		if (this.elements[key] === undefined) {
			this.elements[key] = new BehaviorSubject<any>(null);
		}
	}

	public get<T>(key: string): Observable<T> {
		this.checkOrCreate(key);
		return this.elements[key].asObservable();
	}

	public set<T>(key: string, value: T): void {
		this.checkOrCreate(key);

		if (JSON.stringify(this.elements[key].value) === JSON.stringify(value)) return;

		this.elements[key].next(value);
		this.broadcastState();
	}

	private getCurrentState() {
		this.ws.postMessage(JSON.stringify({ type: 'get_state' }));
	}

	private broadcastState() {
		this.ws.postMessage(JSON.stringify({ type: 'state_update', state: this.state }));
	}
}