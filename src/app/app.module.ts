import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./app.component";
import { WebSocketService } from './core/services/websocket.service';
import { SharedStateService } from './core/services/shared-state.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from './shared/shared.module';
import { MainModule } from './main/main.module';
import { RouterModule } from '@angular/router';
import { CoreModule } from './core/core.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    CoreModule,
    SharedModule,
    MainModule,
    RouterModule.forRoot([
      { path: 'views', loadChildren: () => import('./views/views.module').then(m => m.ViewsModule) },
      { path: '**', loadChildren: () => import('./main/main.module').then(m => m.MainModule) },
    ]),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
