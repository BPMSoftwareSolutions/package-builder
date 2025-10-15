class Vehicle:
    def __init__(self, vin):
        self._vin = vin  # private attribute

    @property
    def vin(self):
        """Read-only property for VIN"""
        return self._vin


class Truck(Vehicle):
    def __init__(self, vin, capacity):
        super().__init__(vin)
        self.capacity = capacity  # integer capacity

    def __repr__(self):
        return f"Truck({self.vin}, capacity={self.capacity})"
