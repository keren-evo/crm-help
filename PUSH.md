# Push to keren-evo/crm-help

## Why you saw 403

Git was using the **klacadin** GitHub account. That account does not have write access to **keren-evo/crm-help**.

## Fix (pick one)

### Option A — Get access for klacadin (recommended)

1. A **keren-evo org owner** opens:  
   https://github.com/keren-evo/crm-help/settings/access  
2. **Add people** → invite **klacadin** with **Write** (or Maintain) role.
3. Accept the invite in email/GitHub notifications.
4. Push again:

```powershell
cd Z:\DEV\evo-help\crm-help
git push origin main
```

Sign in as **klacadin** when Git Credential Manager prompts you.

### Option B — Push with a Personal Access Token

Use a token from a GitHub account that **already has write access** to `keren-evo/crm-help`.

1. Create a classic PAT: GitHub → **Settings → Developer settings → Personal access tokens**  
   Scope: **repo**
2. In PowerShell:

```powershell
cd Z:\DEV\evo-help\crm-help
$env:GITHUB_TOKEN = "ghp_your_token_here"
git push "https://$env:GITHUB_TOKEN@github.com/keren-evo/crm-help.git" main
```

Do not commit the token to the repo.

### Option C — SSH (one-time setup)

```powershell
ssh-keygen -t ed25519 -C "khlacadin@gmail.com" -f $env:USERPROFILE\.ssh\id_ed25519_github
```

Add the public key (`id_ed25519_github.pub`) to the GitHub account that has **keren-evo** access, then:

```powershell
cd Z:\DEV\evo-help\crm-help
git remote set-url origin git@github.com:keren-evo/crm-help.git
git push origin main
```

## After a successful push

1. https://github.com/keren-evo/crm-help → **Settings → Pages** → **GitHub Actions**
2. **Actions** → **Deploy ticketing to GitHub Pages** → wait for green
3. Live site: **https://keren-evo.github.io/crm-help/**

## Work from this folder

Always commit from **`Z:\DEV\evo-help\crm-help`**, not `evo-help` (that remote points to klacadin/evo-help).
