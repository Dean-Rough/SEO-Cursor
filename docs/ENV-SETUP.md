# Environment Setup Guide

## Required Environment Variables

SEO Wizard requires API credentials to function. Create a `.env.local` file in the project root with the following variables:

### File: `.env.local`

```bash
# OpenAI API (Required for Phase 4: AI Content Generation)
OPENAI_API_KEY=sk-proj-your_key_here

# Moz Data API (Required for keyword data)
MOZ_DATA_API_KEY=your_base64_encoded_key
```

---

## Getting API Keys

### 1. OpenAI API Key

**Purpose:** Powers Phase 4 content generation (GPT-4o)

**How to get:**
1. Go to https://platform.openai.com/api-keys
2. Create an account or sign in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-...`)
5. Add to `.env.local`

**Cost:** ~$0.04 per page generated

**Optional:** If not provided, Phase 4 will be skipped but Phases 1-3 will work.

---

### 2. Moz Data API Key

**Purpose:** Provides keyword search volume, difficulty, and competitive data

**How to get:**

#### Option A: Moz Pro Account
1. Go to https://moz.com/products/api/keys
2. Sign in to your Moz Pro account
3. Navigate to API Access
4. Copy your Access ID and Secret Key
5. Format as: `accessID:secretKey`
6. Base64 encode the string
7. Add to `.env.local`

#### Option B: Command Line Encoding
```bash
# If you have accessID and secretKey:
echo -n "mozscape-YourAccessID:YourSecretKey" | base64
```

**Example:**
```bash
# Input: mozscape-ABC123:XYZ789
# Output: bW96c2NhcGUtQUJDMTIzOlhZWjc4OQ==
# Add to .env.local: MOZ_DATA_API_KEY=bW96c2NhcGUtQUJDMTIzOlhZWjc4OQ==
```

**Required:** Yes - The app requires Moz data for accurate SEO strategies.

---

## Verification

After creating `.env.local`, restart your dev server:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

Check the console output:
```
✓ Starting...
- Environments: .env.local  ← Should see this
✓ Ready in 613ms
```

---

## Troubleshooting

### Error: "MOZ_DATA_API_KEY is required"

**Cause:** `.env.local` file not found or incorrectly named

**Solutions:**
1. Ensure file is named `.env.local` (with dot prefix)
2. File must be in project root (same directory as `package.json`)
3. Restart dev server after creating file
4. Check file is not named `env.local` (wrong) or `.env.local.txt` (wrong)

### Error: "Moz API error - check your credentials"

**Cause:** Invalid API key format or expired credentials

**Solutions:**
1. Verify Base64 encoding is correct
2. Check no spaces in encoded string
3. Verify Moz Pro account is active
4. Regenerate API key from Moz dashboard

### Environment Variables Not Loading

**Cause:** Next.js caches environment on startup

**Solution:**
1. Stop dev server completely (Ctrl+C)
2. Wait 2 seconds
3. Restart: `npm run dev`

---

## Security Notes

⚠️ **NEVER commit `.env.local` to git**

The `.env.local` file is automatically ignored by git (in `.gitignore`).
This file contains secret API keys - keep it local only.

### Safe Sharing

To share setup instructions without exposing keys:

```bash
# Create example file for team
cp .env.local .env.example

# Edit .env.example and replace real values with placeholders
# Example:
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
MOZ_DATA_API_KEY=YOUR_BASE64_ENCODED_KEY
```

---

## Feature Flags & API Keys

Different features require different API keys:

| Feature | Requires | Can Skip? |
|---------|----------|-----------|
| Phase 1: Intelligence | None | - |
| Phase 2: Strategy | MOZ_DATA_API_KEY | ❌ No |
| Phase 3: Blueprints | MOZ_DATA_API_KEY | ❌ No |
| Phase 4: Generation | OPENAI_API_KEY | ✅ Yes |
| Phase 5: Report | None | - |

**Summary:**
- `MOZ_DATA_API_KEY`: Required for basic operation
- `OPENAI_API_KEY`: Optional (disables AI content generation)

---

## Example `.env.local`

```bash
# SEO Wizard Environment Variables
# Copy this file to .env.local and fill in your actual keys

# OpenAI API Key (for AI content generation - Phase 4)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=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

# Moz Data API Key (for keyword data - Required)
# Get from: https://moz.com/products/api/keys
# Format: Base64 encoded "mozscape-AccessID:SecretKey"
MOZ_DATA_API_KEY=bW96c2NhcGUtR3JwUk43WnhnWTozd1BOR2ljMjFabGxpbzFyUmtSNDlNTEs1cGYxd2daWg==
```

---

## Next Steps

After setting up environment variables:

1. ✅ Verify dev server shows `.env.local` loaded
2. ✅ Test API connectivity by generating a report
3. ✅ Check console for any API errors
4. ✅ Enable Phase 4 if OpenAI key is configured

**Ready to generate SEO reports!** 🚀
