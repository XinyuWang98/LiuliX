#!/usr/bin/env python3
"""
系统资源监控工具
监控CPU、GPU（如果可用）、内存使用情况
"""

import psutil
import time
import json
import sys
from datetime import datetime
from collections import defaultdict

class ResourceMonitor:
    """系统资源监控器"""
    
    def __init__(self):
        self.samples = []
        self.is_monitoring = False
        
    def get_snapshot(self):
        """获取当前资源使用快照"""
        snapshot = {
            'timestamp': datetime.now().isoformat(),
            'cpu': {
                'percent': psutil.cpu_percent(interval=0.1),
                'count': psutil.cpu_count(),
                'freq': psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
            },
            'memory': {
                'total_gb': round(psutil.virtual_memory().total / (1024**3), 2),
                'used_gb': round(psutil.virtual_memory().used / (1024**3), 2),
                'percent': psutil.virtual_memory().percent,
                'available_gb': round(psutil.virtual_memory().available / (1024**3), 2)
            },
            'swap': {
                'total_gb': round(psutil.swap_memory().total / (1024**3), 2),
                'used_gb': round(psutil.swap_memory().used / (1024**3), 2),
                'percent': psutil.swap_memory().percent
            }
        }
        
        # 尝试获取GPU信息（如果有nvidia-smi）
        try:
            import subprocess
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=utilization.gpu,memory.used,memory.total', '--format=csv,noheader,nounits'],
                capture_output=True,
                text=True,
                timeout=2
            )
            if result.returncode == 0:
                gpu_data = result.stdout.strip().split(',')
                snapshot['gpu'] = {
                    'utilization': float(gpu_data[0]),
                    'memory_used_mb': float(gpu_data[1]),
                    'memory_total_mb': float(gpu_data[2]),
                    'memory_percent': round(float(gpu_data[1]) / float(gpu_data[2]) * 100, 2)
                }
        except:
            snapshot['gpu'] = None
        
        return snapshot
    
    def monitor_continuous(self, duration_seconds=10, interval=0.5):
        """连续监控一段时间"""
        print(f"⏱️  开始监控 {duration_seconds}秒...")
        start_time = time.time()
        samples = []
        
        while time.time() - start_time < duration_seconds:
            snapshot = self.get_snapshot()
            samples.append(snapshot)
            time.sleep(interval)
        
        return self.calculate_stats(samples)
    
    def calculate_stats(self, samples):
        """计算统计数据"""
        if not samples:
            return {}
        
        cpu_percents = [s['cpu']['percent'] for s in samples]
        mem_percents = [s['memory']['percent'] for s in samples]
        
        stats = {
            'duration_seconds': len(samples) * 0.5,
            'sample_count': len(samples),
            'cpu': {
                'avg': round(sum(cpu_percents) / len(cpu_percents), 2),
                'max': round(max(cpu_percents), 2),
                'min': round(min(cpu_percents), 2)
            },
            'memory': {
                'avg_percent': round(sum(mem_percents) / len(mem_percents), 2),
                'max_percent': round(max(mem_percents), 2),
                'avg_used_gb': round(sum(s['memory']['used_gb'] for s in samples) / len(samples), 2),
                'max_used_gb': round(max(s['memory']['used_gb'] for s in samples), 2)
            }
        }
        
        # GPU统计（如果可用）
        gpu_samples = [s['gpu'] for s in samples if s['gpu']]
        if gpu_samples:
            gpu_utils = [g['utilization'] for g in gpu_samples]
            gpu_mems = [g['memory_percent'] for g in gpu_samples]
            stats['gpu'] = {
                'avg_utilization': round(sum(gpu_utils) / len(gpu_utils), 2),
                'max_utilization': round(max(gpu_utils), 2),
                'avg_memory_percent': round(sum(gpu_mems) / len(gpu_mems), 2),
                'max_memory_percent': round(max(gpu_mems), 2)
            }
        
        return stats
    
    def print_snapshot(self, snapshot):
        """打印快照"""
        print(f"\n📊 系统资源快照 ({snapshot['timestamp']})")
        print("-" * 60)
        
        # CPU
        print(f"CPU:")
        print(f"  使用率: {snapshot['cpu']['percent']}%")
        print(f"  核心数: {snapshot['cpu']['count']}")
        if snapshot['cpu']['freq']:
            print(f"  频率: {snapshot['cpu']['freq']['current']:.0f} MHz")
        
        # 内存
        print(f"\n内存:")
        print(f"  使用: {snapshot['memory']['used_gb']}/{snapshot['memory']['total_gb']} GB ({snapshot['memory']['percent']}%)")
        print(f"  可用: {snapshot['memory']['available_gb']} GB")
        
        # Swap
        if snapshot['swap']['total_gb'] > 0:
            print(f"\nSwap:")
            print(f"  使用: {snapshot['swap']['used_gb']}/{snapshot['swap']['total_gb']} GB ({snapshot['swap']['percent']}%)")
        
        # GPU
        if snapshot['gpu']:
            print(f"\nGPU (NVIDIA):")
            print(f"  使用率: {snapshot['gpu']['utilization']}%")
            print(f"  显存: {snapshot['gpu']['memory_used_mb']:.0f}/{snapshot['gpu']['memory_total_mb']:.0f} MB ({snapshot['gpu']['memory_percent']}%)")
        else:
            print(f"\nGPU: 未检测到或不支持")
        
        print("-" * 60)
    
    def print_stats(self, stats):
        """打印统计信息"""
        print(f"\n📈 资源使用统计")
        print("=" * 60)
        print(f"监控时长: {stats['duration_seconds']:.1f}秒")
        print(f"采样次数: {stats['sample_count']}")
        print()
        
        print("CPU:")
        print(f"  平均使用率: {stats['cpu']['avg']}%")
        print(f"  峰值使用率: {stats['cpu']['max']}%")
        print(f"  最低使用率: {stats['cpu']['min']}%")
        print()
        
        print("内存:")
        print(f"  平均使用: {stats['memory']['avg_used_gb']} GB ({stats['memory']['avg_percent']}%)")
        print(f"  峰值使用: {stats['memory']['max_used_gb']} GB ({stats['memory']['max_percent']}%)")
        
        if 'gpu' in stats:
            print()
            print("GPU:")
            print(f"  平均使用率: {stats['gpu']['avg_utilization']}%")
            print(f"  峰值使用率: {stats['gpu']['max_utilization']}%")
            print(f"  平均显存: {stats['gpu']['avg_memory_percent']}%")
            print(f"  峰值显存: {stats['gpu']['max_memory_percent']}%")
        
        print("=" * 60)


def main():
    """主函数"""
    monitor = ResourceMonitor()
    
    print("="*60)
    print("系统资源监控工具")
    print("="*60)
    
    # 获取当前快照
    snapshot = monitor.get_snapshot()
    monitor.print_snapshot(snapshot)
    
    # 如果指定了监控时长，则持续监控
    if len(sys.argv) > 1:
        try:
            duration = int(sys.argv[1])
            stats = monitor.monitor_continuous(duration_seconds=duration)
            monitor.print_stats(stats)
            
            # 保存结果到文件
            output_file = 'resource_monitor_result.json'
            with open(output_file, 'w') as f:
                json.dump(stats, f, indent=2)
            print(f"\n✅ 结果已保存到: {output_file}")
            
        except ValueError:
            print("错误: 请提供有效的监控时长（秒）")
            print("用法: python3 resource_monitor.py [duration_seconds]")


if __name__ == '__main__':
    main()
