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

  constructor(
    private storage: StorageService,
    private state: SharedStateService,
  ) {
    // init values in backend state
    this.scale = this.storage.get('scale') || 0.5;
    this.friction = this.storage.get('friction') || 0.5;
    this.restitution = this.storage.get('restitution') || 0.2;
    this.gravity = this.storage.get('gravity') || 1;

    // subscribe to changes
    this.scale$.subscribe(val => this._scale = val);
    this.friction$.subscribe(val => this._friction = val);
    this.restitution$.subscribe(val => this._restitution = val);
    this.gravity$.subscribe(val => this._gravity = val);
  }

  private setValue(key: string, val: any) {
    this.storage.set(key, val);
    this.state.set(key, val);
  }

  private get$<T>(key: string) {
    return this.state.get<T>(key)
  }
}
