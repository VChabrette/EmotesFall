import { Injectable } from '@angular/core';
import { SharedStateService } from '../../core/services/shared-state.service';
import { StorageService } from '../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  // scale
  private _scale!: number;
  public get scale() { return this._scale }
  public set scale(val) {
    this._scale = val;
    this.setValue('scale', val)
  }
  public get scale$() { return this.get$<number>('scale') }

  // friction
  private _friction!: number;
  public get friction() { return this._friction }
  public set friction(val) {
    this._friction = val;
    this.setValue('friction', val)
  }
  public get friction$() { return this.get$<number>('friction') }

  // restitution
  private _restitution!: number;
  public get restitution() { return this._restitution }
  public set restitution(val) {
    this._restitution = val;
    this.setValue('restitution', val)
  }
  public get restitution$() { return this.get$<number>('restitution') }

  // gravity
  private _gravity!: number;
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

  // 

  constructor(
    private storage: StorageService,
    private state: SharedStateService,
  ) {
    this.init()
  }

  private async init() {
    // init values in backend state
    if (this.storage.isInitialized) {
      this.scale = this.storage.get('scale') !== null ? this.storage.get('scale')! : 0.5;
      this.friction = this.storage.get('friction') !== null ? this.storage.get('friction')! : 0.5;
      this.restitution = this.storage.get('restitution') !== null ? this.storage.get('restitution')! : 0.2;
      this.gravity = this.storage.get('gravity') !== null ? this.storage.get('gravity')! : 1;
      this.animated = this.storage.get('animated') !== null ? this.storage.get('animated')! : true;
    }

    // subscribe to changes
    this.scale$.subscribe(val => this._scale = val);
    this.friction$.subscribe(val => this._friction = val);
    this.restitution$.subscribe(val => this._restitution = val);
    this.gravity$.subscribe(val => this._gravity = val);
    this.animated$.subscribe(val => this._animated = val);
  }

  private setValue(key: string, val: any) {
    this.storage.set(key, val);
    this.state.set(key, val);
  }

  private get$<T>(key: string) {
    return this.state.get<T>(key)
  }
}
