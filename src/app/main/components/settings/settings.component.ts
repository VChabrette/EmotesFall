import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SettingsService } from '../../../shared/services/settings.service';
import { EmotesFallService } from '../../services/emotes-fall.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  public settingsForm = new FormGroup({
    animated: new FormControl(this.settings.animated),
    fpsGuard: new FormControl(this.settings.fpsGuard),
    friction: new FormControl(this.settings.friction, [Validators.required, Validators.min(0), Validators.max(1)]),
    restitution: new FormControl(this.settings.restitution, [Validators.required, Validators.min(0), Validators.max(1)]),
    scale: new FormControl(this.settings.scale, [Validators.required, Validators.min(0.1), Validators.max(1)]),
    gravity: new FormControl(this.settings.gravity, [Validators.required, Validators.min(0), Validators.max(100)]),
  });

  constructor(
    private settings: SettingsService,
    public emotesFall: EmotesFallService,
  ) {
    this.settingsForm.valueChanges.subscribe(values => {
      this.settings.animated = values.animated as boolean;
      this.settings.fpsGuard = values.fpsGuard as boolean;
      this.settings.friction = values.friction as number;
      this.settings.restitution = values.restitution as number;
      this.settings.scale = values.scale as number;
      this.settings.gravity = values.gravity as number;
    });
  }
}
