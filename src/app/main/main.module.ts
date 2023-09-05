import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { MainRoutingModule } from './main.routing';
import { CoreModule } from '../core/core.module';
import { HomeComponent } from './pages/home/home.component';
import { TwitchApiService } from './services/twitch/twitch-api.service';
import { TwitchChatService } from './services/twitch/twitch-chat.service';
import { EmotesFallService } from './services/emotes-fall.service';

@NgModule({
	declarations: [
		MainComponent,
		HomeComponent
	],
	imports: [
		CommonModule,
		MainRoutingModule,
		FormsModule,
		ReactiveFormsModule,
		SharedModule,
		CoreModule,
	],
	providers: [
		TwitchApiService,
		TwitchChatService,
		EmotesFallService,
	],
	bootstrap: [MainComponent],
})
export class MainModule { }

