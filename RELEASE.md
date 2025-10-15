# 📦 Release Process (100% Automatico con AI)

## 🤖 **Sistema Completamente Automatico**

### **Per TE (Maintainer):**

```bash
# Fai modifiche
vim src/core/scanner.ts

# Committa e pusha
git commit -am "feat: cool feature"
git push

# FATTO! 🎉
# AI genera changeset automaticamente
```

### **Per CONTRIBUTORS:**

```bash
# Apri PR
git push

# FATTO! 🎉  
# AI genera changeset automaticamente sulla PR
```

### **Per PUBBLICARE:**

```bash
# Vai su GitHub
# Merge "Release PR" (creata dal bot)
# FATTO! 🎉
# Pubblica automaticamente su npm
```

**Zero sforzo manuale!** 🚀

---

## 🔄 **Workflow Completo**

```
1. Developer → Push codice
   ↓
2. CI → Test automatici
   ↓
3. AI → Analizza modifiche
   ├─ Detecta tipo (patch/minor/major)
   ├─ Genera descrizione user-friendly
   └─ Crea changeset automaticamente
   ↓
4. Bot → Aggiorna "Release PR"
   ├─ Accumula changesets
   └─ Aggiorna CHANGELOG preview
   ↓
5. Maintainer → Merge "Release PR"
   ↓
6. GitHub Actions → Pubblica
   ├─ Version bump
   ├─ npm publish 🚀
   └─ GitHub Release

Total effort: 1 click! ✅
```

---

## ⚙️ **Setup (Una Volta)**

### **1. Configura AI API Key su GitHub**

**Opzione A: Anthropic (Raccomandato)**
- Vai su: https://console.anthropic.com/
- Crea API key
- GitHub → Settings → Secrets → `ANTHROPIC_API_KEY`

**Opzione B: OpenAI**
- Vai su: https://platform.openai.com/api-keys
- Crea API key
- GitHub → Settings → Secrets → `OPENAI_API_KEY`

**Costo:** ~$0.002 per PR (quasi gratis!)

### **2. Configura NPM Token**

- npm: `npm token create` (scegli "Automation")
- GitHub → Settings → Secrets → `NPM_MODKILL_TOKEN`

### **3. Done!**

Tutto il resto è automatico! 🎊

---

## 🛡️ **Gestione Fallimenti**

### **Se AI Non Funziona** (no fondi, rate limit, errore)

1. **AI fallisce** → GitHub commenta sulla PR
2. **Messaggio:** "Please run: `npm run changeset`"
3. **Tu esegui manuale** (fallback sicuro)
4. **Continua normalmente**

**Mai bloccato!** Il sistema ha sempre un piano B.

---

## 💡 **Come Funziona l'AI**

### **Cosa Analizza:**
- File modificati
- Commit messages
- Tipo di modifica (API, logic, fix)

### **Cosa Genera:**
```markdown
---
'@lisandrof/modkill': minor
---

Added support for excluding directories
```

### **Smart Detection:**
- Nuovi export → `minor`
- Bug fix → `patch`
- API changes → `major`
- Solo docs/test → skip

---

## 📊 **Esempio Reale**

### **Tu fai:**
```bash
# 1. Fix bug
vim src/core/scanner.ts
git commit -m "fix: handle symlinks"
git push
```

### **AI genera automaticamente:**
```markdown
---
'@lisandrof/modkill': patch
---

Fixed crash when scanning symbolic links
```

### **Bot crea/aggiorna Release PR:**
```markdown
## 0.1.1

### Patch Changes
- Fixed crash when scanning symbolic links
```

### **Tu mergi Release PR → Pubblicato!** 🚀

---

## 🎯 **Opzioni Avanzate**

### **AI Locale (Opzionale)**

Se vuoi generare changeset in locale:

```bash
# Setup
export ANTHROPIC_API_KEY=sk-ant-...

# Usa
npm run changeset:ai
```

### **Disabilitare AI**

Se preferisci manuale:

```bash
# Crea sempre changeset manualmente
npm run changeset

# AI non sovrascriverà (detecta esistente)
```

---

## 🚨 **Troubleshooting**

### "AI non genera changeset"

**Possibili cause:**
1. ❌ API key non configurata → Aggiungi `ANTHROPIC_API_KEY` secret
2. ❌ No fondi API → Ricarica o usa fallback manuale
3. ❌ Solo modifiche test/docs → Corretto, skip automatico
4. ✅ Changeset già esiste → Corretto, skip automatico

**Soluzione:** GitHub commenta sempre cosa fare!

### "Changeset wrong type"

**Soluzione:**
```bash
# Modifica il file
vim .changeset/ai-*.md
# Cambia type o description
git commit --amend
git push --force
```

---

## 📋 **Best Practices**

✅ **Lascia AI gestire** routine changes (90% dei casi)
✅ **Review changeset** generati prima del merge Release PR  
✅ **Edit se necessario** - sono solo file markdown
✅ **Usa manuale per breaking changes** complessi

---

## 💰 **Costi**

- **Anthropic Haiku:** ~$0.001/changeset
- **OpenAI GPT-4o-mini:** ~$0.002/changeset

**Per 100 PR/mese:** <$0.20 ☕

**Free tier Anthropic:** $5 credit = ~5000 changesets! 🎉

---

## 🎊 **Risultato Finale**

### **Prima (Manuale):**
```bash
git commit -m "feat: X"
npm run changeset  ← Manual
# Rispondi prompt    ← Manual
# Scrivi descrizione ← Manual
git push
```

### **Ora (Automatico):**
```bash
git commit -m "feat: X"
git push

# AI fa tutto! 🤖
# Solo merge Release PR quando pronto! ✨
```

---

**Domande?** Vedi [AI_CHANGESET.md](AI_CHANGESET.md) per dettagli!
