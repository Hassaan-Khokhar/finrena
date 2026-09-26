'use client';

import ReactECharts from 'echarts-for-react';
import { MonteCarloSimulationData } from '../../types/arena';
import { useMemo, useEffect, useRef } from 'react';

export function MonteCarloChart({ data }: { data: MonteCarloSimulationData | null }) {
  const option = useMemo(() => {
    if (!data) return {};

    const baseLineColor = 'rgba(6, 182, 212, 0.07)'; // cyan-500 with calibrated opacity
    const meanLineColor = '#06b6d4'; // cyan-500

    // Sample ~80 representative paths evenly across the 500 stochastic paths.
    // This preserves the exact probability envelope and fan density while
    // cutting canvas draw calls and geometry computation by over 80% for 60/120fps fluid transitions.
    const step = Math.max(1, Math.floor(data.paths.length / 80));
    const sampledPaths = data.paths.filter((_, index) => index % step === 0);

    const seriesData = sampledPaths.map((path) => ({
      type: 'line',
      data: path,
      lineStyle: {
        width: 1,
        color: baseLineColor,
      },
      symbol: 'none',
      animation: false,
    }));

    // Add confidence intervals as a filled area
    seriesData.push({
      type: 'line',
      data: data.confidence95Upper,
      lineStyle: { opacity: 0 },
      symbol: 'none',
      animation: false,
    } as any);

    seriesData.push({
      type: 'line',
      data: data.confidence95Lower,
      lineStyle: { opacity: 0 },
      areaStyle: {
        color: 'rgba(6, 182, 212, 0.1)', // cyan glow area
      },
      symbol: 'none',
      animation: false,
    } as any);

    // Mean Path
    seriesData.push({
      type: 'line',
      data: data.meanPath,
      lineStyle: {
        width: 2,
        color: meanLineColor,
        type: 'dashed',
      },
      symbol: 'none',
      animation: false,
    } as any);

    return {
      backgroundColor: 'transparent',
      animation: false,
      animationDurationUpdate: 0,
      textStyle: {
        fontFamily: '"Geist Mono", monospace',
      },
      grid: {
        top: 36,
        right: 16,
        bottom: 24,
        left: 10,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.timeSteps.map(t => t.substring(5)), // show MM-DD
        axisLine: { lineStyle: { color: 'rgba(39, 39, 42, 0.8)' } },
        axisLabel: { color: '#A1A1AA' },
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitLine: { lineStyle: { color: 'rgba(39, 39, 42, 0.4)' } },
        axisLabel: { color: '#A1A1AA' },
      },
      series: seriesData,
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#18181b', // zinc-900
        borderColor: '#27272a', // zinc-800
        textStyle: { color: '#f4f4f5' },
        formatter: function (params: any) {
          return `${params[0].name}<br/>Expected: $${data.meanPath[params[0].dataIndex].toFixed(2)}`;
        }
      },
    };
  }, [data]);

  const containerRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let resizeTimer: NodeJS.Timeout | null = null;

    // Debounce ResizeObserver during slide transitions so the browser GPU compositor
    // has 100% of the main thread for ultra-smooth 60/120fps motion.
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width >= 100 && height >= 50 && echartsRef.current) {
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            const instance = echartsRef.current?.getEchartsInstance?.();
            if (instance) {
              instance.resize({ width, height });
            }
          }, 80);
        }
      }
    });
    observer.observe(containerRef.current);

    // Immediate resize on window/animation-complete events
    const handleWindowResize = () => {
      if (echartsRef.current) {
        echartsRef.current.getEchartsInstance?.().resize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleWindowResize);
      observer.disconnect();
    };
  }, []);

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center text-zinc-500 font-mono text-sm">
        [MONTE CARLO ENGINE IDLE... WAITING FOR QUANT]
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      <ReactECharts
        ref={echartsRef}
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge={true}
      />
    </div>
  );
}
