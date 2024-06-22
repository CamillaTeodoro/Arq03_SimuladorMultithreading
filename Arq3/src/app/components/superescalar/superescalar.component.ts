import { Component, Input,  ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';


export class InstructionResult {
  IPC: number = 0; 
  Bolhas: number = 0;
  Ciclos: number = 0;
  Instrucoes: number = 0;
}
@Component({
  selector: 'app-superescalar',
  templateUrl: './superescalar.component.html',
  styleUrls: ['./superescalar.component.scss']
})
export class SuperescalarComponent {

  NUM_THREADS = 4;
  THREAD_SIZE = 20;
  BLOCK_SIZE = 5;

  THREADS_PER_CORE = 2;

  @Input() tipo: string = "";
  constructor(private cdRef: ChangeDetectorRef) {}
 
  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }

  displayedColumns: string[] = ['#', 'ID', 'JANELA', 'EX', 'WB']; 
  pipelineHistory: SuperScalarPipeline[] = SuperScalarPipeline.getNullArray(120);
  dataSource = new MatTableDataSource<SuperScalarPipeline>(this.pipelineHistory);
  actualLine = 1;

  displayedColumns2: string[] = ['name', 'result'];
  results = new InstructionResult();
  dataSource2 = new MatTableDataSource<{ name: string; result: number }>(
    this.getResultsArray()
  );

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

      case 'SMT':
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
      case 'SMT':  this.SMT();  break;
      default : console.log('error');
    }
  }

  async base(): Promise<void> {
    const threads = this.generateThreads(1, this.THREAD_SIZE);

    console.log(threads[0]);

    let IDSize = 5;
    let JANELASize = 5;
    let EXSize = 3;  // Fixo 3 Unidades Funcionais
    let WBSize = 8;

    this.pipelineHistory.forEach(element => {
      element.ID = Instruction.nullArray(IDSize);
      element.JANELA = Instruction.nullArray(JANELASize);
      element.EX = [
        new FunctionalUnit('ULA', 4),
        new FunctionalUnit('Desvio', 2),
        new FunctionalUnit('Memória', 2)
      ];
      element.WB = Instruction.nullArray(WBSize);
    });

    let instructionIndex = 0;
    while (instructionIndex < threads[0].instructions.length) {

      // Finalizar instrucoes em WB
      for(let j = 0; j < WBSize; j++) {
        this.pipelineHistory[this.actualLine].WB[j] = Instruction.null();
      }

      // Mover instrucoes de EX para WB
      let nextWBIndex = 0;

      for(let j = 0; j < EXSize; j++) {
        let currentFunctionalUnit = this.pipelineHistory[this.actualLine-1].EX[j];

        // Move todas as instruções da unidade funcional atual para WB
        for(let index = 0; index < currentFunctionalUnit.ocupation; index++) {
          this.pipelineHistory[this.actualLine].WB[nextWBIndex++] = currentFunctionalUnit.instructions[index];
        }
        currentFunctionalUnit.clear();
      }

      // Mover da Janela para a EX
      let janelaIndex = 0;
      for(let j = 0; j < JANELASize; j++) {
        let instruction = this.pipelineHistory[this.actualLine-1].JANELA[j];

        // Inserir nas Unidades Funcionais
        let hasInsert = this.pipelineHistory[this.actualLine].updateExecution(instruction);
        
        // Se nao tinha espaco livre para aquela instrucao, repetir na janela de novo
        if (!hasInsert && instruction.name !== '') {
          this.pipelineHistory[this.actualLine].JANELA[janelaIndex++] = instruction;
        }
      }

      // Mover do ID para a janela
      let IDIndex = 0;

      // TODO: Verificar Dependencia

      // Enquanto tiver espaco livre na janela
      while(janelaIndex < JANELASize && IDIndex < IDSize) {
        let instruction = this.pipelineHistory[this.actualLine-1].ID[IDIndex++];

        if (instruction.name !== '') {
          this.pipelineHistory[this.actualLine].JANELA[janelaIndex++] = instruction;
        }
      }

      // Se sobrou instrucao copiar e manter em ID
      let newIDIndex = 0;

      while(IDIndex < IDSize) {
        let instruction = this.pipelineHistory[this.actualLine-1].ID[IDIndex++];

        if (instruction.name !== '') {
          this.pipelineHistory[this.actualLine].ID[newIDIndex++] = instruction;
        }
      }

      // Preencher estagio ID
      while(newIDIndex < IDSize && instructionIndex < threads[0].instructions.length) {
        let instruction = threads[0].instructions[instructionIndex++];

        this.pipelineHistory[this.actualLine].ID[newIDIndex++] = instruction;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

    //   if(i != threads[0].instructions.length-2) {
    //     this.results.Ciclos++;
    //   }

    //   this.pipelineHistory[this.actualLine].WB = this.pipelineHistory[this.actualLine-1].MEM;
    //   this.pipelineHistory[this.actualLine].MEM = this.pipelineHistory[this.actualLine-1].EX;

    //   // Verificar dependencia verdadeira
    //   if(
    //     (this.pipelineHistory[this.actualLine-1].ID.rs1 != '' && this.pipelineHistory[this.actualLine-1].ID.rs2 != '') &&
    //     (this.pipelineHistory[this.actualLine].WB.rd  == this.pipelineHistory[this.actualLine-1].ID.rs1 ||
    //      this.pipelineHistory[this.actualLine].WB.rd  == this.pipelineHistory[this.actualLine-1].ID.rs2 ||
    //      this.pipelineHistory[this.actualLine].MEM.rd == this.pipelineHistory[this.actualLine-1].ID.rs1 ||
    //      this.pipelineHistory[this.actualLine].MEM.rd == this.pipelineHistory[this.actualLine-1].ID.rs2)
    //   )
    //   {
    //     // Bolha
    //     this.pipelineHistory[this.actualLine].EX = Instruction.bubble(threads[0].name);
    //     this.pipelineHistory[this.actualLine].ID = this.pipelineHistory[this.actualLine-1].ID;
    //     this.pipelineHistory[this.actualLine].IF = this.pipelineHistory[this.actualLine-1].IF;              
    //     this.results.Bolhas++;
    //     i--;
    //   } else {
    //     this.pipelineHistory[this.actualLine].EX = this.pipelineHistory[this.actualLine-1].ID;
    //     this.pipelineHistory[this.actualLine].ID = this.pipelineHistory[this.actualLine-1].IF;
    //     this.pipelineHistory[this.actualLine].IF = threads[0].instructions[i];
    //   }
  
    //   if(this.pipelineHistory[this.actualLine].WB.name != '') {
    //     this.results.Instrucoes++;
    //   }

    //   this.actualLine++;
    //   this.results.CPI = this.results.Instrucoes != 0 ? this.results.Ciclos/this.results.Instrucoes : 0;
    //   this.dataSource2.data = this.getResultsArray();
    }
  }

  // async base(): Promise<void> {
  //   const threads = this.generateThreads(1, this.THREAD_SIZE);
  //   console.log(threads);
  
  //   this.pipelineHistory.forEach((element) => {
  //     element.Pipeline1.IF = Instruction.null();
  //     element.Pipeline1.ID = Instruction.null();
  //     element.Pipeline1.EX = Instruction.null();
  //     element.Pipeline1.MEM = Instruction.null();
  //     element.Pipeline1.WB = Instruction.null();

  //     element.Pipeline2.IF = Instruction.null();
  //     element.Pipeline2.ID = Instruction.null();
  //     element.Pipeline2.EX = Instruction.null();
  //     element.Pipeline2.MEM = Instruction.null();
  //     element.Pipeline2.WB = Instruction.null();
  //   });

  //   let instructionQueue = [...threads[0].instructions]; 
  //   let pipelineStalled = false;
  
  //   for (
  //     let i = 0;
  //     i < instructionQueue.length + this.THREADS_PER_CORE - 1;
  //     i++
  //   ) {
  //     if (i != threads[0].instructions.length - 2) {
  //       this.results.Ciclos++;
  //     }

  //     // WB
  //     this.pipelineHistory[this.actualLine].Pipeline1.WB =
  //       this.pipelineHistory[this.actualLine - 1].Pipeline1.MEM;
  //     this.pipelineHistory[this.actualLine].Pipeline2.WB =
  //       this.pipelineHistory[this.actualLine - 1].Pipeline2.MEM;

  //     // MEM
  //     this.pipelineHistory[this.actualLine].Pipeline1.MEM =
  //       this.pipelineHistory[this.actualLine - 1].Pipeline1.EX;
  //     this.pipelineHistory[this.actualLine].Pipeline2.MEM =
  //       this.pipelineHistory[this.actualLine - 1].Pipeline2.EX;

  //     // EX
  //     this.pipelineHistory[this.actualLine].Pipeline1.EX =
  //       this.pipelineHistory[this.actualLine - 1].Pipeline1.ID;
  //     this.pipelineHistory[this.actualLine].Pipeline2.EX =
  //       this.pipelineHistory[this.actualLine - 1].Pipeline2.ID;

  //     // ID
  //     this.pipelineHistory[this.actualLine].Pipeline1.ID =
  //       this.pipelineHistory[this.actualLine - 1].Pipeline1.IF;
  //     this.pipelineHistory[this.actualLine].Pipeline2.ID =
  //       this.pipelineHistory[this.actualLine - 1].Pipeline2.IF;

  //     // IF
  //     if (!pipelineStalled && instructionQueue.length > 0) {
  //       this.pipelineHistory[this.actualLine].Pipeline1.IF =
  //         instructionQueue.shift()!;
  //     }
  //     if (
  //       !pipelineStalled &&
  //       instructionQueue.length > 0 &&
  //       this.checkDependency(
  //         this.pipelineHistory[this.actualLine].Pipeline1.IF,
  //         this.pipelineHistory[this.actualLine].Pipeline2.ID
  //       )
  //     ) {
  //       this.pipelineHistory[this.actualLine].Pipeline2.IF =
  //         instructionQueue.shift()!;
  //     } else {
  //       this.pipelineHistory[this.actualLine].Pipeline2.IF =
  //         Instruction.null();
  //     }

  //     // Verificar se há dados nos pipelines
  //     if (
  //       this.pipelineHistory[this.actualLine].Pipeline1.WB.name != '' ||
  //       this.pipelineHistory[this.actualLine].Pipeline2.WB.name != ''
  //     ) {
  //       this.results.Instrucoes++;
  //     }

  //     this.actualLine++;
  //     this.results.IPC =
  //       this.results.Instrucoes != 0
  //         ? this.results.Ciclos / this.results.Instrucoes
  //         : 0;
  //     this.dataSource2.data = this.getResultsArray();

  //     await new Promise((resolve) => setTimeout(resolve, 1000));
  //   }
  // }

  // Função para verificar dependência entre instruções
 checkDependency(instruction1: Instruction, instruction2: Instruction): boolean {
  // Verifica se as instruções são válidas (não nulas)
  if (!instruction1 || !instruction2) {
    return true; // Não há dependência se uma das instruções for nula
  }

  // Verifica dependência de dados
  if (
    instruction1.rs1 === instruction2.rd ||
    instruction1.rs2 === instruction2.rd
  ) {
    return false; // Existe dependência
  }

  return true; // Não existe dependência
}

  async IMT(): Promise<void> {
  //   const threads = this.generateThreads(this.NUM_THREADS, this.THREAD_SIZE);
  
  //   this.pipelineHistory.forEach(element => {
  //     element.IF = Instruction.null();
  //     element.ID = Instruction.null();
  //     element.EX = Instruction.null();
  //     element.MEM = Instruction.null();
  //     element.WB = Instruction.null();
  //   });
  
  //   for (let i = 0; i < threads[0].instructions.length; i++) {   // Considerando que todas threads têm mesmo tamanho
  //     for(let j = 0; j < this.NUM_THREADS; j++) {

  //       if(i != threads[0].instructions.length-1) {
  //         this.results.Ciclos++;
  //         this.dataSource2.data = this.getResultsArray();
  //       } else break;

  //       this.pipelineHistory[this.actualLine].WB = this.pipelineHistory[this.actualLine-1].MEM;
  //       this.pipelineHistory[this.actualLine].MEM = this.pipelineHistory[this.actualLine-1].EX;
  //       this.pipelineHistory[this.actualLine].EX = this.pipelineHistory[this.actualLine-1].ID;
  //       this.pipelineHistory[this.actualLine].ID = this.pipelineHistory[this.actualLine-1].IF;
  //       this.pipelineHistory[this.actualLine].IF = threads[j].instructions[i];

  //       if(this.pipelineHistory[this.actualLine].WB.name != '') {
  //         this.results.Instrucoes++;
  //       }

  //       this.actualLine++;
  //       this.results.IPC = this.results.Instrucoes != 0 ? this.results.Ciclos/this.results.Instrucoes : 0;
  //       this.dataSource2.data = this.getResultsArray();

  //       await new Promise(resolve => setTimeout(resolve, 1000));
  //     }
  //   }
  }

  async BMT(): Promise<void> {
  //   const threads = this.generateThreads(this.NUM_THREADS, this.THREAD_SIZE);
  
  //   this.pipelineHistory.forEach(element => {
  //     element.IF = Instruction.null();
  //     element.ID = Instruction.null();
  //     element.EX = Instruction.null();
  //     element.MEM = Instruction.null();
  //     element.WB = Instruction.null();
  //   });

  //   let finishedSMT = false;
  //   let threadSize = threads[0].instructions.length/this.BLOCK_SIZE;

  //   console.log(threadSize)

  //   for (let i = 0; i < threadSize; i++) {   // Considerando que todas threads têm mesmo tamanho
  //     for(let j = 0; j < this.NUM_THREADS; j++) {

  //       if (!finishedSMT) {

  //         finishedSMT = i==threadSize-1 ? true : false;

  //         for(let k = 0; k < this.BLOCK_SIZE; k++) {

  //           if(!finishedSMT || k !== this.BLOCK_SIZE-1) {
  //             this.results.Ciclos++;
  //             this.dataSource2.data = this.getResultsArray(); 
  //           }

  //           this.pipelineHistory[this.actualLine].WB = this.pipelineHistory[this.actualLine-1].MEM;
  //           this.pipelineHistory[this.actualLine].MEM = this.pipelineHistory[this.actualLine-1].EX;

  //           // Verificar dependencia verdadeira
  //           if(
  //             (this.pipelineHistory[this.actualLine-1].ID.rs1 != '' && this.pipelineHistory[this.actualLine-1].ID.rs2 != '') 
              
  //             &&
  //             ((this.pipelineHistory[this.actualLine].WB.rd  == this.pipelineHistory[this.actualLine-1].ID.rs1 ||
  //               this.pipelineHistory[this.actualLine].WB.rd  == this.pipelineHistory[this.actualLine-1].ID.rs2) && 
  //               (this.pipelineHistory[this.actualLine].WB.threadName == this.pipelineHistory[this.actualLine-1].ID.threadName)
               
  //              ||
      
  //              (this.pipelineHistory[this.actualLine].MEM.rd  == this.pipelineHistory[this.actualLine-1].ID.rs1 ||
  //               this.pipelineHistory[this.actualLine].MEM.rd  == this.pipelineHistory[this.actualLine-1].ID.rs2) && 
  //               (this.pipelineHistory[this.actualLine].MEM.threadName == this.pipelineHistory[this.actualLine-1].ID.threadName)
  //             )
  //           )
  //           {
  //             // Bolha
  //             this.pipelineHistory[this.actualLine].EX = Instruction.bubble(this.pipelineHistory[this.actualLine-1].ID.threadName);
  //             this.pipelineHistory[this.actualLine].ID = this.pipelineHistory[this.actualLine-1].ID;
  //             this.pipelineHistory[this.actualLine].IF = this.pipelineHistory[this.actualLine-1].IF;              
  //             this.results.Bolhas++;
  //             k--;
  //           } else {
  //             this.pipelineHistory[this.actualLine].EX = this.pipelineHistory[this.actualLine-1].ID;
  //             this.pipelineHistory[this.actualLine].ID = this.pipelineHistory[this.actualLine-1].IF;
  //             this.pipelineHistory[this.actualLine].IF = threads[j].instructions[i*this.BLOCK_SIZE+k];
  //           }
        
  //           if(this.pipelineHistory[this.actualLine].WB.name !== '') {
  //             this.results.Instrucoes++;
  //           }
            
  //           this.actualLine++;
  //           this.results.IPC = this.results.Instrucoes != 0 ? this.results.Ciclos/this.results.Instrucoes : 0;
  //           this.dataSource2.data = this.getResultsArray();

  //           await new Promise(resolve => setTimeout(resolve, 1000));
  //         }

  //         console.log(finishedSMT);
  //       }
  //     }
  //   }
  }

  async SMT(): Promise<void> {}
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

  static nullArray(n: number): Instruction[] {
    return Array.from({length: n}, () => new Instruction('', 'transparent', '', '', '', '', '', -1));
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

export class FunctionalUnit {
  name: string;
  instructions: (Instruction)[];
  capacity: number;
  ocupation: number;

  constructor(name: string, capacity: number) {
    this.name = name;
    this.instructions = new Array(capacity).fill(Instruction.null());
    this.capacity = capacity;
    this.ocupation = 0;
  }

  isFull(): boolean {
    return this.capacity === this.ocupation;
  }

  insert(instruction: Instruction): boolean {
    if (this.isFull()) {
      return false;
    }
    this.instructions[this.ocupation++] = instruction;
    return true;
  }

  clear(): void {
    this.instructions.splice(0, this.instructions.length, ...(new Array(this.capacity).fill(Instruction.null())));
    this.ocupation = 0;
  }
}

export class SuperScalarPipeline {
  ID: Instruction[];
  JANELA: Instruction[];
  EX: FunctionalUnit[];
  WB: Instruction[];

  constructor() {
    this.ID = Instruction.nullArray(5);
    this.JANELA = Instruction.nullArray(5);
    this.EX = [
      new FunctionalUnit('ULA', 4),
      new FunctionalUnit('Desvio', 2),
      new FunctionalUnit('Memória', 2)
    ];
    this.WB = Instruction.nullArray(8);
  }

  static getNullArray(n: number): SuperScalarPipeline[] {
    let pipelines = new Array<SuperScalarPipeline>();
    for(let i = 0; i < n; i++) {
      pipelines.push(new SuperScalarPipeline())
    }
    return pipelines;
  }

  updateExecution(instruction: Instruction): boolean {

    // Instrucao null
    if(instruction.name === '') return false;
  
    const aluInstructions = new Set(['ADD', 'SUB', 'AND', 'OR', 'XOR', 'SLL', 'SRL', 'SRA','SLT', 'SLTU',   // ULA
    'MUL', 'MULH', 'MULHSU', 'MULHU', 'DIV', 'DIVU', 'REM', 'REMU']);
    const branchInstructions = new Set(['BEQ', 'BNE', 'BLT', 'BGE', 'BLTU', 'BGEU', 'JAL', 'JALR']);
    const memInstructions = new Set(['LB', 'LH', 'LW', 'LBU', 'LHU', 'SB', 'SH', 'SW']);

    if (aluInstructions.has(instruction.name)) {
      return this.EX[0].insert(instruction);

    } else if (branchInstructions.has(instruction.name)) {
      return this.EX[1].insert(instruction)

    } else if (memInstructions.has(instruction.name)) {
      return this.EX[2].insert(instruction)

    } else {
      return false;
    }
  }
}