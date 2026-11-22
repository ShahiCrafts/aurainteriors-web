# Backup & Restore

What to back up, how, and how to get it back. The rule: **never run a
destructive operation (handover purge, bulk delete, a risky migration)
without a verified backup from the same day.**

## What actually needs backing up

| Data | Lives in | Backup method |
| --- | --- | --- |
| Products, orders, customers, settings, chat, audit log | MongoDB Atlas | Atlas snapshots (paid tiers) or `mongodump` export (any tier) |
| Media files (product images, uploads) | Cloudinary | Cloudinary keeps the files; export an asset list + download a copy of critical folders for a full offline backup |
| Store settings document | MongoDB (`siteSettings`) | Included in the DB backup; also screenshot/export the Store Settings screens before big changes |
| Secrets (integration keys) | Encrypted in MongoDB (`integrationSecret`) + hosting env vars | Included in the DB backup in encrypted form. Keep a separate note of *which* services are configured (never the key values) in the owner's password manager |
| Code | GitHub | Git is the backup — ensure all work is pushed |
| DNS records | Cloudflare | Export/screenshot the DNS table before changes (Cloudflare → DNS → Settings → export on supported plans) |

## Database backup (free-tier friendly)

```bash
# Full backup of the Aura database to a local folder
mongodump --uri "<MONGO_URI>" --out ./backup-$(date +%F)

# Single collection (e.g. just the settings)
mongodump --uri "<MONGO_URI>" --collection siteSettings --out ./settings-backup
```

On Atlas paid tiers, prefer **Atlas Cloud Backups** (automated snapshots +
point-in-time restore) and treat `mongodump` as the pre-handover extra.

## Restore

```bash
# Restore into the SAME cluster (careful: overwrites)
mongorestore --uri "<MONGO_URI>" --drop ./backup-2026-01-01

# Restore into a NEW cluster (handover / disaster recovery)
mongorestore --uri "<NEW_MONGO_URI>" ./backup-2026-01-01
```

After restoring into a new cluster:

1. Point the API's `MONGO_URI` at the new cluster and redeploy the API.
2. Confirm `GET /api/v1/settings/public` returns the store settings.
3. Sign in to admin and spot-check products, orders and users.
4. Media still loads from Cloudinary URLs stored in the documents — no
   media restore is needed unless Cloudinary itself was lost.

## The pre-handover backup (required before a sale cutover)

1. `mongodump` the full database; keep one copy with the seller and hand
   one to the buyer.
2. Download the Cloudinary folders used by the store (or confirm the buyer
   receives the Cloudinary account itself — see
   [Asset Inventory & Transfer](../handover/asset-inventory-and-transfer.md)).
3. Export the Cloudflare DNS table.
4. Only then run the admin handover purge or any destructive step.

## Restore drill (do this once, before you need it)

Restore the latest backup into a throwaway Atlas cluster, point a local
API at it (`MONGO_URI` in `.env`), and load the storefront locally. If the
catalog and settings appear, the backup is real. A backup that has never
been restored is a hope, not a backup.
