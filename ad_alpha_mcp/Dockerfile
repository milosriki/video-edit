
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Expose the port
ENV PORT=8080

# Run the application
CMD ["python", "main.py"]
