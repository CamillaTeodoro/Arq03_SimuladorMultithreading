import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

export interface Instruction {

    name: string; 
    color: string; 
    stage: 'decodificacao' | 'execucao' | 'writeback'; 
  }
  
  interface InstructionRow {
    ciclo: number;
    decodificacao: Instruction[];
    execucao: Instruction[];
    writeback: Instruction[];
  }

  export interface InstructionResult {
    name: string; 
    result: number; 
  }
  
@Component({
  selector: 'app-superescalar',
  templateUrl: './superescalar.component.html',
  styleUrls: ['./superescalar.component.scss']
})
export class SuperescalarComponent {
  @Input() tipo: string = "";
  dataSource = new MatTableDataSource<InstructionRow>();
  displayedColumns: string[] = ['ciclo', 'decodificacao', 'execucao', 'writeback'];

  constructor() { }

  ngOnInit(): void {
    const instructions: Instruction[] = [
      { name: 'I1', color: '#ff0000', stage: 'decodificacao' },
      { name: 'I2', color: '#00ff00', stage: 'decodificacao' },
      { name: 'I3', color: '#0000ff', stage: 'decodificacao' },
      { name: 'I4', color: '#ffff00', stage: 'decodificacao' },
      { name: 'I1', color: '#ff0000', stage: 'execucao' },
      { name: 'I2', color: '#00ff00', stage: 'execucao' },
      { name: 'I3', color: '#0000ff', stage: 'decodificacao' },
      { name: 'I4', color: '#ffff00', stage: 'decodificacao' },
      { name: 'I1', color: '#ff0000', stage: 'writeback' },
      { name: 'I2', color: '#00ff00', stage: 'writeback' },
      { name: 'I3', color: '#0000ff', stage: 'execucao' },
      { name: 'I4', color: '#ffff00', stage: 'decodificacao' },
      { name: 'I3', color: '#0000ff', stage: 'writeback' },
      { name: 'I4', color: '#ffff00', stage: 'execucao' },
      { name: 'I4', color: '#ffff00', stage: 'writeback' }
    ];
  
    const rows: InstructionRow[] = Array.from({length: 6}, (_, i) => ({ ciclo: i + 1, decodificacao: [], execucao: [], writeback: [] }));
  
    const addedInstructions: { [name: string]: { [stage: string]: boolean } } = {};
  
    instructions.forEach(instruction => {
      if (!addedInstructions[instruction.name]) {
        addedInstructions[instruction.name] = {};
      }
  
      if (addedInstructions[instruction.name][instruction.stage]) {
        return;
      }
  
      addedInstructions[instruction.name][instruction.stage] = true;
  
      if (instruction.stage === 'decodificacao') {
        if (instruction.name === 'I1' || instruction.name === 'I2') {
          rows[0].decodificacao.push(instruction);
        } else if (instruction.name === 'I3') {
          rows[1].decodificacao.push(instruction);
        } else if (instruction.name === 'I4') {
          rows[2].decodificacao.push(instruction);
        }
      } else if (instruction.stage === 'execucao') {
        if (instruction.name === 'I1' || instruction.name === 'I2') {
          rows[1].execucao.push(instruction);
        } else if (instruction.name === 'I3') {
          rows[2].execucao.push(instruction);
        } else if (instruction.name === 'I4') {
          rows[3].execucao.push(instruction);
        }
      } else if (instruction.stage === 'writeback') {
        if (instruction.name === 'I1' || instruction.name === 'I2') {
          rows[2].writeback.push(instruction);
        } else if (instruction.name === 'I3') {
          rows[3].writeback.push(instruction);
        } else if (instruction.name === 'I4') {
          rows[4].writeback.push(instruction);
        }
      }
    });
  
    this.dataSource.data = rows;
  }

  instructionResults: InstructionResult[] = [
    { name: 'IPC', result: 0 }, 
    { name: 'Bolha', result: 0 },
    { name: 'Ciclos', result: 0 }
  ];

  displayedColumns2: string[] = ['name', 'result']; 

  dataSource2 = new MatTableDataSource<InstructionResult>(this.instructionResults);
}



