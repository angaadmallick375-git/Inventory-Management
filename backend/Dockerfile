FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system deps required by psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer cached unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Expose default port (overridden by $PORT on Railway/Render)
EXPOSE 8000

# Production start command — no --reload flag
# docker-compose.yml overrides this with --reload for local dev
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
