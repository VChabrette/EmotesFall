import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-emotes-background',
  templateUrl: './emotes-background.component.html',
  styleUrls: ['./emotes-background.component.scss']
})
export class EmotesBackgroundComponent {
  private interval: NodeJS.Timeout | null = null;
  private windowFocused$ = new BehaviorSubject<boolean>(true);

  @Input() set emotes(emotes: string[]) {
    let i = 0;
    if (this.interval) clearInterval(this.interval);

    if (!emotes.length) return;
    this.interval = setInterval(() => {
      if (!this.windowFocused$.value) return;

      const emote = emotes[i % emotes.length];

      this.emotesImgs.push({
        url: emote,
        left: `calc(${Math.random() * 90 + 5}% - 5vw)`,
      });

      i++;

      setTimeout(() => {
        this.emotesImgs.splice(0, 1);
      }, 20000);
    }, 1500);
  }

  public emotesImgs: { url: string, left: string }[] = [];

  constructor() {
    window.onfocus = () => this.windowFocused$.next(true);
    window.onblur = () => this.windowFocused$.next(false);
  }
}
