import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-escalar',
  templateUrl: './escalar.component.html',
  styleUrls: ['./escalar.component.scss']
})
export class EscalarComponent {
  @Input() tipo: string = "";
}
