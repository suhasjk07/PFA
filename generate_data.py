import pandas as pd
import numpy as np

# Set a random seed for reproducibility
np.random.seed(42)

# Generate 1000 sample data points
n_samples = 1000

# Generate income data (monthly, in dollars)
income = np.random.normal(5000, 1500, n_samples)
income = np.clip(income, 1000, 15000)  # Clip values between 1000 and 15000

# Generate expenses data (monthly, in dollars)
expenses = income * np.random.uniform(0.3, 0.8, n_samples)

# Generate current savings data
savings = np.random.uniform(1000, 50000, n_samples)

# Calculate future savings (simplified model)
future_savings = savings + (income - expenses) * 12 * np.random.uniform(0.8, 1.2, n_samples)

# Create a DataFrame
df = pd.DataFrame({
    'income': income.round(2),
    'expenses': expenses.round(2),
    'savings': savings.round(2),
    'future_savings': future_savings.round(2)
})

# Save to CSV
df.to_csv('financial_data.csv', index=False)

print("financial_data.csv has been generated successfully.")