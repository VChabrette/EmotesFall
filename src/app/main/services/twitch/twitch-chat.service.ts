import { Injectable } from '@angular/core';
import { ChatClient, ChatMessage, ChatRaidInfo } from '@twurple/chat';
import { Observable, Subject, merge } from 'rxjs';
import { ChatService } from '../models/chat-service.interface';

@Injectable({
  providedIn: 'root'
})
export class TwitchChatService implements ChatService {
  private client?: ChatClient;

  private messagesListener?: ReturnType<ChatClient['onMessage']>;
  private raidsListener?: ReturnType<ChatClient['onRaid']>;

  private messagesSubjects: Map<RegExp, Subject<ChatMessage>> = new Map();
  private raidSubject: Subject<{ raidUser: string, raidInfo: ChatRaidInfo }> = new Subject();

  private get connected(): boolean {
    if (!this.client) return false;
    return this.client.isConnected;
  }

  private async waitForConnection(): Promise<void> {
    if (!this.client) throw new Error('No client initialized')

    if (!this.client?.isConnected && !this.client?.isConnecting) this.client.connect();

    await new Promise<void>(async resolve => {
      if (this.connected) return;

      while (!this.connected) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      resolve();
    });
  }

  public async connectTo(username: string): Promise<void> {
    if (this.client) this.client.quit();

    this.client = new ChatClient({ channels: [username] });

    if (this.messagesListener) this.messagesListener.unbind();
    this.messagesListener = this.client.onMessage((_channel: string, _user: string, message: string, msg: ChatMessage) => {
      this.messagesSubjects.forEach((subject, pattern) => {
        if (pattern.test(message)) subject.next(msg);
      });
    });

    if (this.raidsListener) this.raidsListener.unbind();
    this.raidsListener = this.client.onRaid((_channel: string, raidUser: string, raidInfo: ChatRaidInfo) => {
      this.raidSubject.next({ raidUser, raidInfo });
    });

    await this.waitForConnection();

  }

  public onMessages(...patternsOrText: Array<string | RegExp>): Observable<ChatMessage> {
    const listeners = [];

    if (!patternsOrText.length) patternsOrText.push(/.*/);

    for (const pattern of patternsOrText) {
      const re = typeof pattern === 'string' ? new RegExp(`^${pattern}$`) : pattern;

      if (this.messagesSubjects.has(re)) listeners.push(this.messagesSubjects.get(re));
      else {
        const sub = new Subject<ChatMessage>();
        this.messagesSubjects.set(re, sub);
        listeners.push(sub);
      }
    }

    return merge(...listeners);
  }

  public onRaids(): Observable<{ raidUser: string, raidInfo: ChatRaidInfo }> {
    return this.raidSubject.asObservable();
  }
}
