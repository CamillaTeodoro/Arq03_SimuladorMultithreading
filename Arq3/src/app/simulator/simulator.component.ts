import { Component } from '@angular/core';

@Component({
  selector: 'app-simulator',
  templateUrl: './simulator.component.html',
  styleUrls: ['./simulator.component.scss']
})
export class SimulatorComponent {

  NUM_THREADS = 4;
  THREAD_SIZE = 5;
  BLOCK_SIZE = 5;

  selectedOption: string = '0';

  displayedColumns: string[] = ['Stage', 'Instruction'];
  scalarPipeline = [
    {stage: 'IF',  instruction: Instruction.null()},
    {stage: 'ID',  instruction: Instruction.null()},
    {stage: 'EX',  instruction: Instruction.null()},
    {stage: 'MEM', instruction: Instruction.null()},
    {stage: 'WB',  instruction: Instruction.null()}
  ];

  bubbleCount = 0;
  instructionsCount = 0;
  cycleCount = 0;
  CPI = 0;
  IPC = 0;

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

  getRandomRegister(threadName: string): string {    
    if (this.selectedOption === 'scalar' || this.selectedOption === 'superscalar') {
      return 'R' + Math.floor(Math.random() * 32);

    } else {
      let base = 0;
      switch(threadName) {
        case 'T1': base = 0;  break;
        case 'T2': base = 8;  break;
        case 'T3': base = 16; break;
        case 'T4': base = 24; break;
      }
      return 'R' + (Math.floor(Math.random() * 8) + base);
    }
  }

  getRandomImmediate(): number {
    return Math.floor(Math.random() * 1000);
  }

  generateInstruction(threadName: string): Instruction {
    const name = this.getRandomInstructionName();
    const rd = this.getRandomRegister(threadName);
    const rs1 = this.getRandomRegister(threadName);
    const rs2 = this.getRandomRegister(threadName);
    const imm = this.getRandomImmediate();

    if (['ADD', 'SUB', 'AND', 'OR', 'XOR', 'SLL', 'SRL', 'SRA', 'SLT', 'SLTU', 'MUL', 'MULH', 'MULHSU', 'MULHU', 'DIV', 'DIVU', 'REM', 'REMU'].includes(name)) {
        return new Instruction(threadName, 'R', name, rd, rs1, rs2, 0);

    } else if (['LB', 'LH', 'LW', 'LBU', 'LHU'].includes(name)) {
        return new Instruction(threadName, 'I', name, rd, rs1, '', imm);

    } else if (['SB', 'SH', 'SW'].includes(name)) {
        return new Instruction(threadName, 'S', name, '', rs1, rs2, imm);

    } else if (['BEQ', 'BNE', 'BLT', 'BGE', 'BLTU', 'BGEU'].includes(name)) {
        return new Instruction(threadName, 'B', name, '', rs1, rs2, imm);

    } else if (name === 'JAL') {
        return new Instruction(threadName, 'J', name, rd, '', '', imm);

    } else if (name === 'JALR') {
        return new Instruction(threadName, 'I', name, rd, rs1, '', imm);
        
    } else {
        return new Instruction(threadName, 'F', name, rd, rs1, rs2, 0);
    }
  }

  generateInstructions(n: number, threadName: string): Instruction[] {
    let instructions: Instruction[] = [];
    for (let i = 0; i < n; i++) {
        const instruction = this.generateInstruction(threadName);
        instructions.push(instruction);
    }

    // Atualizar ultimas instrucoes como null
    switch (this.selectedOption) {

      case 'scalar':
      for (let i = 0; i < 5; i++) {
        const instruction = Instruction.null();
        instructions.push(instruction);
      }
      break;

      case 'scalarIMT':
        let i = threadName == 'T1' ? 2 : 1
        for(let j = 0; j < i; j++) {
          const instruction = Instruction.null();
          instructions.push(instruction);
        }
      break;

      case 'scalarBMT':
        if(threadName == 'T1') {
          for (let i = 0; i < 5; i++) {
            const instruction = Instruction.null();
            instructions.push(instruction);
          }
        }
      break;

      case 'superscalar':    this.superscalar();    break;
      case 'superscalarIMT': this.superscalarIMT(); break;
      case 'superscalarBMT': this.superscalarBMT(); break;
      case 'superscalarSMT': this.superscalarSMT(); break;
      default : console.log('error');
    }
    return instructions;
  }

  generateThreads(n: number, length: number): Thread[] {
    const threads: Thread[] = [];
    for (let i = 1; i <= n; i++) {
        const threadName = `T${i}`;
        const instructions = this.generateInstructions(length, threadName);
        const thread = new Thread(instructions, threadName);
        threads.push(thread);
    }
    return threads;
  }

  start(): void {
    switch (this.selectedOption) {
      case 'scalar':         this.scalar();         break;
      case 'scalarIMT':      this.scalarIMT();      break;
      case 'scalarBMT':      this.scalarBMT();      break;
      case 'superscalar':    this.superscalar();    break;
      case 'superscalarIMT': this.superscalarIMT(); break;
      case 'superscalarBMT': this.superscalarBMT(); break;
      case 'superscalarSMT': this.superscalarSMT(); break;
      default : console.log('error');
    }
  }

