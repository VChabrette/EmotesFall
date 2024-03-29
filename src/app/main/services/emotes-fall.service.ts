import { Injectable } from '@angular/core';
import { EventsService } from '../../core/services/events.service';
import { TwitchChatService } from './twitch/twitch-chat.service';
import { ChatMessage, ParsedMessageEmotePart, parseChatMessage } from '@twurple/chat';
import { TwitchEmotesService } from './twitch/twitch-emotes.service';
import { SettingsService } from '../../shared/services/settings.service';
import { HelixChannelEmote } from '@twurple/api';

@Injectable({
  providedIn: 'root'
})
export class EmotesFallService {
  private started = false;

  public get animated() { return this.settings.animated }

  private ownEmotes: { [channel: string]: HelixChannelEmote[] } = {};

  constructor(
    private events: EventsService,
    private chat: TwitchChatService,
    private emotes: TwitchEmotesService,
    private settings: SettingsService,
  ) {
    this.initListeners();
  }

  public start() {
    this.started = true;
  };

  private async getOwnEmotes() {
    if (!this.ownEmotes[this.chat.username!]) {
      this.ownEmotes[this.chat.username!] = await this.emotes.getChannelEmotes(this.chat.username!);
    }

    return this.ownEmotes[this.chat.username!];
  }

  private initListeners() {
    // On received an emote, add it to the emotes-fall
    this.chat.onMessages().subscribe(async (message) => {
      if (!this.started) return;

      const emotesURLs = await this.parseEmotes(message);
      if (!emotesURLs.length) return;

      this.sendEmotes(emotesURLs);
    });

    // On raid, add emotes from the raid user to the emotes-fall
    this.chat.onRaids().subscribe(async ({ raidUser, raidInfo }) => {
      if (!this.started) return;

      if (!this.settings.reactToRaids) return;

      console.log(`${raidUser} raided with ${raidInfo.viewerCount} viewers!`);

      let emotes;
      // if onlyStreamerEmotes is true, only use the streamer emotes as raid emotes
      if (!this.settings.onlyStreamerEmotes) emotes = await this.emotes.getChannelEmotesUrls(raidUser);
      else emotes = this.emotes.getUrlsFromChannelEmotes(await this.getOwnEmotes());

      if (!emotes.length) return;

      emotes.sort(() => Math.random() - 0.5); // shuffle the emotes
      for (let i = 0; i < raidInfo.viewerCount; i++) {
        this.events.emit('emotes-fall:emote-added', { url: emotes[i % emotes.length] })
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });

    // On !flush command, flush the emotes-fall
    this.chat.onMessages('!flush').subscribe((message) => {
      if (!this.started) return;
      if (!message.userInfo.isBroadcaster) return;

      this.flush();
    });
  }

  public async sendEmotes(emotesURLs: string[]) {
    for (const url of emotesURLs) {
      this.events.emit('emotes-fall:emote-added', { url });
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }

  private async parseEmotes(msg: ChatMessage): Promise<string[]> {
    const msgParts = parseChatMessage(msg.text, msg.emoteOffsets);
    const emotes: ParsedMessageEmotePart[] = msgParts.filter(part => part.type === 'emote') as ParsedMessageEmotePart[];

    if (!emotes.length) return [];

    const emotesUrl: Array<string> = (await Promise.all(emotes.map(async emote => {
      if (this.settings.onlyStreamerEmotes) {
        const emotes = await this.getOwnEmotes();
        if (!emotes.find(e => e.name === emote.name)) return null;
      }

      let url = await this.emotes.getEmoteAnimatedUrl(emote.id, '3.0');
      if (!url || !this.animated) url = await this.emotes.getEmoteStaticUrl(emote.id, '3.0');

      return url;
    }))).filter(Boolean) as Array<string>

    return emotesUrl;
  }

  public flush() {
    this.events.emit('emotes-fall:flush', {});
  }
}
