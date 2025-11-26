from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseEngine(ABC):
    def __init__(self, name: str, weight: float = 1.0):
        self.name = name
        self.weight = weight

    @abstractmethod
    async def predict(self, input_data: Dict[str, Any]) -> float:
        """
        Predicts a score (0-1) for the given input data.
        """
        pass

    @abstractmethod
    async def train(self, training_data: List[Dict[str, Any]]):
        """
        Trains the engine with new data.
        """
        pass
