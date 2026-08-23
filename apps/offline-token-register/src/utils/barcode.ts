// Barcode utilities for NETUM NT-1228BC scanner
// Works in HID/keyboard mode - scanner sends barcode as keyboard input

export interface BarcodeData {
  value: string
  type: 'student' | 'product' | 'unknown'
  timestamp: number
}

// Generate or validate barcode formats
export function generateStudentBarcode(studentId: number): string {
  // Format: STU + 8-digit zero-padded ID
  return `STU${String(studentId).padStart(8, '0')}`
}

export function generateProductBarcode(productId: number): string {
  // Format: PRD + 8-digit zero-padded ID
  return `PRD${String(productId).padStart(8, '0')}`
}

export function parseBarcode(raw: string): BarcodeData {
  const value = raw.trim().toUpperCase()
  const timestamp = Date.now()

  if (value.startsWith('STU')) {
    return { value, type: 'student', timestamp }
  }

  if (value.startsWith('PRD')) {
    return { value, type: 'product', timestamp }
  }

  return { value, type: 'unknown', timestamp }
}

export function isStudentBarcode(barcode: string): boolean {
  return barcode.trim().toUpperCase().startsWith('STU')
}

export function isProductBarcode(barcode: string): boolean {
  return barcode.trim().toUpperCase().startsWith('PRD')
}

export function extractIdFromBarcode(barcode: string): number | null {
  const parsed = parseBarcode(barcode)
  
  if (parsed.type === 'unknown') return null

  const idPart = parsed.value.substring(3)
  const id = parseInt(idPart, 10)

  return isNaN(id) ? null : id
}

// Validate barcode format
export function isValidBarcode(barcode: string): boolean {
  const parsed = parseBarcode(barcode)
  return parsed.type !== 'unknown' && extractIdFromBarcode(barcode) !== null
}

// Format barcode for display
export function formatBarcodeForDisplay(barcode: string): string {
  const parsed = parseBarcode(barcode)
  
  if (parsed.type === 'student') {
    const id = extractIdFromBarcode(barcode)
    return id ? `Student #${id}` : barcode
  }

  if (parsed.type === 'product') {
    const id = extractIdFromBarcode(barcode)
    return id ? `Product #${id}` : barcode
  }

  return barcode
}

// Barcode scanner state tracker
export class BarcodeBuffer {
  private buffer: string = ''
  private lastInputTime: number = 0
  private readonly timeout: number = 100 // 100ms timeout between characters

  addCharacter(char: string): boolean {
    const now = Date.now()
    
    // Reset if too much time has passed (means start of new barcode)
    if (now - this.lastInputTime > this.timeout && this.buffer.length > 0) {
      this.buffer = ''
    }

    this.lastInputTime = now

    if (char === '\n' || char === '\r') {
      // End of barcode
      const complete = this.buffer
      this.buffer = ''
      return true
    }

    this.buffer += char
    return false
  }

  getComplete(): string {
    return this.buffer
  }

  reset(): void {
    this.buffer = ''
  }

  isEmpty(): boolean {
    return this.buffer.length === 0
  }
}

// Checksum validation for barcodes (optional, for future use)
export function calculateChecksum(barcode: string): number {
  let sum = 0
  for (let i = 0; i < barcode.length; i++) {
    sum += barcode.charCodeAt(i)
  }
  return sum % 256
}

export function addChecksum(barcode: string): string {
  const checksum = calculateChecksum(barcode)
  return `${barcode}${String(checksum).padStart(3, '0')}`
}

export function validateChecksum(barcodeWithChecksum: string): boolean {
  if (barcodeWithChecksum.length < 4) return false

  const barcode = barcodeWithChecksum.slice(0, -3)
  const checksum = parseInt(barcodeWithChecksum.slice(-3), 10)

  return calculateChecksum(barcode) === checksum
}
