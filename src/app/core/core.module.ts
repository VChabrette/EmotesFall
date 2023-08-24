import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedStateService } from './services/shared-state.service';
import { WebSocketService } from './services/websocket.service';
import { StorageService } from './services/storage.service';

@NgModule({
	declarations: [],
	providers: [
		SharedStateService,
		WebSocketService,
		StorageService,
	],
	imports: [
		CommonModule
	]
})
export class CoreModule { }
