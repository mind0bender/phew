export function lineOfLength(line: number, symbol: string = "-"): string {
  return Array(line + 1).join(symbol);
}