  async scalar(): Promise<void> {
    const threads = this.generateThreads(1, this.THREAD_SIZE);
    console.log(threads[0].toString());
  
    this.scalarPipeline.forEach(element => {
      element.instruction = Instruction.null();
    });
  
    for (let i = 0; i < threads[0].instructions.length; i++) {
      this.scalarPipeline[4].instruction = this.scalarPipeline[3].instruction;
      this.scalarPipeline[3].instruction = this.scalarPipeline[2].instruction;

      // Verificar dependencia verdadeira
      if(
        (this.scalarPipeline[1].instruction.rs1 != '' && this.scalarPipeline[1].instruction.rs2 != '') &&
        (this.scalarPipeline[4].instruction.rd == this.scalarPipeline[1].instruction.rs1 ||
         this.scalarPipeline[4].instruction.rd == this.scalarPipeline[1].instruction.rs2 ||
         this.scalarPipeline[3].instruction.rd == this.scalarPipeline[1].instruction.rs1 ||
         this.scalarPipeline[3].instruction.rd == this.scalarPipeline[1].instruction.rs2)
      )
      {
        // Bolha
        this.scalarPipeline[2].instruction = Instruction.null();
        this.bubbleCount++;
        i--;
      } else {
        this.scalarPipeline[2].instruction = this.scalarPipeline[1].instruction;
        this.scalarPipeline[1].instruction = this.scalarPipeline[0].instruction;
        this.scalarPipeline[0].instruction = threads[0].instructions[i];
      }
  
      await new Promise(resolve => setTimeout(resolve, 1000));

      if(this.scalarPipeline[4].instruction.name != '') {
        this.instructionsCount++;
      }
      
      if(i != threads[0].instructions.length-2) this.cycleCount++;

      this.CPI = this.instructionsCount != 0 ? this.cycleCount/this.instructionsCount : 0;
    }
  }

  async scalarIMT(): Promise<void> {
    const threads = this.generateThreads(this.NUM_THREADS, this.THREAD_SIZE);
    console.log(threads.toString());
  
    this.scalarPipeline.forEach(element => {
      element.instruction = Instruction.null();
    });
  
    for (let i = 0; i < threads[0].instructions.length; i++) {   // Considerando que todas threads têm mesmo tamanho
      for(let j = 0; j < this.NUM_THREADS; j++) {
        this.scalarPipeline[4].instruction = this.scalarPipeline[3].instruction;
        this.scalarPipeline[3].instruction = this.scalarPipeline[2].instruction;
        this.scalarPipeline[2].instruction = this.scalarPipeline[1].instruction;
        this.scalarPipeline[1].instruction = this.scalarPipeline[0].instruction;
        this.scalarPipeline[0].instruction = threads[j].instructions[i];

        await new Promise(resolve => setTimeout(resolve, 1000));
  
        if(this.scalarPipeline[4].instruction.name != '') {
          this.instructionsCount++;
        }

        if(i != threads[0].instructions.length-1) this.cycleCount++;
        else break;

        this.CPI = this.instructionsCount != 0 ? this.cycleCount/this.instructionsCount : 0;
      }
    }
  }

  async scalarBMT(): Promise<void> {
    const threads = this.generateThreads(this.NUM_THREADS, this.THREAD_SIZE);
    console.log(threads.toString());
  
    this.scalarPipeline.forEach(element => {
      element.instruction = Instruction.null();
    });

    let finishedSMT = false;
    let threadSize = threads[0].instructions.length/this.BLOCK_SIZE + 1;

    for (let i = 0; i < threadSize; i++) {   // Considerando que todas threads têm mesmo tamanho
      for(let j = 0; j < this.NUM_THREADS; j++) {

        if (!finishedSMT) {

          for(let k = 0; k < this.BLOCK_SIZE; k++) {

            this.scalarPipeline[4].instruction = this.scalarPipeline[3].instruction;
            this.scalarPipeline[3].instruction = this.scalarPipeline[2].instruction;

            // Verificar dependencia verdadeira
            if(
              (this.scalarPipeline[1].instruction.rs1 != '' && this.scalarPipeline[1].instruction.rs2 != '') &&
              (this.scalarPipeline[4].instruction.rd == this.scalarPipeline[1].instruction.rs1 ||
               this.scalarPipeline[4].instruction.rd == this.scalarPipeline[1].instruction.rs2 ||
               this.scalarPipeline[3].instruction.rd == this.scalarPipeline[1].instruction.rs1 ||
               this.scalarPipeline[3].instruction.rd == this.scalarPipeline[1].instruction.rs2)
            )
            {
              // Bolha
              this.scalarPipeline[2].instruction = Instruction.null();
              this.bubbleCount++;
              k--;
            } else {
              this.scalarPipeline[2].instruction = this.scalarPipeline[1].instruction;
              this.scalarPipeline[1].instruction = this.scalarPipeline[0].instruction;
              this.scalarPipeline[0].instruction = threads[j].instructions[i*this.BLOCK_SIZE+k];
            }
        
            await new Promise(resolve => setTimeout(resolve, 1000));

            if(this.scalarPipeline[4].instruction.name != '') {
              this.instructionsCount++;
            }
            
            if(i != threadSize-1) this.cycleCount++;

            this.CPI = this.instructionsCount != 0 ? this.cycleCount/this.instructionsCount : 0;
          }

          finishedSMT = i==threadSize-1 ? true : false;
        }
      }
    }
  }

  superscalar(): void {}

  superscalarIMT(): void {}

  superscalarBMT(): void {}

  superscalarSMT(): void {}
}

export class Instruction {
  threadName: string;
  type: string;
  name: string;
  rd: string;
  rs1: string;
  rs2: string;
  imm: number;

  constructor(threadName: string, type: string, name: string, rd: string, rs1: string, rs2: string, imm: number) {
      this.threadName = threadName;
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
    return new Instruction('', '', '', '', '', '', -1);
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