import { Component, Input,  ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

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
  pipelineHistory: ScalarPipeline[] = ScalarPipeline.getNullArray(10);

  displayedColumns: string[] = ['IF', 'ID', 'EX', 'MEM', 'WB']; 

  dataSource = new MatTableDataSource<ScalarPipeline>(this.pipelineHistory);

  instructionResults: InstructionResult[] = [
    { name: 'IPC', result: 0 }, 
    { name: 'Bolha', result: 0 },
    { name: 'Ciclos', result: 0 }
  ];

  displayedColumns2: string[] = ['name', 'result']; 

  dataSource2 = new MatTableDataSource<InstructionResult>(this.instructionResults);

  start() {}
}

export class Instruction {
  threadName: string;
  backgroundColor: string;
  type: string;
  name: string;
  rd: string;
  rs1: string;
  rs2: string;
  imm: number;

  constructor(threadName: string, backgroundColor: string, type: string, name: string, rd: string, rs1: string, rs2: string, imm: number) {
      this.threadName = threadName;
      this.backgroundColor = backgroundColor;
      this.type = type;
      this.name = name;
      this.rd = rd;
      this.rs1 = rs1;
      this.rs2 = rs2;
      this.imm = imm;
  }

  toString(): string {
      switch (this.type) {
          case 'R':
              return `${this.threadName}: ${this.name} ${this.rd}, ${this.rs1}, ${this.rs2}`;
          case 'I':
              return `${this.threadName}: ${this.name} ${this.rd}, ${this.imm}(${this.rs1})`;
          case 'S':
              return `${this.threadName}: ${this.name} ${this.rs1}, ${this.rs2}(${this.imm})`;
          case 'B':
              return `${this.threadName}: ${this.name} ${this.rs1}, ${this.rs2}, ${this.imm}`;
          case 'J':
              return `${this.threadName}: ${this.name} ${this.rd}, ${this.imm}`;
          case 'F':
              return `${this.threadName}: ${this.name} ${this.rd}, ${this.rs1}, ${this.rs2}`;
          default:
              return '';
      }
  }

  static null(): Instruction {
    return new Instruction('', 'transparent', '', '', '', '', '', -1);
  }

  static bubble(backgroundColor: string): Instruction {
    return new Instruction('', backgroundColor, '', '', '', '', '', -1);
  }
}

export class Thread {
  instructions: Instruction[];
  name: String;

  constructor(instructions: Instruction[], name: String) {
      this.instructions = instructions;
      this.name = name;
  }

  toString(): string {
      return `${this.name}: \n` + this.instructions.map(instruction => instruction.toString()).join('\n');
  }
}

export class ScalarPipeline {
  IF: Instruction;
  ID: Instruction;
  EX: Instruction;
  MEM: Instruction;
  WB: Instruction;

  constructor() {
    this.IF = Instruction.null();
    this.ID = Instruction.null();
    this.EX = Instruction.null();
    this.MEM = Instruction.null();
    this.WB = Instruction.null();
  }

  static getNullArray(n: number): ScalarPipeline[] {
    let pipelines = new Array<ScalarPipeline>();
    for(let i = 0; i < n; i++) {
      pipelines.push(new ScalarPipeline())
    }
    return pipelines;
  }
}