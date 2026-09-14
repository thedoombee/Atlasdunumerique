import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...entrees) {
  return twMerge(clsx(entrees))
}
