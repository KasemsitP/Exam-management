
export interface Student {
  id: number | string;
  familyGroup: number | string;
}

export interface Allocation {
  studentId: number | string;
  familyGroup: number | string;
  row: number;
  col: number;
}


function createPRNG(seed: number) {
  let a = seed | 0;
  let b = (seed << 16) | (seed >>> 16);
  let c = (seed << 24) | (seed >>> 8);
  let d = (seed << 8) | (seed >>> 24);
  return function () {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function shuffle<T>(array: T[], random: () => number): T[] {
  let m = array.length, t: T, i: number;
  while (m) {
    i = Math.floor(random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}


export class ExamSeatAllocator {
  private random: () => number;
  private familyPrimes: number[];
  private primeIndex: number;
  private familyStartMap: Map<string | number, number>;

  constructor(
    seed: number,
    // (Prime numbers ที่เหมาะสำหรับการ Hashing)
    primes: number[] = [17, 29, 31, 43, 53, 61, 73, 89, 97, 101]
  ) {
    this.random = createPRNG(seed);
    this.familyPrimes = shuffle(primes, this.random);
    this.primeIndex = 0;
    this.familyStartMap = new Map();
  }

  /**
   * (วน Loop ใช้ Prime number)
   */
  private getNextPrime(): number {
    const prime = this.familyPrimes[this.primeIndex];
    this.primeIndex = (this.primeIndex + 1) % this.familyPrimes.length;
    return prime;
  }

  /**
   * หจุดเริ่มต้น (Start) และ ก้าว (Step) สำหรับ Family Group นี้
   */
  private getFamilyHash(
    familyGroup: string | number,
    totalSeats: number
  ): { start: number; step: number } {
    
    if (this.familyStartMap.has(familyGroup)) {
      const start = this.familyStartMap.get(familyGroup)!;
      return { start, step: this.getNextPrime() };
    }

    // (ถ้าเป็น Family ใหม่, สุ่มจุดเริ่ม และ Prime ใหม่)
    const start = Math.floor(this.random() * totalSeats);
    const step = this.getNextPrime();
    this.familyStartMap.set(familyGroup, start);
    return { start, step };
  }

  /**
   * (Logic การจัดที่นั่งหลัก)
   */
  public allocateSeats(
    students: Student[],
    totalSeats: number,
    columns: number
  ): Allocation[] {
    if (students.length > totalSeats) {
      throw new Error("จำนวนนักเรียน มากกว่าจำนวนที่นั่ง");
    }

    const grid: (Allocation | null)[][] = Array.from(
      { length: Math.ceil(totalSeats / columns) },
      () => Array(columns).fill(null)
    );
    
    const allocations: Allocation[] = [];
    const shuffledStudents = shuffle(students, this.random);

    // (ใช้ Set เพื่อติดตามที่นั่งที่ใช้ไปแล้ว)
    const occupiedSeats = new Set<number>();

    for (const student of shuffledStudents) {
      const { start, step } = this.getFamilyHash(student.familyGroup, totalSeats);
      let attempts = 0;
      let placed = false;

      while (attempts < totalSeats) {
        const seatIndex = (start + attempts * step) % totalSeats;
        attempts++;

        if (occupiedSeats.has(seatIndex)) {
          continue; // (ที่นั่งนี้ถูกใช้แล้ว, ลองที่ถัดไป)
        }

        // (คำนวณ Row/Col)
        const row = Math.floor(seatIndex / columns);
        const col = seatIndex % columns;

        // (สร้าง Allocation)
        const allocation: Allocation = {
          studentId: student.id,
          familyGroup: student.familyGroup,
          row,
          col,
        };

        // (บันทึก)
        grid[row][col] = allocation;
        allocations.push(allocation);
        occupiedSeats.add(seatIndex);
        placed = true;
        break; // (จัดคนนี้เสร็จแล้ว)
      }

      if (!placed) {
        // (กรณีนี้ไม่ควรเกิดขึ้น ถ้า students.length <= totalSeats)
        console.error(`ไม่สามารถจัดที่นั่งให้ ${student.id} (Family: ${student.familyGroup})`);
      }
    }

    return allocations;
  }
}