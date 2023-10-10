import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { HelixUser } from '@twurple/api';
import { extractColors } from 'extract-colors'

import { EmotesFallService } from '../../services/emotes-fall.service';
import { TwitchChatService } from '../../services/twitch/twitch-chat.service';
import { TwitchApiService } from '../../services/twitch/twitch-api.service';
import { TwitchEmotesService } from '../../services/twitch/twitch-emotes.service';
import { StorageService } from '../../../core/services/storage.service';
import { Toggler } from '../../../shared/models/toggler';
import i18n from '../../../../i18n/fr_FR.json';

import * as packageJson from '../../../../../package.json';

const preloadImage = async (url: string) => new Promise<void>(res => {
  const img = new Image();
  img.src = url;
  img.onload = () => res();
})

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  private packageJson = packageJson;
  public get version() {
    return this.packageJson.version;
  }

  public channelForm = new FormGroup({
    channel: new FormControl('',
      [
        Validators.required,
        () => this.channel !== null ? null : { invalidTwitchUser: true },
        (control: AbstractControl<string>) => control.value.toLowerCase() === this.channel?.name ? null : { twitchUserNotLoaded: true },
      ],
    ),
  })

  public launchLabel = this.getRandomButtonLabel();

  public get channelControl() { return this.channelForm.controls.channel; }

  public channel?: HelixUser | null;
  public channelEmotes: string[] = [];
  private channelPalette = {
    accent: '#FFF',
    secondary: '#000',
  }

  public opened = new Toggler(['settings', 'link']);

  constructor(
    public emotesFall: EmotesFallService,
    private twitchApi: TwitchApiService,
    private emotes: TwitchEmotesService,
    private storage: StorageService,
    public chat: TwitchChatService,
  ) {
    this.emotesFall.start();

    this.channelForm.controls.channel.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounceTime(250),
      )
      .subscribe(c => this.loadChannel(c));

    this.chat.connected$.subscribe(async connected => {
      if (connected) {
        this.applyPalette();
        this.channelEmotes = (await this.emotes.getChannelEmotesUrls(this.channel!.name));
      } else {
        this.resetPalette();
        this.channelEmotes = [];
        this.launchLabel = this.getRandomButtonLabel();
      }
    });

    const savedChannel = this.storage.get<string>('channel');
    if (!savedChannel || typeof savedChannel !== 'string') return;

    this.channelControl.setValue(this.storage.get<string>('channel'), { emitEvent: true });
  }

  private async loadChannel(channel: string | null) {
    if (!channel) {
      this.channel = undefined;
      this.storage.set<string>('channel', undefined);
      this.channelForm.controls.channel.updateValueAndValidity();
      return;
    }

    const foundChannel = await this.twitchApi.getUserByName(channel);
    if (foundChannel?.name !== this.channelControl.value!.toLowerCase()) return; // user was still typing

    this.channel = foundChannel;
    this.channelForm.controls.channel.updateValueAndValidity();

    if (!this.channel) return;
    this.channelControl.setValue(this.channel?.displayName!, { emitEvent: false })
    this.storage.set<string>('channel', this.channel?.displayName!);

    // unfocus the input
    // const input = document.getElementById('channel-input') as HTMLInputElement;
    // input.blur();

    // get the accent color from the profile picture
    const colors = (await extractColors(this.channel.profilePictureUrl, {
      crossOrigin: 'anonymous',
      distance: 0.4,
      hueDistance: 0.3,
      lightnessDistance: 0.3,
    })).filter(c => c.intensity < 0.9); // Prevent tearing the eyes with too bright colors

    const [accentColor, ...endColors] = colors.sort((a, b) => b.lightness - a.lightness); // sort by lightness and get the brightest color as accent
    const secondaryColor = endColors[endColors.length - 1]; // get the darkest color as secondary

    if (accentColor.lightness > 0.5) {
      this.channelPalette = {
        accent: accentColor?.hex ?? '#FFF',
        secondary: secondaryColor?.hex ?? '#000',
      }
    } else {
      this.channelPalette = {
        accent: '#FFF',
        secondary: '#000',
      }
    }

    await preloadImage(this.channel.profilePictureUrl);
  }

  public getRandomButtonLabel() {
    const labels = (i18n as any).launchButton.filter((label: string) => label !== this.launchLabel);
    return labels[Math.floor(Math.random() * labels.length)];
  }

  public async onChannelSubmit() {
    const { channel } = this.channelForm.value;
    if (!channel) return;

    await this.chat.connectTo(channel);
    this.applyPalette();
  }

  public flush() {
    this.emotesFall.flush();
  }

  public async test() {
    const channelEmotes = await this.emotes.getChannelEmotesUrls(this.channel!.name, this.emotesFall.animated);
    this.emotesFall.sendEmotes(channelEmotes);
  }

  private applyPalette() {
    document.body.style.setProperty('--accent-color', this.channelPalette.accent);
    document.body.style.setProperty('--secondary-color', this.channelPalette.secondary);
  }

  private resetPalette() {
    document.body.style.removeProperty('--accent-color');
    document.body.style.removeProperty('--secondary-color');
  }
}
