import { RouterModule, Routes } from '@angular/router';
import { NgModule, inject } from '@angular/core';

const routes: Routes = [
	// {
	// 	path: 'anyView',
	// 	component: AnyViewComponent,
	// },
]

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class ViewsRoutingModule { }
