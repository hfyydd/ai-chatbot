import dynamic from 'next/dynamic';

// 动态导入 Plotly 组件以避免 SSR 问题
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });
interface PlotlyProps {
  figData: string;
}

export function Plotly({ figData }: PlotlyProps) {
  const parsedData = JSON.parse(figData);
  
  return (
    <Plot
      data={parsedData.data}
      layout={parsedData.layout}
      style={{ width: '100%', height: '400px' }}
    />
  );
}
