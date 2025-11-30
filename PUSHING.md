# Pushing this work without overwriting `main`

This repository is configured with SQLite as the default database, so you can push and pull without needing extra database client libraries. To publish the current `work` branch safely to GitHub without touching the original `main`, push to a dedicated branch such as `Task-Manager-V2`.

> **Important:** HTTPS pushes from this environment to GitHub are blocked. Run the commands below on your local machine after pulling the latest `work` branch. If you shared a Personal Access Token, rotate it after you finish pushing.

## One-time remote setup
Add the upstream remote that points to the original GitHub repository:

```bash
git remote add upstream https://github.com/GielinorR-S/Task_Manager.git
```

## Push to `Task-Manager-V2`
Push your current branch to the non-default `Task-Manager-V2` branch. This keeps `main` unchanged:

```bash
git push upstream work:Task-Manager-V2
```

When prompted for credentials, use your own GitHub Personal Access Token (PAT) or SSH key. Do **not** commit these secrets into the repository.

> **Heads-up:** Outbound HTTPS to GitHub is blocked in this cloud environment, so run the push command from your local machine after pulling the latest `work` branch.

## Verify before and after
1. Check the remote branch list to ensure you are targeting `Task-Manager-V2` (and not `main`):
   ```bash
   git fetch upstream
   git branch -r | grep Task-Manager-V2
   ```
2. After pushing, confirm the branch exists on GitHub:
   ```bash
   git ls-remote --heads upstream Task-Manager-V2
   ```

## Pulling on another machine
Clone or fetch the repo and check out the safe branch:

```bash
git clone https://github.com/GielinorR-S/Task_Manager.git
cd Task_Manager
git checkout Task-Manager-V2
```

Now follow the Quick start steps in `README.md` (SQLite works out of the box) to run the backend and frontend locally.
