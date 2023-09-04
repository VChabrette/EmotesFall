import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedStateService } from './services/shared-state.service';
import { WebSocketService } from './services/websocket.service';
import { StorageService } from './services/storage.service';
import { EventsService } from './services/events.service';

@NgModule({
	declarations: [],
	providers: [
		WebSocketService,
		SharedStateService,
		EventsService,
		StorageService,
	],
	imports: [
		CommonModule
	]
})
export class CoreModule { }
