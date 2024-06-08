import { Component } from '@angular/core';

@Component({
  selector: 'app-simulator',
  templateUrl: './simulator.component.html',
  styleUrls: ['./simulator.component.scss']
})
export class SimulatorComponent {

  selectedOption: string = '0';

  displayedColumns: string[] = ['Stage', 'Instruction'];
  scalarPipeline = [
    {stage: 'IF',  instruction: ''},
    {stage: 'ID',  instruction: ''},
    {stage: 'EX',  instruction: ''},
    {stage: 'MEM', instruction: ''},
    {stage: 'WB',  instruction: ''}
  ];

  instructionNames: string[] = [
    'ADD', 'SUB', 'AND', 'OR', 'XOR', 'SLL', 'SRL', 'SRA','SLT', 'SLTU',   // ULA
    'MUL', 'MULH', 'MULHSU', 'MULHU', 'DIV', 'DIVU', 'REM', 'REMU',        // ULA
    'LB', 'LH', 'LW', 'LBU', 'LHU', 'SB', 'SH', 'SW',                      // MEMORIA
    'BEQ', 'BNE', 'BLT', 'BGE', 'BLTU', 'BGEU', 'JAL', 'JALR',             // DESVIO
    'FADD.S', 'FSUB.S', 'FMUL.S', 'FDIV.S', 'FSQRT.S'                      // PONTO FLUTUANTE
  ];

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

  generateInstruction(): Instruction {
    const name = this.getRandomInstructionName();
    const rd = this.getRandomRegister();
    const rs1 = this.getRandomRegister();
    const rs2 = this.getRandomRegister();
    const imm = this.getRandomImmediate();

    if (['ADD', 'SUB', 'AND', 'OR', 'XOR', 'SLL', 'SRL', 'SRA', 'SLT', 'SLTU', 'MUL', 'MULH', 'MULHSU', 'MULHU', 'DIV', 'DIVU', 'REM', 'REMU'].includes(name)) {
        return new Instruction('R', name, rd, rs1, rs2, 0);

    } else if (['LB', 'LH', 'LW', 'LBU', 'LHU'].includes(name)) {
        return new Instruction('I', name, rd, rs1, '', imm);

    } else if (['SB', 'SH', 'SW'].includes(name)) {
        return new Instruction('S', name, '', rs1, rs2, imm);

    } else if (['BEQ', 'BNE', 'BLT', 'BGE', 'BLTU', 'BGEU'].includes(name)) {
        return new Instruction('B', name, '', rs1, rs2, imm);

    } else if (name === 'JAL') {
        return new Instruction('J', name, rd, '', '', imm);

    } else if (name === 'JALR') {
        return new Instruction('I', name, rd, rs1, '', imm);
        
    } else {
        return new Instruction('F', name, rd, rs1, rs2, 0);
    }
  }

  generateInstructions(n: number): Instruction[] {
    let instructions: Instruction[] = [];
    for (let i = 0; i < n; i++) {
        const instruction = this.generateInstruction();
        instructions.push(instruction);
    }
    return instructions;
  }

  generateThreads(n: number, length: number): Thread[] {
    const threads: Thread[] = [];
    for (let i = 0; i < n; i++) {
        const instructions = this.generateInstructions(length);
        const thread = new Thread(instructions);
        threads.push(thread);
    }
    return threads;
  }

  start(): void {
    switch (this.selectedOption) {
      case '1': this.scalar();         break;
      case '2': this.scalarIMT();      break;
      case '3': this.scalarBMT();      break;
      case '4': this.superscalar();    break;
      case '5': this.superscalarIMT(); break;
      case '6': this.superscalarBMT(); break;
      case '7': this.superscalarSMT(); break;
      default : console.log('error');
    }
  }

  async scalar(): Promise<void> {
    const threads = this.generateThreads(1, 20);
    console.log(threads[0].toString());
  
    this.scalarPipeline.forEach(element => {
      element.instruction = '';
    });
  
    for (let i = 0; i < threads[0].instructions.length; i++) {
      this.scalarPipeline[4].instruction = this.scalarPipeline[3].instruction;
      this.scalarPipeline[3].instruction = this.scalarPipeline[2].instruction;
      this.scalarPipeline[2].instruction = this.scalarPipeline[1].instruction;
      this.scalarPipeline[1].instruction = this.scalarPipeline[0].instruction;
  
      this.scalarPipeline[0].instruction = threads[0].instructions[i].toString();
  
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    for (let i = 0; i < 5; i++) {
      this.scalarPipeline[4].instruction = this.scalarPipeline[3].instruction;
      this.scalarPipeline[3].instruction = this.scalarPipeline[2].instruction;
      this.scalarPipeline[2].instruction = this.scalarPipeline[1].instruction;
      this.scalarPipeline[1].instruction = this.scalarPipeline[0].instruction;
  
      this.scalarPipeline[0].instruction = '';
  
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  scalarIMT(): void {}

  scalarBMT(): void {}

  superscalar(): void {}

  superscalarIMT(): void {}

  superscalarBMT(): void {}

  superscalarSMT(): void {}
}

export class  Instruction {
  type: string;
  name: string;
  rd: string;
  rs1: string;
  rs2: string;
  imm: number;

  constructor(type: string, name: string, rd: string, rs1: string, rs2: string, imm: number) {
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
              return `${this.name} ${this.rd}, ${this.rs1}, ${this.rs2}`;
          case 'I':
              return `${this.name} ${this.rd}, ${this.imm}(${this.rs1})`;
          case 'S':
              return `${this.name} ${this.rs1}, ${this.rs2}(${this.imm})`;
          case 'B':
              return `${this.name} ${this.rs1}, ${this.rs2}, ${this.imm}`;
          case 'J':
              return `${this.name} ${this.rd}, ${this.imm}`;
          case 'F':
              return `${this.name} ${this.rd}, ${this.rs1}, ${this.rs2}`;
          default:
              return '';
      }
  }
}

export class  Thread {
  instructions: Instruction[];

  constructor(instructions: Instruction[]) {
      this.instructions = instructions;
  }

  toString(): string {
      return this.instructions.map(instruction => instruction.toString()).join('\n');
  }
}
