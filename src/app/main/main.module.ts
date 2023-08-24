import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { MainRoutingModule } from './main.routing';
import { CoreModule } from '../core/core.module';

@NgModule({
	declarations: [
		MainComponent
	],
	imports: [
		CommonModule,
		MainRoutingModule,
		FormsModule,
		ReactiveFormsModule,
		SharedModule,
		CoreModule,
	],
	bootstrap: [MainComponent],
})
export class MainModule { }

