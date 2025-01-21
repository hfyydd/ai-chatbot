import dynamic from 'next/dynamic';

// 动态导入 Plotly 组件以避免 SSR 问题
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });
interface PlotlyProps {
  figData: string | object;
}

export function Plotly({ figData }: PlotlyProps) {
  try {
    let parsedData;
    console.log("figData data:", figData);
    
    // 如果 figData 是字符串，尝试解析；如果解析失败，返回空对象
    if (typeof figData === 'string') {
      try {
        parsedData = JSON.parse(figData);
      } catch {
        console.error('Invalid JSON string:', figData);
        return <div>图表数据格式错误</div>;
      }
    } else {
      parsedData = figData;
    }

    
    
    if (!parsedData?.data || !parsedData?.layout) {
      console.error('Invalid plot data structure:', parsedData);
      return <div>图表数据格式错误</div>;
    }

    return (
      <Plot
        data={parsedData.data}
        layout={parsedData.layout}
        style={{ width: '100%', height: '400px' }}
      />
    );
  } catch (error) {
    console.error('fig error',figData)
    console.error('Failed to parse plot data:', error);
    return <div>无法加载图表</div>;
  }
}
