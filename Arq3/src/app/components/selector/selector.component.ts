import { Component } from '@angular/core';

@Component({
  selector: 'app-selector',
  templateUrl: './selector.component.html',
  styleUrls: ['./selector.component.scss']
})
export class SelectorComponent {
  selecionaArquitetura = ['Escalar', 'Superescalar'];
  tipoMultithreading: { [key: string]: string[] } = {
    'Escalar': ['IMT', 'BMT'],
    'Superescalar': ['IMT', 'BMT', 'SMT']
  };

  arquitetura: string = '';
  tipo: string = '';
  opcaoSelecionada: string[] = [];

  onSelectMetodo(opcao: string) {
    this.arquitetura = opcao;
    this.opcaoSelecionada = this.tipoMultithreading[opcao] || [];
    this.tipo = '';
  }
}
