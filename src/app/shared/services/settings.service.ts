import { Injectable } from '@angular/core';
import { SharedStateService } from '../../core/services/shared-state.service';
import { StorageService } from '../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  // scale
  private _scale: number = 0.5;
  public get scale() { return this._scale }
  public set scale(val) {
    this._scale = val;
    this.setValue('scale', val)
  }
  public get scale$() { return this.get$<number>('scale') }

  // friction
  private _friction: number = 0.5;
  public get friction() { return this._friction }
  public set friction(val) {
    this._friction = val;
    this.setValue('friction', val)
  }
  public get friction$() { return this.get$<number>('friction') }

  // restitution
  private _restitution: number = 0.2;
  public get restitution() { return this._restitution }
  public set restitution(val) {
    this._restitution = val;
    this.setValue('restitution', val)
  }
  public get restitution$() { return this.get$<number>('restitution') }

  // gravity
  private _gravity: number = 1;
  public get gravity() { return this._gravity }
  public set gravity(val) {
    this._gravity = val;
    this.setValue('gravity', val)
  }
  public get gravity$() { return this.get$<number>('gravity') }

  // animated
  private _animated = true;
  public get animated() { return this._animated }
  public set animated(val) {
    this._animated = val;
    this.setValue('animated', val)
  }
  public get animated$() { return this.get$<boolean>('animated') }

  // fpsGuard
  private _fpsGuard = true;
  public get fpsGuard() { return this._fpsGuard }
  public set fpsGuard(val) {
    this._fpsGuard = val;
    this.setValue('fpsGuard', val)
  }
  public get fpsGuard$() { return this.get$<boolean>('fpsGuard') }

  // emotesDuration
  private _emotesDuration: number | null = 60;
  public get emotesDuration() { return this._emotesDuration }
  public set emotesDuration(val) {
    this._emotesDuration = val;
    this.setValue('emotesDuration', val)
  }
  public get emotesDuration$() { return this.get$<number | null>('emotesDuration') }

  constructor(
    private storage: StorageService,
    private state: SharedStateService,
  ) {
    this.init()
  }

  private async init() {
    Object.keys(this)
      .filter(key => key.startsWith('_'))
      .forEach(key => {
        const $this = this as any;

        const settingKey = key.slice(1); // remove the _
        const defaultVal = $this[key];

        console.log('Loading setting', settingKey);
        if (this.storage.isInitialized) {
          const val = this.storage.get(settingKey);
          if (typeof val !== 'undefined') {
            $this[settingKey] = val;
            console.log('- Loaded ' + key + ' from storage: ' + val);
          } else if (typeof defaultVal !== 'undefined') {
            this.setValue(settingKey, defaultVal);
            console.log('- Loaded ' + key + ' from default value' + defaultVal);
          }
        }

        const subjectKey = key.slice(1) + '$';
        const subject = $this[subjectKey];

        console.log('- Subscribe to ' + subjectKey + ' to setting ' + key);
        subject.subscribe((val: any) => {
          $this[key] = val;
        });
      });
  }

  private setValue(key: string, val: any) {
    this.storage.set(key, val);
    this.state.set(key, val);
  }

  private get$<T>(key: string) {
    return this.state.get<T>(key)
  }
}
