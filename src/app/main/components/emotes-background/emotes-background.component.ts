import { Component, ElementRef, HostBinding, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-emotes-background',
  templateUrl: './emotes-background.component.html',
  styleUrls: ['./emotes-background.component.scss']
})
export class EmotesBackgroundComponent {
  private interval: NodeJS.Timeout | null = null;

  @Input() set emotes(emotes: string[]) {
    let i = 0;
    if (this.interval) clearInterval(this.interval);

    if (!emotes.length) return;
    this.interval = setInterval(() => {
      const emote = emotes[i % emotes.length];

      this.emotesImgs.push({
        url: emote,
        left: `calc(${Math.random() * 80 + 10}% - 5vw)`,
      });

      i++;

      setTimeout(() => {
        this.emotesImgs.splice(0, 1);
      }, 30000);
    }, 2000);
  }

  public emotesImgs: { url: string, left: string }[] = [];

  constructor() {
    // when emotes is updated, add emotes to the background

  }
}
