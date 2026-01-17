import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  // Deduplicate classes before merging
  const dedupedInputs = inputs.map(input => {
    if (typeof input === "string") {
      const classes = input.split(" ").filter(Boolean)
      return [...new Set(classes)].join(" ")
    }
    return input
  })
  
  return twMerge(clsx(dedupedInputs))
}
