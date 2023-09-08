import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { EmotesFallService } from '../../services/emotes-fall.service';
import { TwitchChatService } from '../../services/twitch/twitch-chat.service';
import { TwitchApiService } from '../../services/twitch/twitch-api.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { HelixUser } from '@twurple/api';
import { prominent } from 'color.js';

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
  public channelForm = new FormGroup({
    channel: new FormControl('',
      [
        Validators.required,
        () => this.channel !== null ? null : { invalidTwitchUser: true },
        (control: AbstractControl<string>) => control.value.toLowerCase() === this.channel?.name ? null : { twitchUserNotLoaded: true },
      ],
    ),
  })

  public get channelControl() { return this.channelForm.controls.channel; }

  public channel?: HelixUser | null;

  constructor(
    public emotesFall: EmotesFallService,
    private twitchApi: TwitchApiService,
    public chat: TwitchChatService,
  ) {
    this.emotesFall.start();

    this.channelForm.controls.channel.valueChanges
      .pipe(
        distinctUntilChanged(),
        // 
        debounceTime(500),
      )
      .subscribe(async (channel) => {
        if (!channel) {
          this.channel = undefined;
          this.channelForm.controls.channel.updateValueAndValidity();
          document.body.style.removeProperty('--accent-color');
          document.body.style.removeProperty('--secondary-color');
          return;
        }

        const foundChannel = await this.twitchApi.getUserByName(channel);
        if (foundChannel?.name !== this.channelControl.value!.toLowerCase()) return; // user was still typing

        this.channel = foundChannel;
        this.channelForm.controls.channel.updateValueAndValidity();

        if (!this.channel) return;
        this.channelControl.setValue(this.channel?.displayName!, { emitEvent: false })

        // unfocus the input
        // const input = document.getElementById('channel-input') as HTMLInputElement;
        // input.blur();

        let [secondaryColor, accentColor] = await prominent(this.channel.profilePictureUrl, { amount: 2, format: 'hex', group: 50 }) as string[];

        // accentuate the contrast between the accent color and the secondary color
        if (accentColor && secondaryColor) {
          const accentColorLuminance = parseInt(accentColor.slice(1), 16);
          const secondaryColorLuminance = parseInt(secondaryColor.slice(1), 16);

          console.log(accentColorLuminance, secondaryColorLuminance);

          if (accentColorLuminance < secondaryColorLuminance) {
            const temp = accentColor;
            accentColor = secondaryColor;
            secondaryColor = temp;
          }

          // const accentColorLuminanceDiff = secondaryColorLuminance - accentColorLuminance;
          // if (accentColorLuminanceDiff < 100) {
          //   // accentColor = '#' + (accentColorLuminance + 100).toString(16);
          //   // increment each color by 100 (accentColor is an hex string where each 2 chars represent a color)
          //   const { r, g, b } = {
          //     r: parseInt(accentColor.slice(1, 3), 16),
          //     g: parseInt(accentColor.slice(3, 5), 16),
          //     b: parseInt(accentColor.slice(5, 7), 16),
          //   };
          //   accentColor = '#' + [r, g, b].map(c => Math.min(c + 100, 255).toString(16).padStart(2, '0')).join('');

          // }
        }

        document.body.style.setProperty('--accent-color', accentColor as string);
        document.body.style.setProperty('--secondary-color', secondaryColor as string);

        await preloadImage(this.channel.profilePictureUrl);
      });
  }

  public onChannelSubmit() {
    const { channel } = this.channelForm.value;
    if (!channel) return;

    this.chat.connectTo(channel);
  }

  public flush() {
    this.emotesFall.flush();
  }
}
