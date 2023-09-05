import { Injectable } from '@angular/core';

export interface EmotesService extends Injectable {
	getEmoteStaticUrl(emoteId: string, scale: string): Promise<string | null>;
	getEmoteAnimatedUrl(emoteId: string, scale: string): Promise<string | null>;
	getEmoteUrl(emoteId: string, format: 'static' | 'animated', scale: string): string;
}