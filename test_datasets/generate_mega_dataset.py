#!/usr/bin/env python3
"""
大规模测试数据生成器
生成600,000行电商交易数据，用于验证采样策略
"""

import csv
import random
from datetime import datetime, timedelta
import sys

def generate_large_ecommerce_dataset(rows=600000, output_file='mega_ecommerce_600k.csv'):
    """
    生成大规模电商交易数据
    
    参数:
        rows: 生成行数（默认60万）
        output_file: 输出文件名
    """
    print(f"[生成器] 开始生成 {rows:,} 行电商交易数据...")
    print(f"[生成器] 输出文件: {output_file}")
    
    # 数据字段定义
    categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Home', 'Sports', 'Beauty', 'Toys']
    regions = ['North', 'South', 'East', 'West', 'Central']
    payment_methods = ['Credit Card', 'Debit Card', 'PayPal', 'Alipay', 'Cash']
    statuses = ['Completed', 'Pending', 'Cancelled', 'Returned']
    
    # CSV表头
    headers = [
        'transaction_id',
        'customer_id',
        'product_category',
        'product_price',
        'quantity',
        'total_amount',
        'discount_rate',
        'final_amount',
        'payment_method',
        'region',
        'status',
        'transaction_date',
        'customer_age',
        'customer_loyalty_score'
    ]
    
    start_time = datetime.now()
    base_date = datetime(2023, 1, 1)
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        for i in range(1, rows + 1):
            # 生成随机数据
            transaction_id = f'TXN{i:09d}'
            customer_id = f'CUST{random.randint(1, 100000):06d}'
            category = random.choice(categories)
            
            # 价格根据类别有不同范围
            price_ranges = {
                'Electronics': (100, 5000),
                'Clothing': (20, 500),
                'Food': (5, 100),
                'Books': (10, 150),
                'Home': (50, 2000),
                'Sports': (30, 800),
                'Beauty': (15, 300),
                'Toys': (10, 200)
            }
            price = round(random.uniform(*price_ranges[category]), 2)
            
            quantity = random.randint(1, 10)
            total_amount = round(price * quantity, 2)
            discount_rate = round(random.choice([0, 0, 0, 0.05, 0.1, 0.15, 0.2, 0.25]), 2)
            final_amount = round(total_amount * (1 - discount_rate), 2)
            
            payment_method = random.choice(payment_methods)
            region = random.choice(regions)
            status = random.choices(
                statuses, 
                weights=[70, 15, 10, 5]  # Completed最多
            )[0]
            
            # 随机日期（过去2年）
            days_offset = random.randint(0, 730)
            transaction_date = (base_date + timedelta(days=days_offset)).strftime('%Y-%m-%d')
            
            customer_age = random.randint(18, 75)
            loyalty_score = random.randint(0, 100)
            
            row = [
                transaction_id,
                customer_id,
                category,
                price,
                quantity,
                total_amount,
                discount_rate,
                final_amount,
                payment_method,
                region,
                status,
                transaction_date,
                customer_age,
                loyalty_score
            ]
            
            writer.writerow(row)
            
            # 进度提示（每10万行）
            if i % 100000 == 0:
                elapsed = (datetime.now() - start_time).total_seconds()
                remaining = (elapsed / i) * (rows - i)
                print(f"[进度] {i:,}/{rows:,} 行 ({i/rows*100:.1f}%) | "
                      f"已用时: {elapsed:.1f}秒 | 预计剩余: {remaining:.1f}秒")
    
    # 完成统计
    elapsed_total = (datetime.now() - start_time).total_seconds()
    file_size_mb = round(sum(1 for _ in open(output_file)) * 0.0001, 2)  # 粗略估算
    
    print(f"\n[完成] ✅ 数据生成成功！")
    print(f"  - 总行数: {rows:,} 行")
    print(f"  - 总列数: {len(headers)} 列")
    print(f"  - 文件大小: ~{file_size_mb} MB")
    print(f"  - 生成耗时: {elapsed_total:.2f} 秒")
    print(f"  - 生成速度: {int(rows/elapsed_total):,} 行/秒")
    print(f"  - 文件路径: {output_file}")
    print(f"\n[提示] 可以上传此文件到LiuliX验证采样策略！")

if __name__ == '__main__':
    # 支持命令行参数
    rows = 600000  # 默认60万行
    output = 'mega_ecommerce_600k.csv'
    
    if len(sys.argv) > 1:
        try:
            rows = int(sys.argv[1])
        except ValueError:
            print("❌ 错误：行数参数必须是整数")
            sys.exit(1)
    
    if len(sys.argv) > 2:
        output = sys.argv[2]
    
    print("=" * 60)
    print("🚀 大规模测试数据生成器 v1.0")
    print("=" * 60)
    
    generate_large_ecommerce_dataset(rows, output)
