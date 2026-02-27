#!/usr/bin/env python3
"""
Script to check driver availability status
"""
import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"


def check_driver_availability():
    """Check driver availability status"""

    print("🔍 Checking Driver Availability Status")
    print("=" * 50)

    try:
        # Check total driver count
        print("\n1️⃣ Checking total driver count...")
        count_response = requests.get(f"{BASE_URL}/drivers/count")

        if count_response.status_code == 200:
            count_data = count_response.json()
            total_drivers = count_data.get('total_drivers', 0)
            print(f"   ✅ Total drivers: {total_drivers}")
        else:
            print(f"   ❌ Failed to get total count: {count_response.text}")
            return

        # Check available driver count
        print("\n2️⃣ Checking available driver count...")
        available_response = requests.get(
            f"{BASE_URL}/drivers/available-count")

        if available_response.status_code == 200:
            available_data = available_response.json()
            available_drivers = available_data.get('available_drivers', 0)
            unavailable_drivers = available_data.get('unavailable_drivers', 0)
            total_drivers = available_data.get('total_drivers', 0)

            print(f"   ✅ Available drivers: {available_drivers}")
            print(f"   ✅ Unavailable drivers: {unavailable_drivers}")
            print(f"   ✅ Total drivers: {total_drivers}")

            # Calculate availability percentage
            if total_drivers > 0:
                availability_percentage = (
                    available_drivers / total_drivers) * 100
                print(
                    f"   📊 Availability rate: {availability_percentage:.1f}%")
            else:
                print(f"   ⚠️ No drivers in database")
        else:
            print(
                f"   ❌ Failed to get available count: {available_response.text}")

        # Check available drivers list
        print("\n3️⃣ Checking available drivers list...")
        list_response = requests.get(f"{BASE_URL}/drivers/available")

        if list_response.status_code == 200:
            list_data = list_response.json()
            drivers = list_data.get('available_drivers', [])
            count = list_data.get('count', 0)

            print(f"   ✅ Available drivers list ({count} drivers):")
            for i, driver in enumerate(drivers, 1):
                print(
                    f"     {i}. ID: {driver.get('driver_id')}, Name: {driver.get('name')}, Available: {driver.get('is_available')}")
        else:
            print(f"   ❌ Failed to get drivers list: {list_response.text}")

    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

    print("\n" + "=" * 50)
    print("🏁 Driver availability check completed!")


if __name__ == "__main__":
    check_driver_availability()


