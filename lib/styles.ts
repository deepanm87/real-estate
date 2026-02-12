export const colorVariants = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/20 text-secondary",
  success: "bg-green-500/10 text-green-600",
  warning: "bg-amber-500/10 text-amber-600",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground"
} as const

export type ColorVariant = keyof typeof colorVariants

export function getColorVariant(variant: ColorVariant): string {
  return colorVariants[variant]
}