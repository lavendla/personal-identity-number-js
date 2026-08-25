/**
 * Returns the check digit the given digits imply. Callers compare it to the
 * digit the number actually carries.
 */
export function luhn(digits: string): number {
  let sum = 0;

  for (let position = 0; position < digits.length; position += 1) {
    const value = Number(digits[position]) * (2 - (position % 2));
    sum += value > 9 ? value - 9 : value;
  }

  return Math.ceil(sum / 10) * 10 - sum;
}
