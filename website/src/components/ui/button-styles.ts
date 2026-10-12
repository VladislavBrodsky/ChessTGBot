export const buttonStyles = {
  primary: "site-button-primary",
  secondary: "site-button-secondary",
  soft: "site-button-soft",
  ghost: "site-button-ghost",
} as const;

export const buttonSizes = {
  sm: "site-button-sm",
  md: "site-button-md",
  lg: "site-button-lg",
} as const;

export function buttonClass(
  variant: keyof typeof buttonStyles = "primary",
  className = "",
  size: keyof typeof buttonSizes = "md"
) {
  return `site-button relative overflow-hidden ${buttonSizes[size]} ${buttonStyles[variant]} ${className}`;
}
