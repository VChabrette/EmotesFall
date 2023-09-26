import { Component } from '@angular/core';
import { clipboard } from '@tauri-apps/api';

@Component({
  selector: 'app-overlays',
  templateUrl: './overlays.component.html',
  styleUrls: ['./overlays.component.css']
})
export class OverlaysComponent {
  public get overlayWidget() {
    return `${window.location.origin}/views/widget`;
  }

  public copyToClipboard(str: string) {
    if (!str) return;

    clipboard.writeText(str);
  }
}
