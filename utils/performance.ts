import React from "react";

/**
 * Performance tracking utility untuk monitoring dan debugging
 */
export class PerformanceTracker {
  private static timers: Map<string, number> = new Map();
  private static measurements: Map<string, number[]> = new Map();

  static startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  static endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) return 0;

    const duration = Date.now() - startTime;

    // Store measurement for analytics
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);

    // Only log in development
    if (__DEV__) {
      console.log(`⏱️ ${name}: ${duration}ms`);
    }

    this.timers.delete(name);
    return duration;
  }

  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(name);
    try {
      const result = await fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  static measure<T>(name: string, fn: () => T): T {
    this.startTimer(name);
    try {
      const result = fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  static getAverageTime(name: string): number {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return 0;

    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  static getPerformanceReport(): Record<
    string,
    { average: number; count: number; latest: number }
  > {
    const report: Record<
      string,
      { average: number; count: number; latest: number }
    > = {};

    for (const [name, measurements] of this.measurements.entries()) {
      if (measurements.length > 0) {
        const sum = measurements.reduce((a, b) => a + b, 0);
        report[name] = {
          average: Math.round(sum / measurements.length),
          count: measurements.length,
          latest: measurements[measurements.length - 1],
        };
      }
    }

    return report;
  }

  static clearMeasurements(): void {
    this.measurements.clear();
    this.timers.clear();
  }
}

/**
 * React hook untuk measuring component render time
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStart = Date.now();

  React.useEffect(() => {
    const renderTime = Date.now() - renderStart;
    if (__DEV__ && renderTime > 16) {
      // Only log if render > 16ms (60fps threshold)
      console.log(`🐌 Slow render: ${componentName} took ${renderTime}ms`);
    }
  });
}

/**
 * HOC untuk measuring component performance
 */
export function withPerformanceMonitor<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name =
    componentName ||
    Component.displayName ||
    Component.name ||
    "UnknownComponent";

  const WrappedComponent = React.memo((props: P) => {
    const renderStart = Date.now();

    React.useEffect(() => {
      const renderTime = Date.now() - renderStart;
      if (__DEV__ && renderTime > 16) {
        console.log(`🐌 Slow render: ${name} took ${renderTime}ms`);
      }
    });

    return React.createElement(Component, props);
  });

  WrappedComponent.displayName = `withPerformanceMonitor(${name})`;

  return WrappedComponent;
}
