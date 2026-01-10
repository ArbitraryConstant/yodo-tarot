# YODO TAROT - STEP-BY-STEP DEPLOYMENT GUIDE

## Prerequisites
- Anthropic API account (https://console.anthropic.com)
- Railway account (https://railway.app)
- PowerShell or Command Prompt

---

## STEP 1: Get Your Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Click on "API Keys" in the left sidebar
4. Click "Create Key"
5. Give it a name like "Yodo Tarot"
6. Copy the key (starts with "sk-ant-...")
7. SAVE THIS KEY - you'll need it when using the app

---

## STEP 2: Set Up Your Local Files

1. **Download all files to a folder** (e.g., `C:\yodo-tarot\`)
   - index.html
   - styles.css
   - script.js
   - server.js
   - package.json
   - README.md
   - .gitignore

2. **Open PowerShell** and navigate to your folder:
```powershell
cd C:\yodo-tarot
```

3. **Test locally** (optional):
```powershell
npm install
npm start
```
Then open browser to http://localhost:3000

---

## STEP 3: Deploy to Railway (EASIEST METHOD)

### Method A: Using Railway Dashboard (Recommended for beginners)

1. **Go to https://railway.app** and sign in (or create account)

2. **Create New Project**:
   - Click "New Project"
   - Click "Deploy from GitHub repo"
   - If you don't have GitHub set up, choose "Empty Project" instead

3. **Upload Files**:
   - If you chose "Empty Project":
     - Railway will give you CLI instructions
     - Or drag/drop your folder into the Railway dashboard

4. **If using GitHub**:
   ```powershell
   # In your yodo-tarot folder:
   git init
   git add .
   git commit -m "Initial commit"
   
   # Create GitHub repo (if you have GitHub CLI):
   gh repo create yodo-tarot --public --source=. --remote=origin --push
   
   # Or manually create repo on GitHub.com and push:
   git remote add origin https://github.com/YOUR-USERNAME/yodo-tarot.git
   git branch -M main
   git push -u origin main
   ```

5. **Configure Railway**:
   - Railway will auto-detect it's a Node.js app
   - It will automatically run `npm install` and `npm start`
   - Wait for deployment to complete (1-2 minutes)

6. **Get Your URL**:
   - Click on your deployment
   - Look for "Settings" → "Generate Domain"
   - Copy your URL (e.g., `yodo-tarot.up.railway.app`)

---

### Method B: Using Railway CLI (Alternative)

1. **Install Railway CLI**:
```powershell
npm install -g @railway/cli
```

2. **Login to Railway**:
```powershell
railway login
```

3. **Initialize and Deploy**:
```powershell
cd C:\yodo-tarot
railway init
railway up
```

4. **Get your URL**:
```powershell
railway open
```

---

## STEP 4: Use Your App

1. **Visit your Railway URL** (e.g., `https://yodo-tarot.up.railway.app`)

2. **First time setup**:
   - You'll be prompted for your Anthropic API key
   - Paste the key you saved from Step 1
   - Click OK
   - The key is saved in your browser (localStorage)

3. **Start a reading**:
   - Choose your reading type
   - Enter your question
   - Follow the prompts through the reading and mapping process

---

## STEP 5: Test the Complete Flow

Try this test question to verify everything works:

**Reading Type**: Specific question  
**Question**: "What creative project should I focus on next?"

The app should:
1. ✓ Generate a tarot reading
2. ✓ Ask if you want to explore
3. ✓ Let you choose Control or Chaos
4. ✓ Run 4 mapping cycles with network visualization
5. ✓ Generate final synthesis
6. ✓ Allow export in multiple formats

---

## Troubleshooting

### "API Key Error"
- Make sure you copied the full key including "sk-ant-"
- Check that your Anthropic account has API credits
- Try clearing localStorage and re-entering the key

### "Cannot find module 'express'"
- Run `npm install` in your project folder
- Make sure package.json is present

### "Port already in use" (local testing)
- Change PORT in server.js to 3001 or another number
- Or close the other app using port 3000

### Railway deployment stuck
- Check Railway logs for errors
- Ensure all files are committed (if using GitHub)
- Verify package.json is correct

### Network graph not showing
- Check browser console for errors (F12)
- Verify Cytoscape.js loaded from CDN
- Make sure you completed at least one reading

---

## Updating Your App

When you make changes:

**If using GitHub + Railway:**
```powershell
git add .
git commit -m "Your update description"
git push
```
Railway will auto-deploy changes.

**If using Railway CLI:**
```powershell
railway up
```

---

## Cost Information

- **Railway**: Free tier includes 500 hours/month (plenty for personal use)
- **Anthropic API**: Pay per use (~$0.003 per API call, estimates for typical reading: $0.02-0.05)
- **Hosting**: Free tier is sufficient for hundreds of readings per month

---

## Next Steps

Once deployed and working:

1. Share your URL with friends
2. Experiment with different questions
3. Try both Control and Chaos modes
4. Export and save meaningful readings
5. Consider adding v2 features (see README.md)

---

## Need Help?

1. Check Railway logs: `railway logs` or in dashboard
2. Test API key at https://console.anthropic.com
3. Verify files are all uploaded correctly
4. Check browser console (F12) for JavaScript errors

---

## Quick Reference Commands

```powershell
# Local testing
npm install
npm start

# Railway deployment (CLI)
railway login
railway init
railway up
railway logs

# GitHub (if needed)
git init
git add .
git commit -m "message"
git push
```

---

You're all set! Enjoy exploring the rhizomatic depths of Yodo Tarot! 🔮
