import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { EmotesApp } from '../models/emotes-app';
import { EventsService } from '../../core/services/events.service';
import { EmoteSprite } from '../models/emote-sprite';
import { SettingsService } from '../../shared/services/settings.service';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss']
})
export class WidgetComponent implements OnInit {
  @ViewChild('canvas', { static: true })
  private canvas!: ElementRef<HTMLElement>;

  private app!: EmotesApp;

  constructor(
    private events: EventsService,
    private settings: SettingsService,
  ) { }

  ngOnInit() {
    const { innerHeight, innerWidth } = window;
    this.app = new EmotesApp(innerHeight, innerWidth, this.settings);
    this.canvas.nativeElement.appendChild(this.app.view as any);

    // on emote received
    this.events.on<{ url: string }>('emotes-fall:emote-added')
      .subscribe(async ({ url }) => {
        const sprite = await EmoteSprite.fromUrl(url);
        this.app.addEmoteSprite(sprite, Math.random());
      })

    // on flush event
    this.events.on('emotes-fall:flush')
      .subscribe(() => this.app.flush());
  }
}
