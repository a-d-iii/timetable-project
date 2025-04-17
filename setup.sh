#!/bin/bash

echo "🟡 Updating system and installing core packages..."
sudo apt update -y && sudo apt upgrade -y
sudo apt install -y nodejs npm git postgresql postgresql-contrib -y

echo "🟢 Starting PostgreSQL service..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "🔐 Setting up PostgreSQL user and database..."
sudo -u postgres psql <<EOF
CREATE USER vitgen WITH PASSWORD 'vitpass';
CREATE DATABASE timetable_gen OWNER vitgen;
GRANT ALL PRIVILEGES ON DATABASE timetable_gen TO vitgen;
EOF

echo "📦 Cloning your GitHub project..."
git clone https://github.com/a-d-iii/timetable-project.git || echo "Repo already exists"
cd timetable-project || cd timetable-project-main

echo "📦 Installing Node + project dependencies..."
npm install
npx prisma generate

echo "⚙️ Setting up environment file (.env)..."
cat <<EOT > .env
DATABASE_URL="postgresql://vitgen:vitpass@localhost:5432/timetable_gen"
EOT

echo "🛠 Pushing schema to database..."
npx prisma db push

echo "🌱 Running seed file to pre-fill data (if any)..."
npx ts-node prisma/seed.ts || echo "⚠️ seed.ts not found or already seeded."

echo "🚀 Setup complete. You can now run any generator manually or script it."
