import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import { fromLonLat } from 'ol/proj';
import { Icon, RegularShape, Stroke, Style } from 'ol/style';
import VectorSource from 'ol/source/Vector';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Point from 'ol/geom/Point';
import OSM from 'ol/source/OSM';
import { Coordinate } from 'ol/coordinate';
import { Draw, Modify, Snap, DragRotateAndZoom, defaults as defaultInteractions } from "ol/interaction";
import { PanelService } from 'src/app/services/panel.service';
import Panel from "../classes/panel";
import { Type } from 'ol/geom/Geometry';
import jsPDF from 'jspdf';


@Component({
  selector: 'app-ol',
  templateUrl: './ol.component.html',
  styleUrls: ['./ol.component.css']
})
export class OlComponent implements AfterViewInit {

  @ViewChild('map') map!: Map;
  _panels!: Panel[];
  private _selectedPanel!: Panel|null;
  selectedType: string = "None";
  @ViewChild("exportButton") exportButton!: ElementRef;
  dims: any = {
    "a0": [1189, 841],
    "a1": [841, 594],
    "a2": [594, 420],
    "a3": [420, 297],
    "a4": [297, 210],
    "a5": [210, 148]
  };
  exportFormat: string = "a0";
  exportResolution: string = "72";
  _source = new VectorSource();
  _vector = new VectorLayer({
    source: this._source,
    style: {
      'fill-color': 'rgba(255, 255, 255, 0.2)',
      'stroke-color': '#f00',
      'stroke-width': 2,
      'circle-radius': 7,
      'circle-fill-color': '#f00',
    },
  });
  private _draw!: Draw;
  private _snap!: Snap;
  

  constructor(panelService: PanelService) {
    this._panels = panelService.getAll();
  }

  ngAfterViewInit(): void {
    this.map = new Map({
      interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
      view: new View({
        center: fromLonLat([4.3756, 50.8481]),
        zoom: 16
      }),
      layers: [
         new TileLayer({
          source: new OSM()
        }),
        this._vector
      ],
      target: 'map'
    });

    const modify = new Modify({source: this._source});
    this.map.addInteraction(modify);

    this.addInteractions();
    const _self = this;
    this.map.on("click", function(evt) {
      if(_self._selectedPanel != null) {
        try {
          const _vectorSource = new VectorSource({
            features: [ _self.setFeature(_self.map.getEventCoordinate(evt.originalEvent)) ],
            wrapX: false
          });
          _self.map.addLayer( new VectorLayer({
            source: _vectorSource,
            style: [ _self.setStyle(_self._selectedPanel) ]
          }) );

          _self.map.addInteraction( _self.setInteraction( _vectorSource ) );

          _self.selectPanel(null);
        } catch(e) {}
      }
    });
    
  }

  setFeature(coordinate: Coordinate) {
    const point = new Point(coordinate);
    return new Feature({
      geometry: point
    });
  }

  setStyle(panel: Panel) {
    return new Style({
      image: new Icon({
        size: [20, 20],
        //scale: 1,
        src: panel.getSrc(),
      })
    });
  }

  setInteraction(source: VectorSource) {
    return new Modify({
      source: source,
      style: new Style({
        image: new RegularShape({
          points: 4,
          radius: 10,
          radius2: 0,
          stroke: new Stroke({
            color: 'red',
            width: 3,
          }),
        }),
      }),
    });
  }

  selectPanel(panel: Panel|null) {
    this.selectedType = "None";
    this._selectType();
    const docStyle = document.body.style;
    this._selectedPanel = panel;
    if(panel != null) {
      docStyle.cursor = `url('${panel.getSrc()}'), default`;
    } else {
      docStyle.cursor = `default`;
    }
  }

  addInteractions() {
    try {
      this._draw = new Draw({
        source: this._source,
        type: this.selectedType as Type,
      });
      this.map.addInteraction(this._draw);
      this._snap = new Snap({source: this._source});
      this.map.addInteraction(this._snap);
    } catch(e){}
  }

  selectType(e: any) {
    this.selectedType = e.target.value;
    this._selectType();
  }

  private _selectType() {
    this.map.removeInteraction(this._draw);
    this.map.removeInteraction(this._snap);
    this.addInteractions();
  }

  undo() {
    this._draw.removeLastPoint();
    this._draw.abortDrawing();
  }

  downloadPdf() {
    try {
      const _self = this;
      this.exportButton.nativeElement.disabled = true;
      document.body.style.cursor = 'progress';
      const dim = this.dims[this.exportFormat];
      const width = Math.round((dim[0] * Number(this.exportResolution)) / 25.4);
      const height = Math.round((dim[1] * Number(this.exportResolution)) / 25.4);
      const size = this.map.getSize();
      const viewResolution = this.map.getView().getResolution();
      this.map.once('rendercomplete', function () {
        const mapCanvas = document.createElement('canvas');
        mapCanvas.width = width;
        mapCanvas.height = height;
        const mapContext = mapCanvas.getContext('2d');
        if(mapContext != null) {
          Array.prototype.forEach.call(
            document.querySelectorAll('.ol-layer canvas'),
            function (canvas) {
              if (canvas.width > 0) {
                const opacity = canvas.parentNode.style.opacity;
                mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
                const transform = canvas.style.transform;
                // Get the transform parameters from the style's transform matrix
                const matrix = transform
                  .match(/^matrix\(([^\(]*)\)$/)[1]
                  .split(',')
                  .map(Number);
                // Apply the transform to the export map context
                CanvasRenderingContext2D.prototype.setTransform.apply(
                  mapContext,
                  matrix
                );
                mapContext.drawImage(canvas, 0, 0);
              }
            }
          );
          mapContext.globalAlpha = 1;
          mapContext.setTransform(1, 0, 0, 1, 0, 0);
          const pdf = new jsPDF('landscape', undefined, _self.exportFormat);
          pdf.addImage(
            mapCanvas.toDataURL('image/jpeg'),
            'JPEG',
            0,
            0,
            dim[0],
            dim[1]
          );
          pdf.save('map.pdf');
          // Reset original map size
          _self.map.setSize(size);
          _self.map.getView().setResolution(viewResolution);
          _self.exportButton.nativeElement.disabled = false;
          document.body.style.cursor = 'auto';
        }
      });
    } catch(e){}
  }

}
