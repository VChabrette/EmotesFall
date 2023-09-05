import { Component } from '@angular/core';
import { TwitchChatService } from './services/twitch/twitch-chat.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
  constructor(chat: TwitchChatService) {
    chat.connectTo('vchabrette');
  }
}
