#!/usr/bin/env python3
"""
AeroIntel — Sample Data Generator

Generates realistic sample BTS flight data conforming to the official BTS On-Time schema.
This allows running the entire AeroIntel pipeline out-of-the-box for evaluation and demo purposes
without requiring manual download of multi-gigabyte BTS CSV files.

Generated file: backend/data/raw/sample_bts_2024.csv
"""
import os
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path

RAW_DIR = Path(__file__).resolve().parent.parent / "backend" / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

AIRPORTS = ["ATL", "LAX", "ORD", "DFW", "DEN", "JFK", "SFO", "SEA", "LAS", "MCO", "EWR", "CLT", "PHX", "IAH", "MIA", "BOS", "MSP", "FLL", "LGA", "DTW"]
CARRIERS = ["AA", "UA", "DL", "WN", "B6", "AS", "NK", "F9"]

def generate_sample_flights(num_rows=25000, seed=42):
    np.random.seed(seed)
    random.seed(seed)

    print(f"Generating {num_rows:,} realistic sample BTS flight records...")

    start_date = datetime(2023, 1, 1)
    date_offsets = np.random.randint(0, 730, size=num_rows)
    dates = [start_date + timedelta(days=int(d)) for d in date_offsets]

    origins = np.random.choice(AIRPORTS, size=num_rows)
    dests = np.random.choice(AIRPORTS, size=num_rows)

    # Ensure origin != dest
    for i in range(num_rows):
        while dests[i] == origins[i]:
            dests[i] = random.choice(AIRPORTS)

    carriers = np.random.choice(CARRIERS, size=num_rows)
    flight_nums = np.random.randint(100, 4000, size=num_rows)

    # Scheduled departure hour biased towards day hours
    sched_hours = np.random.choice(
        np.arange(5, 23),
        size=num_rows,
        p=[0.02, 0.04, 0.06, 0.07, 0.08, 0.08, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.08, 0.07, 0.05, 0.02, 0.01, 0.00]
    )
    sched_minutes = np.random.choice([0, 15, 30, 45, 10, 20, 35, 50], size=num_rows)
    sched_dep_times = sched_hours * 100 + sched_minutes

    # Delay distribution: 75% on time/early, 25% delayed
    # Evening hours and certain airports get higher delay rates
    is_delayed = np.zeros(num_rows, dtype=int)
    dep_delays = np.zeros(num_rows, dtype=float)

    for i in range(num_rows):
        base_p = 0.18
        if sched_hours[i] >= 16:
            base_p += 0.12
        if origins[i] in ["EWR", "JFK", "ORD", "SFO"]:
            base_p += 0.08
        if carriers[i] in ["NK", "F9", "B6"]:
            base_p += 0.06

        if random.random() < base_p:
            is_delayed[i] = 1
            dep_delays[i] = round(np.random.exponential(scale=35) + 15, 1)
        else:
            dep_delays[i] = round(np.random.normal(loc=-2, scale=4), 1)

    cancelled = np.random.choice([0, 1], size=num_rows, p=[0.985, 0.015])
    distances = np.random.randint(200, 2600, size=num_rows)

    df = pd.DataFrame({
        "FL_DATE": [d.strftime("%Y-%m-%d") for d in dates],
        "OP_UNIQUE_CARRIER": carriers,
        "OP_CARRIER_FL_NUM": flight_nums,
        "ORIGIN": origins,
        "DEST": dests,
        "CRS_DEP_TIME": sched_dep_times,
        "DEP_DELAY": dep_delays,
        "ARR_DELAY": dep_delays + np.random.normal(0, 5, num_rows),
        "CANCELLED": cancelled,
        "DISTANCE": distances,
    })

    out_file = RAW_DIR / "sample_bts_2024.csv"
    df.to_csv(out_file, index=False)
    print(f"Sample data successfully saved to: {out_file}")
    return out_file

if __name__ == "__main__":
    generate_sample_flights()
