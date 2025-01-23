import { Markdown } from './markdown';

export function Think({result}: {result: any}) {
    // 检查是否是 think 内容
    console.log("result", result);
    if (typeof result === 'string' && result.includes('<think>')) {
        const thinkContent = result.match(/<think>(.*?)<\/think>/s)?.[1] || '';
        const otherContent = result.replace(/<think>.*?<\/think>/s, '');
        console.log("thinkContent", thinkContent);
        console.log("otherContent", otherContent);
        return (
            <>
                <div className="think-content" style={{
                    padding: '1rem',
                    margin: '1rem 0',
                    backgroundColor: '#fafafa',
                    borderLeft: '2px solid #999',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    color: '#666'
                }}>
                    {thinkContent.trim()}
                </div>
                {otherContent && <Markdown>{otherContent.trim()}</Markdown>}
            </>
        );
    }
    
    // 非 think 内容保持原样输出
    return <Markdown>{result as string}</Markdown>
}