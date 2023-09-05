import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewsComponent } from './views.component';
import { ViewsRoutingModule } from './views.routing';
import { WidgetComponent } from './widget/widget.component';

@NgModule({
  declarations: [
    WidgetComponent
  ],
  imports: [
    CommonModule,
    ViewsRoutingModule,
  ],
  providers: [],
})
export class ViewsModule { }
