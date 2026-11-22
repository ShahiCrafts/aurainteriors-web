# Asset Inventory & Transfer

Everything that must change hands when Aura Interiors is sold — in one
place. **No passwords or keys are listed here by design**: credentials move
through each service's own transfer flow and the admin Integrations vault,
never through documents or chat.

## Code & documentation

| Asset | Location | Transfer |
| --- | --- | --- |
| Storefront + admin source | GitHub `ShahiCrafts/aurainteriors-web` | Transfer repo ownership (GitHub Settings → Transfer) or add the buyer as owner |
| API source | GitHub `ShahiCrafts/aurainteriors-server` | Same |
| AR package source | GitHub `ShahiCrafts/reticlexr` | Same (the storefront consumes the published npm build; the package repo is the source of truth for newer versions) |
| This documentation | In `aurainteriors-web/docs`, live at https://docs.aurainteriors.live | Moves with the web repo; the docs site redeploys from it |

## Domain & infrastructure accounts

| Service | Holds | Current plan | Transfer method |
| --- | --- | --- | --- |
| Name.com | Domain registration for `aurainteriors.live` | Paid, renews yearly — **the single most important renewal** | Name.com account push / transfer to the buyer's registrar account |
| Cloudflare | DNS, SSL, proxying for all hosts | Free | Add buyer as Super Admin on the account, then remove the seller (or transfer the zone) |
| Render | Storefront service + API service | Free tier | Transfer the workspace, or buyer creates services from the repos and DNS is repointed |
| Vercel | Admin app + docs site projects | Free tier | Transfer projects to the buyer's team (Project Settings → Transfer) |
| MongoDB Atlas | The database (all business data) | Free tier (M0) | Add buyer as Organisation Owner, then remove the seller; or dump/restore into the buyer's cluster (see [Backup & Restore](../deployment/backup-and-restore.md)) |
| Cloudinary | All product/store media | Free tier | Invite buyer as admin on the cloud, then remove the seller |
| Brevo | Transactional email sending | Free tier | Invite buyer to the account, or buyer creates their own and pastes the key into Admin → Integrations |

## Business / money accounts

| Service | Holds | Transfer method |
| --- | --- | --- |
| eSewa merchant | Online payment settlement | Merchant accounts are tied to the business KYC — the buyer registers their own merchant account and replaces the credentials in Admin → Integrations (and/or server env). Do **not** hand over the seller's eSewa login |
| Google Cloud | Google sign-in OAuth client | Transfer the Cloud project, or buyer creates a new OAuth client and updates the credentials |
| AI providers (Groq, Mistral, OpenRouter, embeddings) | Chat AI keys | Buyer creates their own keys and pastes them into Admin → Integrations; seller revokes the old keys |
| Qdrant | Chat knowledge vectors | Buyer provisions their own instance and re-indexes from Admin → Knowledge, or receives a snapshot |

## Transfer checklist (in order)

1. **Agree the cutover window** and freeze admin edits (no product/order
   changes during the move).
2. **Back up the database** and verify the backup opens (see
   [Backup & Restore](../deployment/backup-and-restore.md)). Export the
   store settings from Admin → Store Settings for reference.
3. **Transfer the GitHub repos** (web, server, reticlexr).
4. **Transfer hosting**: Render workspace/services, Vercel projects
   (admin + docs), or re-create them under the buyer's accounts and
   repoint DNS.
5. **Transfer data**: Atlas ownership (or restore the backup into the
   buyer's cluster) and Cloudinary.
6. **Transfer the domain** at Name.com and Cloudflare access.
7. **Buyer replaces every secret**: eSewa, Brevo, Google, Cloudinary and AI
   keys — via Admin → Integrations and the hosting env settings. Seller
   then revokes their old keys at each provider.
8. **Rotate the platform secrets**: new `JWT_SECRET` (logs everyone out —
   expected), new MongoDB password, new admin account for the buyer, and
   delete/disable the seller's admin user (Admin → Users).
9. **Run the in-admin handover**: Setup Wizard + handover tools to purge
   demo/test data and media if the buyer wants a clean store.
10. **Verify together**: storefront loads, a test order end-to-end (COD),
    Google sign-in, a chat message answered from Admin → Support, and this
    documentation site.
11. **Seller removes their access** everywhere and confirms in writing;
    buyer changes the email address on any account that couldn't be
    transferred.

## Running-cost summary (at transfer)

| Item | Cost today |
| --- | --- |
| Domain renewal (Name.com) | Yearly, standard `.live` pricing |
| Render / Vercel / Cloudflare / Atlas / Cloudinary / Brevo | $0 on free tiers (Render paid instance is the first recommended upgrade to remove cold-start slowness) |
| eSewa | Merchant fees per eSewa's schedule |
| AI chat providers | Free tiers; pay-as-you-go if chat volume grows |
