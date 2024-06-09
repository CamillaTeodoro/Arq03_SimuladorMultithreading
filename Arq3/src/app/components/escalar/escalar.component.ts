import { Component, Input,  ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';


export interface Instruction {
  name: string;
  color: string;
  IF: boolean;
  ID: boolean;
  EX: boolean;
  MEM: boolean;
  WB: boolean;
}

export interface InstructionResult {
  name: string; 
  result: number; 
}
@Component({
  selector: 'app-escalar',
  templateUrl: './escalar.component.html',
  styleUrls: ['./escalar.component.scss']
})
export class EscalarComponent {
  @Input() tipo: string = "";
  constructor(private cdRef: ChangeDetectorRef) {}
 
  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }
  instructions: Instruction[] = [
    { name: 'Instrução 1', color: 'blue', IF: true, ID: false, EX: false, MEM: false, WB: false },
    { name: 'Instrução 2', color: 'red', IF: false, ID: true, EX: false, MEM: false, WB: false },
    { name: 'Instrução 3', color: 'green', IF: false, ID: false, EX: true, MEM: false, WB: false },
    { name: 'Instrução 4', color: 'yellow', IF: false, ID: false, EX: false, MEM: true, WB: false },
    { name: 'Instrução 5', color: 'blue', IF: false, ID: false, EX: false, MEM: false, WB: true },
    
  ];

  displayedColumns: string[] = ['name', 'IF', 'ID', 'EX', 'MEM', 'WB']; 

  dataSource = new MatTableDataSource<Instruction>(this.instructions);


  instructionResults: InstructionResult[] = [
    { name: 'IPC', result: 0 }, 
    { name: 'Bolha', result: 0 },
    { name: 'Ciclos', result: 0 }
  ];

  displayedColumns2: string[] = ['name', 'result']; 

  dataSource2 = new MatTableDataSource<InstructionResult>(this.instructionResults);
}
