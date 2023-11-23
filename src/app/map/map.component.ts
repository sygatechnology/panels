import { Component } from '@angular/core';
import * as Leaflet from 'leaflet';
import { DrawEvents, FeatureGroup, featureGroup } from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent {
  map!: Leaflet.Map;
  options = {
    center: { lng: 4.3756, lat: 50.8481 },
    layers: [
      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      })
    ],
    zoom: 16
  }

  drawnItems: FeatureGroup = featureGroup();

  drawOptions = {
    edit: {
      featureGroup: this.drawnItems
    }
  }

  constructor() { }

  onMapReady($event: Leaflet.Map) {
    this.map = $event;
  }

  onDrawCreated(e: any) {
    this.drawnItems.addLayer((e as DrawEvents.Created).layer);
  }
}

