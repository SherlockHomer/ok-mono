export function stringToHex(str: string): string {
  const hexString = Array.from(str)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
  return '0x' + hexString;
}
