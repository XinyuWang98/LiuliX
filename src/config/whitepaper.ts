import { WhitepaperDoc } from '@/types/whitepaper';

/**
 * Whitepaper Navigation Structure
 * Corresponds to files in whitepaper/{lang}/
 */
export const whitepaperDocs: WhitepaperDoc[] = [
    {
        id: 'intro',
        title: 'whitepaper.nav.intro',
        path: 'README.md', // Updated to match actual file
        children: [
            {
                id: 'ollama-guide',
                title: 'whitepaper.nav.ollamaGuide',
                path: '01-新手教程-Ollama本地部署指南.md'
            },
            {
                id: 'api-key',
                title: 'whitepaper.nav.apiKey',
                path: '02-使用须知-APIKey说明与限制.md'
            },
            {
                id: 'data-sanitization',
                title: 'whitepaper.nav.dataSanitization',
                path: '03-隐私安全-数据脱敏策略说明.md'
            }
        ]
    },
    {
        id: 'architecture',
        title: 'whitepaper.nav.architecture',
        path: '', // Section header
        children: [
            {
                id: 'local-first',
                title: 'whitepaper.nav.localFirst',
                path: '10-架构原理-本地优先设计.md'
            }
        ]
    },
    {
        id: 'writing-guide',
        title: 'whitepaper.nav.writingGuide',
        path: '99-编辑规范-白皮书写作规范.md',
        hidden: true // Hidden from public view
    }
];
