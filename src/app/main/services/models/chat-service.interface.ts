import { Injectable } from '@angular/core';
import { ChatMessage, ChatRaidInfo } from '@twurple/chat';
import { Observable } from 'rxjs';

export interface ChatService extends Injectable {
	connectTo(channel: string): void;
	onMessages(...patternsOrText: Array<string | RegExp>): Observable<ChatMessage>;
	onRaids(): Observable<{ raidUser: string, raidInfo: ChatRaidInfo }>;
}