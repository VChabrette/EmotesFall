import { ActivatedRouteSnapshot, RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';
import { NgModule, inject } from '@angular/core';
import { StorageService } from '../core/services/storage.service';
import { tauriGuard } from '../shared/guards/tauri.guard';
import { HomeComponent } from './pages/home/home.component';

const routes: Routes = [
	{
		path: '',
		component: MainComponent,
		resolve: { _: async () => await inject(StorageService).init() },
		canActivate: [tauriGuard],
		children: [
			{
				path: '',
				component: HomeComponent,
			},
		]
	}
]

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class MainRoutingModule { }
