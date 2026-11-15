# Incident Response & Disaster Recovery Runbook

## 1. Incident Severity Classification Matrix

| Severity Level | Definition | Response SLA | Resolution Target | Example Scenarios |
| :--- | :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Entire POS system down; cashiers unable to issue receipts or process checkout. | 15 minutes | < 2 hours | MongoDB unreachable, backend container crash looping, critical authentication outage. |
| **SEV-2 (Major)** | Major functionality impaired with business impact; partial workarounds available. | 30 minutes | < 4 hours | PDF generation failing, thermal printing misformatted, analytics reporting down. |
| **SEV-3 (Minor)** | Minor bugs or degraded performance without complete loss of business flow. | 2 hours | < 24 hours | Search query slowness, minor theme glitch, keyboard shortcut conflict. |
| **SEV-4 (Low)** | Informational or cosmetic issues with negligible business impact. | 1 business day | Scheduled release | Minor typos, documentation discrepancies. |

---

## 2. Emergency Triage & Diagnostic Playbooks

### Playbook A: Application Completely Unreachable (502 / 503 / Connection Refused)
1. **Check container process status**:
   ```bash
   docker compose ps
   ```
2. **Inspect backend container crash logs**:
   ```bash
   docker compose logs --tail=100 backend
   ```
3. **Check database connectivity**:
   ```bash
   curl http://localhost:5001/api/health/ready
   # If ready endpoint returns 503, inspect MongoDB health
   docker compose logs --tail=50 mongodb
   ```
4. **Restart degraded containers**:
   ```bash
   docker compose restart backend
   ```

---

### Playbook B: Database Disconnection & Failover
1. **Verify network connectivity to MongoDB host**:
   ```bash
   docker compose exec backend ping mongodb
   ```
2. **Check connection pool saturation**:
   - Inspect MongoDB connection counts via `mongosh`:
     ```bash
     mongosh "mongodb://localhost:27017/juice_pos" --eval "db.serverStatus().connections"
     ```
3. **If using MongoDB Atlas**:
   - Check Atlas status console for automatic primary replica failover.
   - Verify network security whitelist has not dropped the app host IP.

---

### Playbook C: Memory Leak & High CPU Utilization
1. **Identify resource-consuming container**:
   ```bash
   docker stats
   ```
2. **Inspect structured log errors**:
   - Look for unhandled exceptions or excessive query loops:
     ```bash
     docker compose logs backend | grep -i "ERROR" | tail -n 20
     ```
3. **Trigger graceful container restart**:
   ```bash
   docker compose restart backend
   ```

---

## 3. Disaster Recovery & Backup Procedures

### Targets
- **Recovery Point Objective (RPO)**: < 1 hour (maximum 1 hour of potential data loss).
- **Recovery Time Objective (RTO)**: < 30 minutes (system fully operational within 30 minutes of disaster declaration).

### Automated Daily Backup Script
Execute via scheduled cron job (`0 2 * * * /opt/receipt_app/scripts/backup.sh`):

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/receipt_app"
DATE=$(date +%Y%m%d_%H%M%S)
TARGET_DIR="${BACKUP_DIR}/${DATE}"

mkdir -p "${TARGET_DIR}"

echo "Starting MongoDB backup..."
docker compose exec -T mongodb mongodump \
  --db=juice_pos \
  --archive > "${TARGET_DIR}/juice_pos_${DATE}.archive"

# Encrypt archive
gzip "${TARGET_DIR}/juice_pos_${DATE}.archive"

# Retain last 30 days only
find "${BACKUP_DIR}" -type d -mtime +30 -exec rm -rf {} +

echo "Backup completed successfully at ${DATE}."
```

### Complete Database Restoration Runbook
In the event of database corruption or total host failure:

1. **Stop active backend traffic to prevent writes during restore**:
   ```bash
   docker compose stop backend
   ```

2. **Decompress and restore archive using `mongorestore`**:
   ```bash
   gunzip -c /var/backups/receipt_app/YYYYMMDD_HHMMSS/juice_pos_YYYYMMDD_HHMMSS.archive.gz | \
     docker compose exec -T mongodb mongorestore \
       --drop \
       --nsInclude="juice_pos.*" \
       --archive
   ```

3. **Verify restored data integrity**:
   ```bash
   docker compose exec -T mongodb mongosh "mongodb://localhost:27017/juice_pos" --eval "
     print('Receipt count:', db.receipts.countDocuments());
     print('Flavour count:', db.flavours.countDocuments());
     print('User count:', db.users.countDocuments());
   "
   ```

4. **Restart backend and run readiness probe**:
   ```bash
   docker compose start backend
   curl http://localhost:5001/api/health/ready
   ```

---

## 4. Compromised Secret Rotation Playbook

If `JWT_SECRET` is leaked or compromised:

1. **Generate fresh high-entropy cryptographic secret**:
   ```bash
   NEW_SECRET=$(openssl rand -base64 48)
   ```
2. **Update environment configuration**:
   - Edit `.env` and set `JWT_SECRET=${NEW_SECRET}`.
3. **Restart backend service**:
   ```bash
   docker compose up -d backend
   ```
4. **Impact**: All active user sessions will immediately be invalidated and require re-login, terminating any unauthorized sessions.
