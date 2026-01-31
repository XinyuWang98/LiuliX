/**
 * 数据源模块类型定义
 * 包含: dataSource
 */

export interface DataSourceTranslations {
    // 数据源
    dataSource: {
        title: string;
        noProjects: string;
        uploadHint: string;
        uploadFile: string;
        connectDatabase: string;
        createProject: string;
        project: {
            suffix: string;
            dataProject: string;
            untitled: string;
            rename: string;
            delete: string;
            confirmDelete: string;
            filesCount: string;
            createdAt: string;
            newProject: string;
            themes: {
                game: string;
                sales: string;
                finance: string;
                analytics: string;
                user: string;
                data: string;
            };
            recentProjects: string;
            selectProject: string;
            noProjects: string;
        };
    };
}
