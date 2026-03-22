# Truck Management Frontend

Next.js frontend application for the truck management system.

## Quick Deploy

When you merge to `main`, the server automatically deploys within 2 minutes.

To deploy immediately:

```bash
ssh ubuntu@3.73.183.137 "sudo /usr/local/bin/deploy-frontend"
```

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.vervoermanager.nl
```

## Deployment

The server runs a cron job that checks for new commits every 2 minutes and automatically deploys them with zero downtime using PM2.

**Manual deployment:**
```bash
ssh ubuntu@3.73.183.137 "sudo /usr/local/bin/deploy-frontend"
```

**View deployment logs:**
```bash
ssh ubuntu@3.73.183.137 "tail -f /var/log/auto-deploy-frontend.log"
```

**Check PM2 status:**
```bash
ssh ubuntu@3.73.183.137 "pm2 list"
```

**Check website:**
```bash
curl https://vervoermanager.nl
```
