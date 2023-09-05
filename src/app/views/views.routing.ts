import { RouterModule, Routes } from '@angular/router';
import { NgModule, inject } from '@angular/core';
import { WidgetComponent } from './widget/widget.component';

const routes: Routes = [
	{
		path: 'widget',
		component: WidgetComponent,
	},
]

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class ViewsRoutingModule { }
