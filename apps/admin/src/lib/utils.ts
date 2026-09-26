import { cn } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function clsx(...inputs: (string | undefined | null | false)[]) {
  let str = '';
  for (let i = 0; i < inputs.length; i++) {
    const val = inputs[i];
    if (val) {
      if (str) str += ' ';
      str += val;
    }
  }
  return str;
}
