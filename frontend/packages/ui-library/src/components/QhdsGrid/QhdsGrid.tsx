import type { HTMLAttributes, ReactNode } from "react";

type QhdsGridColumnSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface QhdsContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  fluid?: boolean;
}

export interface QhdsRowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface QhdsColProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  lg?: QhdsGridColumnSpan;
  md?: QhdsGridColumnSpan;
  sm?: QhdsGridColumnSpan;
  xl?: QhdsGridColumnSpan;
  xs?: QhdsGridColumnSpan;
}

export function QhdsContainer({ children, className, fluid = true, ...props }: QhdsContainerProps) {
  return (
    <div className={[fluid ? "container-fluid" : "container", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}

export function QhdsRow({ children, className, ...props }: QhdsRowProps) {
  return (
    <div className={["row", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}

export function QhdsCol({ children, className, lg, md, sm, xl, xs = 12, ...props }: QhdsColProps) {
  const classes = [
    `col-xs-${xs}`,
    sm ? `col-sm-${sm}` : undefined,
    md ? `col-md-${md}` : undefined,
    lg ? `col-lg-${lg}` : undefined,
    xl ? `col-xl-${xl}` : undefined,
    className
  ];

  return (
    <div className={classes.filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}
