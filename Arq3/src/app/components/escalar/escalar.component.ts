import { Component, Input,  ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { SuperescalarComponent } from '../superescalar/superescalar.component';

export class InstructionResult {
  CPI: number = 0; 
  Bolhas: number = 0;
  Ciclos: number = 0;
  Instrucoes: number = 0;
}
@Component({
  selector: 'app-escalar',
  templateUrl: './escalar.component.html',
  styleUrls: ['./escalar.component.scss']
})
export class EscalarComponent {

  NUM_THREADS = 4;
  THREAD_SIZE = 20;
  BLOCK_SIZE = 5;

  @Input() tipo: string = "";
  constructor(private cdRef: ChangeDetectorRef) {}
 
  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }

  displayedColumns: string[] = ['#', 'IF', 'ID', 'EX', 'MEM', 'WB']; 
  pipelineHistory: ScalarPipeline[] = ScalarPipeline.getNullArray(100);
  dataSource = new MatTableDataSource<ScalarPipeline>(this.pipelineHistory);
  actualLine = 1;

  displayedColumns2: string[] = ['name', 'result'];
  results = new InstructionResult;
  dataSource2 = new MatTableDataSource<{ name: string, result: number }>(this.getResultsArray());
  

  backgroundColors: string[] = ['green', 'red', 'orange', 'blue'];
  instructionNames: string[] = [
    'ADD', 'SUB', 'AND', 'OR', 'XOR', 'SLL', 'SRL', 'SRA','SLT', 'SLTU',   // ULA
    'MUL', 'MULH', 'MULHSU', 'MULHU', 'DIV', 'DIVU', 'REM', 'REMU',        // ULA
    'LB', 'LH', 'LW', 'LBU', 'LHU', 'SB', 'SH', 'SW',                      // MEMORIA
    'BEQ', 'BNE', 'BLT', 'BGE', 'BLTU', 'BGEU', 'JAL', 'JALR',             // DESVIO
  ];

  getResultsArray(): { name: string, result: number }[] {
    return Object.keys(this.results).map(key => ({
      name: key,
      result: (this.results as any)[key]
    }));
  }

  getRandomInstructionName(): string {
      const randomIndex = Math.floor(Math.random() * this.instructionNames.length);
      return this.instructionNames[randomIndex];
  }

  getRandomRegister(): string {    
      return 'R' + Math.floor(Math.random() * 32);
  }

  getRandomImmediate(): number {
    return Math.floor(Math.random() * 1000);
  }

  generateInstruction(threadName: string, backgroundColor: string): Instruction {
    const name = this.getRandomInstructionName();
    const rd = this.getRandomRegister();
    const rs1 = this.getRandomRegister();
    const rs2 = this.getRandomRegister();
    const imm = this.getRandomImmediate();

    if (['ADD', 'SUB', 'AND', 'OR', 'XOR', 'SLL', 'SRL', 'SRA', 'SLT', 'SLTU', 'MUL', 'MULH', 'MULHSU', 'MULHU', 'DIV', 'DIVU', 'REM', 'REMU'].includes(name)) {
        return new Instruction(threadName, backgroundColor,'R', name, rd, rs1, rs2, 0);

    } else if (['LB', 'LH', 'LW', 'LBU', 'LHU'].includes(name)) {
        return new Instruction(threadName, backgroundColor, 'I', name, rd, rs1, '', imm);

    } else if (['SB', 'SH', 'SW'].includes(name)) {
        return new Instruction(threadName, backgroundColor, 'S', name, '', rs1, rs2, imm);

    } else if (['BEQ', 'BNE', 'BLT', 'BGE', 'BLTU', 'BGEU'].includes(name)) {
        return new Instruction(threadName, backgroundColor, 'B', name, '', rs1, rs2, imm);

    } else if (name === 'JAL') {
        return new Instruction(threadName, backgroundColor, 'J', name, rd, '', '', imm);

    } else {
        return new Instruction(threadName, backgroundColor, 'I', name, rd, rs1, '', imm);
    }
  }

  generateInstructions(n: number, threadName: string, backgroundColor: string): Instruction[] {
    let instructions: Instruction[] = [];
    for (let i = 0; i < n; i++) {
        const instruction = this.generateInstruction(threadName, backgroundColor);
        instructions.push(instruction);
    }

    // Atualizar ultimas instrucoes como null
    switch (this.tipo) {

      case 'Base':
      for (let i = 0; i < 5; i++) {
        const instruction = Instruction.null();
        instructions.push(instruction);
      }
      break;

      case 'IMT':
        let i = threadName == 'T1' ? 2 : 1
        for(let j = 0; j < i; j++) {
          const instruction = Instruction.null();
          instructions.push(instruction);
        }
      break;

      case 'BMT':
        if(threadName == 'T1') {
          for (let i = 0; i < 5; i++) {
            const instruction = Instruction.null();
            instructions.push(instruction);
          }
        }
      break;

      default : console.log('error');
    }
    return instructions;
  }

  generateThreads(n: number, length: number): Thread[] {
    const threads: Thread[] = [];
    for (let i = 0; i < n; i++) {
        const threadName = `T${i+1}`;
        const instructions = this.generateInstructions(length, threadName, this.backgroundColors[i]);
        const thread = new Thread(instructions, threadName);
        threads.push(thread);
    }
    return threads;
  }

  start(): void {
    switch (this.tipo) {
      case 'Base': this.base(); break;
      case 'IMT':  this.IMT();  break;
      case 'BMT':  this.BMT();  break;
      default : console.log('error');
    }
  }

  async base(): Promise<void> {
    const threads = this.generateThreads(1, this.THREAD_SIZE);
  
    this.pipelineHistory.forEach(element => {
      element.IF = Instruction.null();
      element.ID = Instruction.null();
      element.EX = Instruction.null();
      element.MEM = Instruction.null();
      element.WB = Instruction.null();
    });
  
    for (let i = 0; i < threads[0].instructions.length; i++) {
      this.pipelineHistory[this.actualLine].WB = this.pipelineHistory[this.actualLine-1].MEM;
      this.pipelineHistory[this.actualLine].MEM = this.pipelineHistory[this.actualLine-1].EX;

      // Verificar dependencia verdadeira
      if(
        (this.pipelineHistory[this.actualLine-1].ID.rs1 != '' && this.pipelineHistory[this.actualLine-1].ID.rs2 != '') &&
        (this.pipelineHistory[this.actualLine].WB.rd  == this.pipelineHistory[this.actualLine-1].ID.rs1 ||
         this.pipelineHistory[this.actualLine].WB.rd  == this.pipelineHistory[this.actualLine-1].ID.rs2 ||
         this.pipelineHistory[this.actualLine].MEM.rd == this.pipelineHistory[this.actualLine-1].ID.rs1 ||
         this.pipelineHistory[this.actualLine].MEM.rd == this.pipelineHistory[this.actualLine-1].ID.rs2)
      )
      {
        // Bolha
        this.pipelineHistory[this.actualLine].EX = Instruction.bubble(threads[0].name);
        this.pipelineHistory[this.actualLine].ID = this.pipelineHistory[this.actualLine-1].ID;
        this.pipelineHistory[this.actualLine].IF = this.pipelineHistory[this.actualLine-1].IF;              
        this.results.Bolhas++;
        i--;
      } else {
        this.pipelineHistory[this.actualLine].EX = this.pipelineHistory[this.actualLine-1].ID;
        this.pipelineHistory[this.actualLine].ID = this.pipelineHistory[this.actualLine-1].IF;
        this.pipelineHistory[this.actualLine].IF = threads[0].instructions[i];
      }
  
      await new Promise(resolve => setTimeout(resolve, 1000));

      if(this.pipelineHistory[this.actualLine-1].WB.name != '') {
        this.results.Instrucoes++;
      }
      
      if(i != threads[0].instructions.length-2) {
        this.results.Ciclos++;
      }

      this.actualLine++;
      this.results.CPI = this.results.Instrucoes != 0 ? this.results.Ciclos/this.results.Instrucoes : 0;
      this.dataSource2.data = this.getResultsArray();
    }
  }

  async IMT(): Promise<void> {
    const threads = this.generateThreads(this.NUM_THREADS, this.THREAD_SIZE);
  
    this.pipelineHistory.forEach(element => {
      element.IF = Instruction.null();
      element.ID = Instruction.null();
      element.EX = Instruction.null();
      element.MEM = Instruction.null();
      element.WB = Instruction.null();
    });
  
    for (let i = 0; i < threads[0].instructions.length; i++) {   // Considerando que todas threads têm mesmo tamanho
      for(let j = 0; j < this.NUM_THREADS; j++) {
        this.pipelineHistory[this.actualLine].WB = this.pipelineHistory[this.actualLine-1].MEM;
        this.pipelineHistory[this.actualLine].MEM = this.pipelineHistory[this.actualLine-1].EX;
        this.pipelineHistory[this.actualLine].EX = this.pipelineHistory[this.actualLine-1].ID;
        this.pipelineHistory[this.actualLine].ID = this.pipelineHistory[this.actualLine-1].IF;
        this.pipelineHistory[this.actualLine].IF = threads[j].instructions[i];

        await new Promise(resolve => setTimeout(resolve, 1000));

        if(this.pipelineHistory[this.actualLine].WB.name != '') {
          this.results.Instrucoes++;
        }

        if(i != threads[0].instructions.length-1) this.results.Ciclos++;
        else break;

        this.actualLine++;
        this.results.CPI = this.results.Instrucoes != 0 ? this.results.Ciclos/this.results.Instrucoes : 0;
        this.dataSource2.data = this.getResultsArray();
      }
    }
  }

  async BMT(): Promise<void> {
    const threads = this.generateThreads(this.NUM_THREADS, this.THREAD_SIZE);
  
    this.pipelineHistory.forEach(element => {
      element.IF = Instruction.null();
      element.ID = Instruction.null();
      element.EX = Instruction.null();
      element.MEM = Instruction.null();
      element.WB = Instruction.null();
    });

    let finishedSMT = false;
    let threadSize = threads[0].instructions.length/this.BLOCK_SIZE + 1;

    for (let i = 0; i < threadSize; i++) {   // Considerando que todas threads têm mesmo tamanho
      for(let j = 0; j < this.NUM_THREADS; j++) {

        if (!finishedSMT) {

          for(let k = 0; k < this.BLOCK_SIZE; k++) {

            this.pipelineHistory[this.actualLine].WB = this.pipelineHistory[this.actualLine-1].MEM;
            this.pipelineHistory[this.actualLine].MEM = this.pipelineHistory[this.actualLine-1].EX;

            // Verificar dependencia verdadeira
            if(
              (this.pipelineHistory[this.actualLine-1].ID.rs1 != '' && this.pipelineHistory[this.actualLine-1].ID.rs2 != '') 
              
              &&
              ((this.pipelineHistory[this.actualLine].WB.rd  == this.pipelineHistory[this.actualLine-1].ID.rs1 ||
                this.pipelineHistory[this.actualLine].WB.rd  == this.pipelineHistory[this.actualLine-1].ID.rs2) && 
                (this.pipelineHistory[this.actualLine].WB.threadName == this.pipelineHistory[this.actualLine-1].ID.threadName)
               
               ||
      
               (this.pipelineHistory[this.actualLine].MEM.rd  == this.pipelineHistory[this.actualLine-1].ID.rs1 ||
                this.pipelineHistory[this.actualLine].MEM.rd  == this.pipelineHistory[this.actualLine-1].ID.rs2) && 
                (this.pipelineHistory[this.actualLine].MEM.threadName == this.pipelineHistory[this.actualLine-1].ID.threadName)
              )
            )
            {
              // Bolha
              this.pipelineHistory[this.actualLine].EX = Instruction.bubble(this.pipelineHistory[this.actualLine-1].ID.threadName);
              this.pipelineHistory[this.actualLine].ID = this.pipelineHistory[this.actualLine-1].ID;
              this.pipelineHistory[this.actualLine].IF = this.pipelineHistory[this.actualLine-1].IF;              
              this.results.Bolhas++;
              k--;
            } else {
              this.pipelineHistory[this.actualLine].EX = this.pipelineHistory[this.actualLine-1].ID;
              this.pipelineHistory[this.actualLine].ID = this.pipelineHistory[this.actualLine-1].IF;
              this.pipelineHistory[this.actualLine].IF = threads[j].instructions[i*this.BLOCK_SIZE+k];
            }
        
            await new Promise(resolve => setTimeout(resolve, 1000));

            if(this.pipelineHistory[this.actualLine].WB.name != '') {
              this.results.Instrucoes++;
            }
            
            if(i != threadSize-1) {
              this.results.Ciclos++;
            }

            this.actualLine++;
            this.results.CPI = this.results.Instrucoes != 0 ? this.results.Ciclos/this.results.Instrucoes : 0;
            this.dataSource2.data = this.getResultsArray();
          }

          finishedSMT = i==threadSize-1 ? true : false;
        }
      }
    }
  }
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
          case 'Bubble':
              return `${this.threadName}: ${this.type}`;
          default:
              return '';
      }
  }

  static null(): Instruction {
    return new Instruction('', 'transparent', '', '', '', '', '', -1);
  }

  static bubble(threadName: string): Instruction {
    return new Instruction(threadName, 'gray', 'Bubble', '', '', '', '', -1);
  }
}

export class Thread {
  instructions: Instruction[];
  name: string;

  constructor(instructions: Instruction[], name: string) {
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