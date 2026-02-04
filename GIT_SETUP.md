# How to Push Your Code to GitHub

Since `git` is not currently installed or recognized on your system, you need to follow these steps.

## Step 1: Install Git (If not installed)
1.  Download Git for Windows: [https://git-scm.com/download/win](https://git-scm.com/download/win)
2.  Run the installer. **Important**: Select "Git from the command line and also from 3rd-party software" when asked about PATH environment.
3.  After installing, restart your terminal or VS Code.

## Step 2: Initialize and Push (Command Line)
Open your terminal in `c:\Projects\clause-iq` and run these commands one by one:

```powershell
# 1. Initialize Git (if not already done)
git init

# 2. Add your remote repository
git remote add origin https://github.com/clauseiq/clauseIQ.AI.git
# If it says "remote origin already exists", that's fine, skip this step.

# 3. Add all your files
git add .

# 4. Commit your changes
git commit -m "feat: Production ready updates (Mock Mode, Tests, Deploy Guide)"

# 5. Push to GitHub
git branch -M main
git push -u origin main
```

## Option B: Use VS Code Source Control
1.  Click the **Source Control** icon in the left sidebar (looks like a Y-shape graph).
2.  Type a message in the "Message" box (e.g., "Production updates").
3.  Click **Commit**.
4.  Click **Publish Branch** or **Sync Changes**.
