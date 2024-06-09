import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-superescalar',
  templateUrl: './superescalar.component.html',
  styleUrls: ['./superescalar.component.scss']
})
export class SuperescalarComponent {
  @Input() tipo: string = "";
}
