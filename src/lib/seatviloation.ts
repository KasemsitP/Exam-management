// ⭐️ (FIX 1: Export Interfaces)
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

// (Interface ใหม่สำหรับผลลัพธ์สุดท้าย)
export interface AllocationWithSeatCode extends Allocation {
  roomCode: string;
  seatCode: string;
}

export interface Violation {
  row: number;
  col: number;
  message: string;
}

/**
 * (ตรวจจับ Family Violations)
 */
export function detectFamilyViolations(
  allocations: Allocation[],
  totalSeats: number,
  columns: number
): Violation[] {
  const rows = Math.ceil(totalSeats / columns);
  const grid: (Allocation | null)[][] = Array.from({ length: rows }, () =>
    Array(columns).fill(null)
  );
  for (const a of allocations) {
    if (a.row < rows && a.col < columns) {
      grid[a.row][a.col] = a;
    }
  }

  const violations: Violation[] = [];
  const deltas = [
    [-1, 0], // (บน)
    [1, 0], // (ล่าง)
    [0, -1], // (ซ้าย)
    [0, 1], // (ขวา)
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const current = grid[r][c];
      if (!current) continue; // (ที่นั่งว่าง)

      for (const [dr, dc] of deltas) {
        const nr = r + dr;
        const nc = c + dc;

        // (เช็คว่า (nr, nc) อยู่ใน Grid)
        if (nr >= 0 && nr < rows && nc >= 0 && nc < columns) {
          const neighbor = grid[nr][nc];
          
          if (neighbor && neighbor.familyGroup === current.familyGroup) {
            violations.push({
              row: r,
              col: c,
              message: `Violation: นั่งติดกับ Family ${current.familyGroup} (ที่ ${nr}, ${nc})`,
            });
            break; // (เจอ Violation ที่ที่นั่งนี้แล้ว ไปที่นั่งถัดไป)
          }
        }
      }
    }
  }
  return violations;
}