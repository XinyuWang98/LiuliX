/**
 * Feature Flags 远程配置加载器
 * 
 * 在应用启动时异步加载远程配置，缓存到 localStorage
 * 24小时内有效，过期自动重新拉取
 */

/**
 * 从远程加载 Feature Flags 配置
 * @returns 是否加载成功
 */
export async function loadRemoteFeatureFlags(): Promise<boolean> {
    try {
        // 检查缓存是否有效
        const remoteTimestamp = localStorage.getItem('feature_flags_remote_timestamp');
        if (remoteTimestamp) {
            const age = Date.now() - parseInt(remoteTimestamp);
            if (age < 24 * 60 * 60 * 1000) {
                console.log('[Feature Flags] 远程配置缓存有效，跳过加载');
                return true;
            }
        }

        console.log('[Feature Flags] 开始加载远程配置...');

        // 拉取远程配置
        const response = await fetch('/api/feature-flags.json', {
            cache: 'no-cache', // 禁用浏览器缓存，确保获取最新配置
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const remoteFlags = await response.json();

        // 验证响应格式
        if (typeof remoteFlags !== 'object' || remoteFlags === null) {
            throw new Error('远程配置格式错误：非对象');
        }

        // 存储到 localStorage
        localStorage.setItem('feature_flags_remote', JSON.stringify(remoteFlags));
        localStorage.setItem('feature_flags_remote_timestamp', Date.now().toString());

        console.log('[Feature Flags] 远程配置加载成功', {
            keys: Object.keys(remoteFlags).length,
            ENABLE_EDA_CONTEXT_LOOP: remoteFlags.ENABLE_EDA_CONTEXT_LOOP
        });

        return true;
    } catch (error) {
        console.warn('[Feature Flags] 远程配置加载失败，使用默认配置', error);
        return false;
    }
}
