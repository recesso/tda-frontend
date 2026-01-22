# Planning Center Portability Guide

> **Complete instructions for copying, installing, and using the Planning Center in any project**

---

## Table of Contents

1. [Overview](#overview)
2. [Complete File Inventory](#complete-file-inventory)
3. [Installation Methods](#installation-methods)
4. [Setup Instructions](#setup-instructions)
5. [Verification Checklist](#verification-checklist)
6. [Project-Specific Configuration](#project-specific-configuration)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Planning Center is a collection of Claude Code skills that enable semi-autonomous creation of world-class pre-development documentation. It consists of:

- **11 Documentation Skills** - Create PRD, TRD, Design Docs, ADRs, etc.
- **1 Orchestrator Skill** - Runs the entire 7-layer process semi-autonomously
- **Supporting Skills** - Execution, quality, and workflow management

### How Claude Code Skills Work

Claude Code skills are stored in `~/.claude/skills/` (user-level) and are available to ALL projects automatically. You don't need to copy skills to each project - they're global.

```
~/.claude/
├── skills/                    # Global skills (available everywhere)
│   ├── planning-orchestrator/
│   │   └── SKILL.md
│   ├── writing-prd/
│   │   └── SKILL.md
│   └── ...
└── settings.json              # Global settings
```

**Key insight:** Skills are USER-level, not PROJECT-level. Install once, use everywhere.

---

## Complete File Inventory

### Planning Center Skills (Required)

These 11 skills make up the core Planning Center:

| Skill | Path | Size | Purpose |
|-------|------|------|---------|
| `planning-orchestrator` | `~/.claude/skills/planning-orchestrator/SKILL.md` | ~12KB | Orchestrates 7-layer process |
| `writing-prd` | `~/.claude/skills/writing-prd/SKILL.md` | ~8KB | Product Requirements |
| `writing-trd` | `~/.claude/skills/writing-trd/SKILL.md` | ~10KB | Technical Requirements |
| `writing-design-doc` | `~/.claude/skills/writing-design-doc/SKILL.md` | ~12KB | Google-style Design Docs |
| `writing-adr` | `~/.claude/skills/writing-adr/SKILL.md` | ~8KB | Architecture Decisions |
| `writing-c4-architecture` | `~/.claude/skills/writing-c4-architecture/SKILL.md` | ~15KB | C4 Architecture Diagrams |
| `writing-data-model` | `~/.claude/skills/writing-data-model/SKILL.md` | ~12KB | Data Architecture |
| `writing-api-contract` | `~/.claude/skills/writing-api-contract/SKILL.md` | ~14KB | OpenAPI/AsyncAPI Specs |
| `writing-qa-plan` | `~/.claude/skills/writing-qa-plan/SKILL.md` | ~10KB | QA Strategy |
| `writing-runbooks` | `~/.claude/skills/writing-runbooks/SKILL.md` | ~14KB | Operational Runbooks |
| `agent-handoff-prep` | `~/.claude/skills/agent-handoff-prep/SKILL.md` | ~13KB | Agent Handoff Package |

### Supporting Skills (Recommended)

These skills enhance the Planning Center workflow:

| Skill | Path | Purpose |
|-------|------|---------|
| `brainstorming` | `~/.claude/skills/brainstorming/SKILL.md` | Idea exploration |
| `writing-plans` | `~/.claude/skills/writing-plans/SKILL.md` | Implementation plans |
| `executing-plans` | `~/.claude/skills/executing-plans/SKILL.md` | Plan execution |
| `subagent-driven-development` | `~/.claude/skills/subagent-driven-development/SKILL.md` | Parallel execution |
| `test-driven-development` | `~/.claude/skills/test-driven-development/SKILL.md` | TDD workflow |
| `verification-before-completion` | `~/.claude/skills/verification-before-completion/SKILL.md` | Quality gates |
| `using-git-worktrees` | `~/.claude/skills/using-git-worktrees/SKILL.md` | Isolated workspaces |
| `finishing-a-development-branch` | `~/.claude/skills/finishing-a-development-branch/SKILL.md` | PR/merge workflow |

### Documentation Files (Project-Level)

These go in each project's `docs/` folder:

| File | Path | Purpose |
|------|------|---------|
| `COMPLETE_DOCUMENTATION_TOOLKIT.md` | `docs/COMPLETE_DOCUMENTATION_TOOLKIT.md` | Full reference guide |
| `SKILLS_DOCUMENTATION_FRAMEWORK.md` | `docs/SKILLS_DOCUMENTATION_FRAMEWORK.md` | Quick reference |
| `PLANNING_CENTER_PORTABILITY_GUIDE.md` | `docs/PLANNING_CENTER_PORTABILITY_GUIDE.md` | This file |

---

## Installation Methods

### Method 1: Copy Skills Directory (Recommended)

**For moving to a new machine or sharing with a team member:**

```powershell
# On Windows - Copy entire skills directory
# From source machine:
xcopy /E /I "%USERPROFILE%\.claude\skills" "C:\backup\claude-skills"

# To destination machine:
xcopy /E /I "C:\backup\claude-skills" "%USERPROFILE%\.claude\skills"
```

```bash
# On Mac/Linux - Copy entire skills directory
# From source machine:
cp -r ~/.claude/skills ~/backup/claude-skills

# To destination machine:
cp -r ~/backup/claude-skills ~/.claude/skills
```

### Method 2: Copy Individual Skills

**For selective installation:**

```powershell
# Windows - Copy specific skills
$skills = @(
    "planning-orchestrator",
    "writing-prd",
    "writing-trd",
    "writing-design-doc",
    "writing-adr",
    "writing-c4-architecture",
    "writing-data-model",
    "writing-api-contract",
    "writing-qa-plan",
    "writing-runbooks",
    "agent-handoff-prep"
)

foreach ($skill in $skills) {
    xcopy /E /I "$env:USERPROFILE\.claude\skills\$skill" "C:\backup\planning-center\$skill"
}
```

```bash
# Mac/Linux - Copy specific skills
skills=(
    "planning-orchestrator"
    "writing-prd"
    "writing-trd"
    "writing-design-doc"
    "writing-adr"
    "writing-c4-architecture"
    "writing-data-model"
    "writing-api-contract"
    "writing-qa-plan"
    "writing-runbooks"
    "agent-handoff-prep"
)

mkdir -p ~/backup/planning-center
for skill in "${skills[@]}"; do
    cp -r ~/.claude/skills/$skill ~/backup/planning-center/
done
```

### Method 3: Git Repository (Best for Teams)

**Create a dedicated repository for your skills:**

```bash
# Create skills repo
mkdir claude-planning-center
cd claude-planning-center
git init

# Copy skills into repo
cp -r ~/.claude/skills/planning-orchestrator ./skills/
cp -r ~/.claude/skills/writing-prd ./skills/
cp -r ~/.claude/skills/writing-trd ./skills/
cp -r ~/.claude/skills/writing-design-doc ./skills/
cp -r ~/.claude/skills/writing-adr ./skills/
cp -r ~/.claude/skills/writing-c4-architecture ./skills/
cp -r ~/.claude/skills/writing-data-model ./skills/
cp -r ~/.claude/skills/writing-api-contract ./skills/
cp -r ~/.claude/skills/writing-qa-plan ./skills/
cp -r ~/.claude/skills/writing-runbooks ./skills/
cp -r ~/.claude/skills/agent-handoff-prep ./skills/

# Add install script
cat > install.sh << 'EOF'
#!/bin/bash
SKILLS_DIR="${HOME}/.claude/skills"
mkdir -p "$SKILLS_DIR"
cp -r ./skills/* "$SKILLS_DIR/"
echo "Planning Center installed to $SKILLS_DIR"
EOF
chmod +x install.sh

# Add Windows install script
cat > install.ps1 << 'EOF'
$skillsDir = "$env:USERPROFILE\.claude\skills"
New-Item -ItemType Directory -Force -Path $skillsDir
Copy-Item -Recurse -Force .\skills\* $skillsDir
Write-Host "Planning Center installed to $skillsDir"
EOF

# Commit
git add .
git commit -m "Initial Planning Center skills"

# Push to remote (GitHub, GitLab, etc.)
git remote add origin https://github.com/yourusername/claude-planning-center.git
git push -u origin main
```

**To install from repo:**

```bash
# Clone and install
git clone https://github.com/yourusername/claude-planning-center.git
cd claude-planning-center
./install.sh  # Mac/Linux
# OR
./install.ps1  # Windows PowerShell
```

---

## Setup Instructions

### Step 1: Verify Claude Code Installation

```bash
# Check Claude Code is installed
claude --version
# Expected: claude-code version X.X.X
```

### Step 2: Create Skills Directory (If Needed)

```powershell
# Windows
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude\skills"
```

```bash
# Mac/Linux
mkdir -p ~/.claude/skills
```

### Step 3: Copy Skills Files

Use one of the [Installation Methods](#installation-methods) above.

### Step 4: Verify Skills Structure

After installation, your `~/.claude/skills/` should look like:

```
~/.claude/skills/
├── planning-orchestrator/
│   └── SKILL.md
├── writing-prd/
│   └── SKILL.md
├── writing-trd/
│   └── SKILL.md
├── writing-design-doc/
│   └── SKILL.md
├── writing-adr/
│   └── SKILL.md
├── writing-c4-architecture/
│   └── SKILL.md
├── writing-data-model/
│   └── SKILL.md
├── writing-api-contract/
│   └── SKILL.md
├── writing-qa-plan/
│   └── SKILL.md
├── writing-runbooks/
│   └── SKILL.md
└── agent-handoff-prep/
    └── SKILL.md
```

### Step 5: Restart Claude Code

Skills are loaded when Claude Code starts. Restart your session:

```bash
# Exit current session
exit

# Start new session
claude
```

### Step 6: Verify Skills Are Available

In Claude Code, ask:

```
What skills do you have available?
```

Or try invoking a skill:

```
/planning-orchestrator
```

---

## Verification Checklist

Run through this checklist to verify installation:

### File Verification

```powershell
# Windows - Check all skills exist
$skills = @(
    "planning-orchestrator",
    "writing-prd", "writing-trd", "writing-design-doc",
    "writing-adr", "writing-c4-architecture", "writing-data-model",
    "writing-api-contract", "writing-qa-plan", "writing-runbooks",
    "agent-handoff-prep"
)

foreach ($skill in $skills) {
    $path = "$env:USERPROFILE\.claude\skills\$skill\SKILL.md"
    if (Test-Path $path) {
        Write-Host "[OK] $skill" -ForegroundColor Green
    } else {
        Write-Host "[MISSING] $skill" -ForegroundColor Red
    }
}
```

```bash
# Mac/Linux - Check all skills exist
skills=(
    "planning-orchestrator"
    "writing-prd" "writing-trd" "writing-design-doc"
    "writing-adr" "writing-c4-architecture" "writing-data-model"
    "writing-api-contract" "writing-qa-plan" "writing-runbooks"
    "agent-handoff-prep"
)

for skill in "${skills[@]}"; do
    if [ -f ~/.claude/skills/$skill/SKILL.md ]; then
        echo "[OK] $skill"
    else
        echo "[MISSING] $skill"
    fi
done
```

### Functional Verification

In Claude Code session:

1. **Test skill loading:**
   ```
   /planning-orchestrator
   ```
   Expected: Skill loads and shows orchestrator introduction

2. **Test individual skill:**
   ```
   /writing-prd
   ```
   Expected: Skill loads and asks for project context

3. **Check skill list:**
   ```
   What documentation skills are available?
   ```
   Expected: Lists all 11 Planning Center skills

---

## Project-Specific Configuration

### Creating Project Documentation Folder

When starting a new project, create the standard docs structure:

```bash
# Create docs structure
mkdir -p docs/{requirements,design,architecture/{decisions,c4,data},api,qa,runbooks,plans}

# Create .gitkeep files to preserve empty dirs
touch docs/requirements/.gitkeep
touch docs/design/.gitkeep
touch docs/architecture/decisions/.gitkeep
touch docs/architecture/c4/.gitkeep
touch docs/architecture/data/.gitkeep
touch docs/api/.gitkeep
touch docs/qa/.gitkeep
touch docs/runbooks/.gitkeep
touch docs/plans/.gitkeep
```

### Project docs/ Structure

```
your-project/
├── docs/
│   ├── requirements/           # PRD, TRD documents
│   │   ├── YYYY-MM-DD-feature-prd.md
│   │   └── YYYY-MM-DD-feature-trd.md
│   ├── design/                 # Design documents
│   │   └── YYYY-MM-DD-feature-design.md
│   ├── architecture/
│   │   ├── decisions/          # ADRs
│   │   │   ├── ADR-001-title.md
│   │   │   └── ADR-002-title.md
│   │   ├── c4/                 # C4 diagrams
│   │   │   ├── 01-context.md
│   │   │   ├── 02-containers.md
│   │   │   └── 03-components.md
│   │   └── data/               # Data models
│   │       └── YYYY-MM-DD-domain-data-model.md
│   ├── api/                    # API contracts
│   │   └── openapi.yaml
│   ├── qa/                     # QA plans
│   │   └── YYYY-MM-DD-feature-qa-plan.md
│   ├── runbooks/               # Operational runbooks
│   │   ├── deployment/
│   │   ├── incident-response/
│   │   └── maintenance/
│   ├── plans/                  # Implementation plans
│   │   └── YYYY-MM-DD-feature-plan.md
│   └── AGENT_HANDOFF.md        # Agent handoff package
├── src/
├── tests/
└── ...
```

### Optional: Project-Level CLAUDE.md

Create a `CLAUDE.md` in your project root to provide project-specific context:

```markdown
# Project: [Your Project Name]

## Overview
[Brief description of what this project does]

## Tech Stack
- Language: [e.g., TypeScript, Python]
- Framework: [e.g., Next.js, FastAPI]
- Database: [e.g., PostgreSQL, MongoDB]
- Infrastructure: [e.g., AWS, Vercel]

## Key Directories
- `src/` - Source code
- `tests/` - Test files
- `docs/` - Documentation (using 7-layer model)

## Conventions
- [Any project-specific conventions]

## Documentation Status
- [ ] PRD: Not started / In progress / Complete
- [ ] TRD: Not started / In progress / Complete
- [ ] Design Doc: Not started / In progress / Complete
- [ ] Architecture: Not started / In progress / Complete
- [ ] QA Plan: Not started / In progress / Complete
- [ ] Implementation Plan: Not started / In progress / Complete
```

---

## Troubleshooting

### Skills Not Loading

**Symptom:** `/planning-orchestrator` doesn't work

**Solutions:**
1. Restart Claude Code session
2. Verify file exists: `~/.claude/skills/planning-orchestrator/SKILL.md`
3. Check file has valid frontmatter:
   ```yaml
   ---
   name: planning-orchestrator
   description: Use when starting a new project...
   ---
   ```
4. Check for file permission issues

### Skill Loads But Doesn't Work Correctly

**Symptom:** Skill loads but behavior is wrong

**Solutions:**
1. Re-copy the skill file from backup/source
2. Check for file corruption (special characters, encoding)
3. Verify the complete file was copied (not truncated)

### Skills Not Available in New Project

**Remember:** Skills are user-level, not project-level. They should work in any project automatically.

**If not working:**
1. Confirm skills are in `~/.claude/skills/` (not in project folder)
2. Start a fresh Claude Code session
3. Check `~/.claude/` permissions

### Wrong Output Directory

**Symptom:** Documents created in wrong location

**Solution:** The skills are designed to output to `docs/` in current working directory. Make sure:
1. You're in the correct project directory
2. The `docs/` folder exists
3. You have write permissions

---

## Quick Start After Installation

Once installed, here's how to use the Planning Center:

### Option 1: Full Orchestration

```
/planning-orchestrator
```

Then provide your vision/goals document when prompted.

### Option 2: Individual Skills

```
/writing-prd           # Start with requirements
/writing-trd           # Define technical constraints
/writing-design-doc    # Create detailed design
/writing-adr           # Document key decisions
/writing-plans         # Create implementation plan
```

### Option 3: Fast Track

```
/planning-orchestrator --fast
```

Uses more defaults, asks fewer questions.

---

## Sharing with Team

### For Team Installation

1. **Create shared repo** with all skill files
2. **Add to team documentation** about using `/planning-orchestrator`
3. **Include install script** in repo
4. **Add verification script** to confirm installation

### Example Team README

```markdown
# Team Planning Center

## Installation

1. Clone this repo
2. Run install script:
   - Mac/Linux: `./install.sh`
   - Windows: `.\install.ps1`
3. Restart Claude Code
4. Verify: `/planning-orchestrator`

## Usage

Start any new feature with:
```
/planning-orchestrator
```

This will guide you through creating world-class documentation before writing code.

## Available Skills

[List skills and their purposes]
```

---

## Summary

| Task | Command/Action |
|------|----------------|
| Install all skills | Copy `~/.claude/skills/` directory |
| Verify installation | Run verification script |
| Start new project | `/planning-orchestrator` |
| Create docs structure | `mkdir -p docs/{requirements,design,...}` |
| Check skill works | `/writing-prd` |

**Key Points:**
- Skills are USER-level, not project-level
- Install once at `~/.claude/skills/`, use everywhere
- Restart Claude Code after installing skills
- Create `docs/` structure in each project

---

*Guide created: January 2026*
