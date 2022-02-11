export function formatAddressShort (addr: string = '???'): string {
  return `${addr.slice(0, 3).toUpperCase()}...${addr.slice(-3).toUpperCase()}`
}
