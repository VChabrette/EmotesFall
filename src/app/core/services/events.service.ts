import { Injectable } from '@angular/core';
import { WebSocketService } from './websocket.service';
import { BehaviorSubject, filter, debounceTime, tap, map, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private listeners = new Map<string, Subject<any>>();

  constructor(private ws: WebSocketService) {
    ws.onMessage()
      .pipe(
        map(msg => { try { return JSON.parse(msg) } catch (e) { return msg } }),
        filter(data => data?.type === 'event'),
        filter(data => this.listeners.has(data?.event)),
        debounceTime(10),
        tap(({ event, data }) => this.listeners.get(event)!.next(data)),
      )
      .subscribe();
  }

  public on<T>(event: string): Observable<T> {
    if (!this.listeners.has(event)) this.listeners.set(event, new Subject<T>());
    return this.listeners.get(event)!.asObservable();
  }

  public emit(event: string, data: any) {
    this.ws.postMessage(JSON.stringify({ type: 'event', event, data }));
  }
}