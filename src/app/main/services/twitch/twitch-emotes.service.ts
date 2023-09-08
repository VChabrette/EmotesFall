import { Injectable } from '@angular/core';

import { HelixEmoteScale } from '@twurple/api';

import { EmotesService } from '../models/emotes-service.interface';
import { TwitchApiService } from './twitch-api.service';

const imageExists = (url: string) => {
  return new Promise((resolve) => {
    var img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

@Injectable({
  providedIn: 'root'
})
export class TwitchEmotesService implements EmotesService {
  private urlExistsCache = new Map<string, boolean>();

  constructor(private api: TwitchApiService) { }

  private async urlExists(url: string) {
    if (this.urlExistsCache.has(url)) return this.urlExistsCache.get(url);

    const exists = !!await imageExists(url);
    this.urlExistsCache.set(url, exists);
    return exists;
  };

  public async getChannelEmotes(channelName: string, animated = true): Promise<Array<string>> {
    const user = await this.api.getUserByName(channelName);
    if (!user) {
      throw new Error(`Could not find user ${channelName}`);
    }

    const emotes = await this.api.getChannelEmotes(user);
    return emotes.map(emote => {
      const url = emote.getAnimatedImageUrl('3.0');
      return url && animated ? url : emote.getStaticImageUrl('3.0') as string
    });
  }

  public async getEmoteStaticUrl(emoteId: string, scale: HelixEmoteScale): Promise<string | null> {
    const url = this.getEmoteUrl(emoteId, 'static', scale);
    return (await this.urlExists(url)) ? url : null;
  }

  public async getEmoteAnimatedUrl(emoteId: string, scale: HelixEmoteScale): Promise<string | null> {
    const url = this.getEmoteUrl(emoteId, 'animated', scale);
    return (await this.urlExists(url)) ? url : null;
  };

  public getEmoteUrl(emoteId: string, format: 'static' | 'animated', scale: HelixEmoteScale): string {
    return `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/${format}/dark/${scale}`;
  }
}