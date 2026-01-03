#!/usr/bin/env python3
"""
轻量级系统资源监控工具（无外部依赖）
使用系统命令监控CPU、内存使用情况
"""

import subprocess
import time
import json
import sys
import re
from datetime import datetime

class ResourceMonitor:
    """轻量级资源监控器"""
    
    def get_snapshot(self):
        """获取当前资源使用快照"""
        snapshot = {
            'timestamp': datetime.now().isoformat(),
            'cpu': self._get_cpu_info(),
            'memory': self._get_memory_info(),
            'gpu': self._get_gpu_info()
        }
        return snapshot
    
    def _get_cpu_info(self):
        """获取CPU信息（macOS）"""
        try:
            # 获取CPU使用率
            result = subprocess.run(
                ['top', '-l', '1', '-n', '0'],
                capture_output=True,
                text=True,
                timeout=2
            )
            
            # 解析CPU使用率
            for line in result.stdout.split('\n'):
                if 'CPU usage' in line:
                    # 示例: CPU usage: 5.23% user, 3.12% sys, 91.65% idle
                    parts = line.split(':')[1].strip()
                    user = float(re.search(r'([\d.]+)%\s+user', parts).group(1))
                    sys_cpu = float(re.search(r'([\d.]+)%\s+sys', parts).group(1))
                    idle = float(re.search(r'([\d.]+)%\s+idle', parts).group(1))
                    
                    return {
                        'user_percent': round(user, 2),
                        'system_percent': round(sys_cpu, 2),
                        'idle_percent': round(idle, 2),
                        'total_percent': round(user + sys_cpu, 2)
                    }
        except Exception as e:
            return {'error': str(e)}
        
        return {}
    
    def _get_memory_info(self):
        """获取内存信息（macOS）"""
        try:
            # 使用vm_stat获取内存信息
            result = subprocess.run(
                ['vm_stat'],
                capture_output=True,
                text=True,
                timeout=2
            )
            
            # 解析vm_stat输出
            lines = result.stdout.split('\n')
            page_size = 4096  # macOS默认页面大小
            
            mem_info = {}
            for line in lines:
                if ':' in line:
                    key, value = line.split(':')
                    # 移除单位和点号
                    value = value.strip().replace('.', '')
                    if value.isdigit():
                        mem_info[key.strip()] = int(value)
            
            # 计算内存使用
            if mem_info:
                pages_free = mem_info.get('Pages free', 0)
                pages_active = mem_info.get('Pages active', 0)
                pages_inactive = mem_info.get('Pages inactive', 0)
                pages_speculative = mem_info.get('Pages speculative', 0)
                pages_wired = mem_info.get('Pages wired down', 0)
                
                # 转换为GB
                free_gb = (pages_free * page_size) / (1024**3)
                active_gb = (pages_active * page_size) / (1024**3)
                inactive_gb = (pages_inactive * page_size) / (1024**3)
                wired_gb = (pages_wired * page_size) / (1024**3)
                
                # 获取总内存
                result_total = subprocess.run(
                    ['sysctl', 'hw.memsize'],
                    capture_output=True,
                    text=True
                )
                total_bytes = int(result_total.stdout.split(':')[1].strip())
                total_gb = total_bytes / (1024**3)
                
                used_gb = active_gb + wired_gb
                
                return {
                    'total_gb': round(total_gb, 2),
                    'used_gb': round(used_gb, 2),
                    'free_gb': round(free_gb, 2),
                    'active_gb': round(active_gb, 2),
                    'wired_gb': round(wired_gb, 2),
                    'used_percent': round((used_gb / total_gb) * 100, 2)
                }
        except Exception as e:
            return {'error': str(e)}
        
        return {}
    
    def _get_gpu_info(self):
        """获取GPU信息（尝试检测Metal/NVIDIA）"""
        try:
            # 尝试Metal性能统计
            result = subprocess.run(
                ['system_profiler', 'SPDisplaysDataType'],
                capture_output=True,
                text=True,
                timeout=3
            )
            
            if 'Metal' in result.stdout:
                # 提取GPU信息
                for line in result.stdout.split('\n'):
                    if 'Chipset Model' in line:
                        gpu_model = line.split(':')[1].strip()
                        return {
                            'model': gpu_model,
                            'type': 'Metal (Apple Silicon/Intel)',
                            'note': 'Metal GPU不支持实时用量监控'
                        }
        except:
            pass
        
        return None
    
    def print_snapshot(self, snapshot):
        """打印快照"""
        print(f"\n📊 系统资源快照 ({snapshot['timestamp']})")
        print("-" * 60)
        
        # CPU
        if 'error' not in snapshot['cpu']:
            print(f"CPU:")
            print(f"  用户态: {snapshot['cpu']['user_percent']}%")
            print(f"  系统态: {snapshot['cpu']['system_percent']}%")
            print(f"  空闲: {snapshot['cpu']['idle_percent']}%")
            print(f"  总使用率: {snapshot['cpu']['total_percent']}%")
        
        # 内存
        if 'error' not in snapshot['memory']:
            mem = snapshot['memory']
            print(f"\n内存:")
            print(f"  总计: {mem['total_gb']} GB")
            print(f"  已用: {mem['used_gb']} GB ({mem['used_percent']}%)")
            print(f"  可用: {mem['free_gb']} GB")
            print(f"  活跃: {mem['active_gb']} GB")
            print(f"  常驻: {mem['wired_gb']} GB")
        
        # GPU
        if snapshot['gpu']:
            print(f"\nGPU:")
            print(f"  型号: {snapshot['gpu']['model']}")
            print(f"  类型: {snapshot['gpu']['type']}")
            if 'note' in snapshot['gpu']:
                print(f"  备注: {snapshot['gpu']['note']}")
        else:
            print(f"\nGPU: 未检测到")
        
        print("-" * 60)
    
    def monitor_continuous(self, duration_seconds=10, interval=1):
        """连续监控"""
        print(f"⏱️  开始监控 {duration_seconds}秒（采样间隔{interval}秒）...")
        start_time = time.time()
        samples = []
        
        while time.time() - start_time < duration_seconds:
            snapshot = self.get_snapshot()
            samples.append(snapshot)
            print(f"  采样 {len(samples)}... CPU: {snapshot['cpu'].get('total_percent', 'N/A')}%, 内存: {snapshot['memory'].get('used_percent', 'N/A')}%")
            time.sleep(interval)
        
        return self.calculate_stats(samples)
    
    def calculate_stats(self, samples):
        """计算统计数据"""
        valid_samples = [s for s in samples if 'error' not in s['cpu'] and 'error' not in s['memory']]
        if not valid_samples:
            return {'error': '没有有效样本'}
        
        cpu_percents = [s['cpu']['total_percent'] for s in valid_samples]
        mem_percents = [s['memory']['used_percent'] for s in valid_samples]
        mem_used_gbs = [s['memory']['used_gb'] for s in valid_samples]
        
        stats = {
            'duration_seconds': len(samples),
            'sample_count': len(samples),
            'valid_sample_count': len(valid_samples),
            'cpu': {
                'avg': round(sum(cpu_percents) / len(cpu_percents), 2),
                'max': round(max(cpu_percents), 2),
                'min': round(min(cpu_percents), 2)
            },
            'memory': {
                'avg_percent': round(sum(mem_percents) / len(mem_percents), 2),
                'max_percent': round(max(mem_percents), 2),
                'avg_used_gb': round(sum(mem_used_gbs) / len(mem_used_gbs), 2),
                'max_used_gb': round(max(mem_used_gbs), 2)
            }
        }
        
        return stats
    
    def print_stats(self, stats):
        """打印统计信息"""
        if 'error' in stats:
            print(f"\n❌ 错误: {stats['error']}")
            return
        
        print(f"\n📈 资源使用统计")
        print("=" * 60)
        print(f"监控时长: {stats['duration_seconds']}秒")
        print(f"有效采样: {stats['valid_sample_count']}/{stats['sample_count']}")
        print()
        
        print("CPU:")
        print(f"  平均使用率: {stats['cpu']['avg']}%")
        print(f"  峰值使用率: {stats['cpu']['max']}%")
        print(f"  最低使用率: {stats['cpu']['min']}%")
        print()
        
        print("内存:")
        print(f"  平均使用: {stats['memory']['avg_used_gb']} GB ({stats['memory']['avg_percent']}%)")
        print(f"  峰值使用: {stats['memory']['max_used_gb']} GB ({stats['memory']['max_percent']}%)")
        
        print("=" * 60)


def main():
    """主函数"""
    monitor = ResourceMonitor()
    
    print("="*60)
    print("系统资源监控工具 (macOS版)")
    print("="*60)
    
    # 获取当前快照
    snapshot = monitor.get_snapshot()
    monitor.print_snapshot(snapshot)
    
    # 如果指定了监控时长
    if len(sys.argv) > 1:
        try:
            duration = int(sys.argv[1])
            stats = monitor.monitor_continuous(duration_seconds=duration, interval=1)
            monitor.print_stats(stats)
            
            # 保存结果
            output_file = 'resource_monitor_result.json'
            with open(output_file, 'w') as f:
                json.dump(stats, f, indent=2)
            print(f"\n✅ 结果已保存到: {output_file}")
            
        except ValueError:
            print("错误: 请提供有效的监控时长（秒）")
            print("用法: python3 resource_monitor_lite.py [duration_seconds]")


if __name__ == '__main__':
    main()
