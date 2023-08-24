import { Component } from "@angular/core";
import { invoke } from "@tauri-apps/api/tauri";
import { WebSocketService } from './core/services/websocket.service';
import { event } from '@tauri-apps/api';
import { SharedStateService } from './core/services/shared-state.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {

}
