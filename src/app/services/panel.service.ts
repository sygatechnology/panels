import { Injectable } from '@angular/core';
import Panel from "../map/classes/panel";

@Injectable({
  providedIn: 'root'
})
export class PanelService {

  constructor() { }

  getAll(): Panel[] {
    return [
      new Panel("1-20.png", "Panneau 1"),
      new Panel("2-20.png", "Panneau 2"),
      new Panel("3-20.png", "Panneau 3"),
      new Panel("4-20.png", "Panneau 4"),
      new Panel("5-20.png", "Panneau 5")
    ].map(panel => panel
        .setSrc("assets/img/"+panel.getSrc())
        .setName(panel.getName())
    );
  }
}
