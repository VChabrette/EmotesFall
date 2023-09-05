import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EmotesFallService } from '../../services/emotes-fall.service';
import { TwitchChatService } from '../../services/twitch/twitch-chat.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  public channelForm = new FormGroup({
    channel: new FormControl('', Validators.required),
  })

  constructor(
    private emotesFall: EmotesFallService,
    private chat: TwitchChatService,
  ) {
    this.emotesFall.start();
  }

  public onChannelSubmit() {
    const { channel } = this.channelForm.value;
    if (!channel) return;

    this.chat.connectTo(channel);
  }
}
