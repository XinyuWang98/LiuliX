import pandas as pd
import numpy as np
import os
import argparse
from datetime import datetime, timedelta

# Configuration
OUTPUT_DIR = "test_datasets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_trips_data(num_rows=1_000_000):
    print(f"Generating {num_rows} rows for Trips Data...")
    
    # Generate dates
    base_date = datetime(2024, 1, 1)
    date_range = [base_date + timedelta(minutes=x) for x in range(0, num_rows // 100)] # Granularity
    
    # Columns
    data = {
        'vendor_id': np.random.choice([1, 2], num_rows),
        'pickup_datetime': [base_date + timedelta(seconds=np.random.randint(0, 31536000)) for _ in range(num_rows)],
        'passenger_count': np.random.randint(1, 7, num_rows),
        'trip_distance': np.round(np.random.exponential(3.0, num_rows), 2),
        'rate_code': np.random.choice([1, 2, 3, 4, 5], num_rows, p=[0.9, 0.05, 0.02, 0.02, 0.01]),
        'store_and_fwd_flag': np.random.choice(['Y', 'N'], num_rows),
        'payment_type': np.random.choice([1, 2, 3, 4], num_rows),
        'fare_amount': np.round(10 + np.random.exponential(15, num_rows), 2),
        'extra': np.random.choice([0, 0.5, 1], num_rows),
        'mta_tax': np.full(num_rows, 0.5),
        'tip_amount': np.round(np.random.exponential(2, num_rows), 2),
        'tolls_amount': np.random.choice([0, 5.76], num_rows, p=[0.9, 0.1]),
        'improvement_surcharge': np.full(num_rows, 0.3),
    }
    
    # Calculate Total
    data['total_amount'] = data['fare_amount'] + data['extra'] + data['mta_tax'] + data['tip_amount'] + data['tolls_amount'] + data['improvement_surcharge']
    data['dropoff_datetime'] = [dt + timedelta(minutes=np.random.randint(5, 60)) for dt in data['pickup_datetime']]

    df = pd.DataFrame(data)
    
    output_path = os.path.join(OUTPUT_DIR, f"trips_data_{num_rows//1000000}m.csv")
    print(f"Saving to {output_path}...")
    df.to_csv(output_path, index=False)
    print("Done!")

def generate_sales_data(num_rows=2_000_000):
    print(f"Generating {num_rows} rows for Sales Data...")
    
    products = [f"PROD-{i:05d}" for i in range(1000)]
    countries = ['United Kingdom', 'Germany', 'France', 'EIRE', 'Spain']
    
    data = {
        'InvoiceNo': np.random.randint(500000, 600000, num_rows).astype(str),
        'StockCode': np.random.choice(products, num_rows),
        'Description': [f"Description for Product {i}" for i in np.random.randint(0, 1000, num_rows)],
        'Quantity': np.random.randint(1, 100, num_rows),
        'InvoiceDate': [datetime(2023, 1, 1) + timedelta(minutes=np.random.randint(0, 525600)) for _ in range(num_rows)],
        'UnitPrice': np.round(np.random.uniform(0.5, 100.0, num_rows), 2),
        'CustomerID': np.random.randint(10000, 20000, num_rows),
        'Country': np.random.choice(countries, num_rows, p=[0.8, 0.1, 0.05, 0.03, 0.02]),
        'Channel': np.random.choice(['Web', 'Mobile', 'Store'], num_rows)
    }
    
    df = pd.DataFrame(data)
    df['total_sales'] = df['Quantity'] * df['UnitPrice']
    
    output_path = os.path.join(OUTPUT_DIR, f"big_sales_{num_rows//1000000}m.csv")
    print(f"Saving to {output_path}...")
    df.to_csv(output_path, index=False)
    print("Done!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--type", choices=['trips', 'sales', 'all'], default='all')
    parser.add_argument("--rows", type=int, default=None, help="Override row count")
    args = parser.parse_args()
    
    if args.type in ['trips', 'all']:
        count = args.rows if args.rows else 1_000_000
        generate_trips_data(count)
        
    if args.type in ['sales', 'all']:
        count = args.rows if args.rows else 2_000_000
        generate_sales_data(count)
