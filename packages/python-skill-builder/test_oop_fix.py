"""Test script to verify OOP code works in sandbox"""
import sys
sys.path.insert(0, '.')

from app import run_user_and_tests

# Test the OOP code that was failing
user_code = """
class Vehicle:
    def __init__(self, vin):
        self._vin = vin  # private attribute

    @property
    def vin(self):
        \"\"\"Read-only property for VIN\"\"\"
        return self._vin


class Truck(Vehicle):
    def __init__(self, vin, capacity):
        super().__init__(vin)
        self.capacity = capacity  # integer capacity

    def __repr__(self):
        return f"Truck({self.vin}, capacity={self.capacity})"
"""

# Simple test harness
test_code = """
def grade(ns):
    max_score = 100
    Vehicle = ns.get('Vehicle')
    Truck = ns.get('Truck')
    
    if not Vehicle or not Truck:
        return {'score': 0, 'max_score': max_score, 'feedback': 'Classes missing'}
    
    # Test Vehicle
    v = Vehicle('ABC123')
    if v.vin != 'ABC123':
        return {'score': 40, 'max_score': max_score, 'feedback': 'Vehicle.vin property not working'}
    
    # Test Truck
    t = Truck('XYZ789', 5000)
    if t.vin != 'XYZ789':
        return {'score': 60, 'max_score': max_score, 'feedback': 'Truck.vin not inherited'}
    if t.capacity != 5000:
        return {'score': 70, 'max_score': max_score, 'feedback': 'Truck.capacity not set'}
    
    # Test __repr__
    repr_str = repr(t)
    if 'Truck' not in repr_str or 'XYZ789' not in repr_str or '5000' not in repr_str:
        return {'score': 80, 'max_score': max_score, 'feedback': '__repr__ not correct'}
    
    return {'score': 100, 'max_score': max_score, 'feedback': 'Perfect!'}
"""

print("Testing OOP code in sandbox...")
try:
    result = run_user_and_tests(user_code, test_code)
    print(f"✓ Test passed!")
    print(f"  Score: {result['score']}/{result['max_score']}")
    print(f"  Feedback: {result['feedback']}")
except Exception as e:
    print(f"✗ Test failed: {e}")
    import traceback
    traceback.print_exc()

