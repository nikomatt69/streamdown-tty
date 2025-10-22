declare module 'asciichart' {
  export interface PlotConfig {
    height?: number;
    width?: number;
    colors?: string[];
    format?: (x: number, i: number) => string;
  }

  export function plot(values: number[] | number[][], config?: PlotConfig): string;
}