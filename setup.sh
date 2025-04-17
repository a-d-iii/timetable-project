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

cd timetable-project 2>/dev/null || cd timetable-project-main || {
  echo "❌ Project folder not found!"
  exit 1
}

echo "📦 Installing Node.js project dependencies..."
npm install

echo "🔌 Installing required runtime packages..."
npm install dotenv ts-node prisma @prisma/client --save

echo "⚙️ Generating Prisma client..."
npx prisma generate

echo "📁 Creating .env file if it doesn't exist..."
if [ ! -f .env ]; then
  cat <<EOT > .env
DATABASE_URL="postgresql://vitgen:vitpass@localhost:5432/timetable_gen"
EOT
  echo "✅ .env created!"
else
  echo "ℹ️  .env already exists. Skipping..."
fi

echo "🛠 Pushing schema to database..."
npx prisma db push

echo "🌱 Running seed file to pre-fill data (if any)..."
npx ts-node prisma/seed.ts || echo "⚠️ seed.ts not found or already seeded."

echo "🚀 Setup complete. You can now run your generators!"

# 📡 Final message for connecting VS Code via Remote-SSH
IP=$(curl -s ifconfig.me)
echo
echo "📡 Connect to this instance from VS Code:"
echo "➡️  Add this to your SSH config file (e.g., ~/.ssh/config on your laptop):"
echo
echo "Host vit-ec2"
echo "  HostName $IP"
echo "  User ubuntu"
echo "  IdentityFile C:/Users/adixv/.ssh/lini2.pem"
echo
echo "💻 Then in VS Code: F1 → Remote-SSH: Connect to Host → vit-ec2"
