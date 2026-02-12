cd /var/www/Dangal-4.0

git pull origin main

cd client
npm install
npm run build
cd ..

cd admin
npm install
npm run build
cd ..

cd server
npm install
cd ..

pm2 restart dangal-backend


pm2 status

pm2 logs dangal-backend --lines 50