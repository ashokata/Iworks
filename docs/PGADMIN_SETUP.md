# pgAdmin Setup for AWS PostgreSQL

This guide will help you connect to your AWS Aurora PostgreSQL database using pgAdmin.

---

## Prerequisites

1. **pgAdmin 4** installed ([Download here](https://www.pgadmin.org/download/))
2. **Network access** to the AWS VPC (see options below)

---

## Network Access Options

Since the database is in a **private subnet**, you need one of these:

### Option 1: AWS Systems Manager Session Manager (Recommended)

**Step 1: Create/Use an EC2 Instance in the VPC**

If you don't have one, create a small EC2 instance in a public subnet of your VPC:
- Instance type: `t3.micro` (free tier eligible)
- Subnet: Public subnet in your VPC
- Security group: Allow SSH (port 22) from your IP
- IAM role: Attach `AmazonSSMManagedInstanceCore` policy

**Step 2: Install SSM Agent** (usually pre-installed on Amazon Linux 2)

**Step 3: Port Forward via Session Manager**

```bash
aws ssm start-session \
  --target i-xxxxxxxxxxxxx \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["fieldsmartprostack-databaseb269d8bb-o7edqpyx821v.cluster-c6biqum2w39o.us-east-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["5432"]}'
```

This forwards `localhost:5432` → `RDS:5432` through the EC2 instance.

**Step 4: Connect pgAdmin to `localhost:5432`**

### Option 2: VPN Connection

Set up a VPN connection to your AWS VPC, then connect directly.

### Option 3: Bastion Host with SSH Tunneling

A bastion host is an EC2 instance in a public subnet that acts as a "jump server" to access private resources.

**How it works:**
```
Your Computer → SSH Tunnel → Bastion Host (EC2) → RDS Database (Private)
```

**Step 1: Create a Bastion Host EC2 Instance**

1. **Launch EC2 Instance:**
   - AMI: Amazon Linux 2023 or Ubuntu 22.04
   - Instance type: `t3.micro` (free tier eligible)
   - Network: Your VPC
   - Subnet: **Public subnet** (has internet gateway)
   - Auto-assign Public IP: **Enable**
   - Security Group: Create new with these rules:
     - **Inbound:** SSH (22) from your IP address
     - **Outbound:** All traffic (or at least PostgreSQL 5432 to RDS security group)

2. **Configure Security Group for RDS:**
   - Edit RDS security group
   - Add inbound rule:
     - Type: PostgreSQL
     - Port: 5432
     - Source: Bastion host security group (not your IP)

3. **Get SSH Key:**
   - Create/select a key pair during launch
   - Download the `.pem` file
   - Store it securely (e.g., `~/.ssh/bastion-key.pem`)

4. **Connect to Bastion:**
   ```bash
   ssh -i ~/.ssh/bastion-key.pem ec2-user@<bastion-public-ip>
   ```

**Step 2: Configure SSH Tunnel in pgAdmin**

pgAdmin has built-in SSH tunneling support:

1. **In pgAdmin Connection Dialog:**
   - Go to **SSH Tunnel** tab
   - Enable: ✅ **Use SSH tunneling**

2. **SSH Tunnel Settings:**
   | Field | Value |
   |-------|-------|
   | **Tunnel host** | `<bastion-public-ip>` or `<bastion-public-dns>` |
   | **Tunnel port** | `22` |
   | **Username** | `ec2-user` (Amazon Linux) or `ubuntu` (Ubuntu) |
   | **Authentication** | `Identity file` |
   | **Identity file** | Browse to your `.pem` key file |
   | **Passphrase** | Leave blank (unless key is encrypted) |

3. **Connection Settings (Main Tab):**
   | Field | Value |
   |-------|-------|
   | **Host name/address** | `fieldsmartprostack-databaseb269d8bb-o7edqpyx821v.cluster-c6biqum2w39o.us-east-1.rds.amazonaws.com` |
   | **Port** | `5432` |
   | **Database** | `fieldsmartpro` |
   | **Username** | `postgres` |
   | **Password** | `4T7OBv0nfgcMuKY7hw79DJFUxaBDQkPw` |

**Step 3: How the Tunnel Works**

When you connect:
1. pgAdmin establishes SSH connection to bastion host
2. SSH tunnel forwards `localhost:5432` → `bastion:5432` → `RDS:5432`
3. All database traffic is encrypted through the SSH tunnel
4. RDS only sees connections from the bastion host (secure!)

**Step 4: Test Connection**

Click **Save** and then **Test Connection** to verify it works.

**Alternative: Manual SSH Tunnel (Command Line)**

If you prefer to set up the tunnel manually:

```bash
# Create SSH tunnel
ssh -i ~/.ssh/bastion-key.pem \
    -L 5432:fieldsmartprostack-databaseb269d8bb-o7edqpyx821v.cluster-c6biqum2w39o.us-east-1.rds.amazonaws.com:5432 \
    -N \
    ec2-user@<bastion-public-ip>

# Keep this terminal open, then in pgAdmin:
# Host: localhost
# Port: 5432
```

**Security Best Practices:**

1. **Restrict Bastion Access:**
   - Only allow SSH from your specific IP
   - Use AWS Systems Manager Session Manager instead of SSH (more secure)

2. **Key Management:**
   - Never commit `.pem` files to git
   - Use `chmod 400` on key file: `chmod 400 ~/.ssh/bastion-key.pem`

3. **Auto-shutdown:**
   - Use AWS Instance Scheduler to stop bastion when not in use
   - Or use on-demand instances

4. **Monitoring:**
   - Enable CloudTrail to log SSH access
   - Use AWS GuardDuty for threat detection

---

## pgAdmin Connection Setup

### Step 1: Open pgAdmin

Launch pgAdmin 4 application.

### Step 2: Create New Server

1. Right-click on **Servers** in the left panel
2. Select **Create** → **Server...**

### Step 3: General Tab

| Field | Value |
|-------|-------|
| **Name** | `FieldSmartPro AWS Production` |
| **Server group** | `Servers` |
| **Comments** | `AWS Aurora PostgreSQL - Production Database` |

### Step 4: Connection Tab

| Field | Value |
|-------|-------|
| **Host name/address** | `fieldsmartprostack-databaseb269d8bb-o7edqpyx821v.cluster-c6biqum2w39o.us-east-1.rds.amazonaws.com` |
| **Port** | `5432` |
| **Maintenance database** | `fieldsmartpro` |
| **Username** | `postgres` |
| **Password** | `4T7OBv0nfgcMuKY7hw79DJFUxaBDQkPw` |
| **Save password?** | ✅ Check this box |

**Note:** If using port forwarding (Option 1), use:
- **Host name/address:** `localhost` (instead of the RDS endpoint)

### Step 5: SSL Tab

| Setting | Value |
|---------|-------|
| **SSL mode** | `Require` |
| **Client certificate** | Leave blank |
| **Client certificate key** | Leave blank |
| **Root certificate** | Leave blank |

### Step 6: Advanced Tab (Optional)

| Field | Value |
|-------|-------|
| **DB restriction** | `fieldsmartpro` |

### Step 7: Save

Click **Save** to create the connection.

---

## Connection String Reference

For reference, here's the full connection string:

```
postgresql://postgres:4T7OBv0nfgcMuKY7hw79DJFUxaBDQkPw@fieldsmartprostack-databaseb269d8bb-o7edqpyx821v.cluster-c6biqum2w39o.us-east-1.rds.amazonaws.com:5432/fieldsmartpro?sslmode=require
```

---

## Troubleshooting

### Error: "Can't reach database server"

**Cause:** Database is in a private subnet, not accessible from your local network.

**Solutions:**
1. Use AWS Systems Manager Session Manager port forwarding (Option 1 above)
2. Set up VPN connection to VPC
3. Use a bastion host with SSH tunneling

### Error: "SSL connection required"

**Solution:** Set SSL mode to `Require` in the SSL tab.

### Error: "Password authentication failed"

**Solution:** 
1. Verify password is correct
2. Check if password was rotated in Secrets Manager
3. Retrieve fresh password:
   ```bash
   aws secretsmanager get-secret-value \
     --secret-id arn:aws:secretsmanager:us-east-1:820242944174:secret:DBSecretD58955BC-AU1rR8KC2RAZ-DmIoMI \
     --region us-east-1
   ```

### Error: "Connection timeout"

**Solution:**
1. Check security group allows inbound on port 5432 from your IP/VPC
2. Verify RDS cluster is in "Available" state
3. Check network connectivity (ping, telnet)

---

## Security Group Configuration

Ensure your RDS security group allows connections:

**Inbound Rule:**
- Type: PostgreSQL
- Protocol: TCP
- Port: 5432
- Source: 
  - Your VPC CIDR (for internal connections)
  - Your IP address (if making public, not recommended)
  - Security group of EC2/bastion (recommended)

---

## Quick Test Connection

After setting up, test with a simple query:

```sql
SELECT version();
SELECT current_database();
SELECT COUNT(*) FROM "Customer";
```

---

## Alternative: Use Prisma Studio

If pgAdmin setup is complex, you can use Prisma Studio instead:

```bash
cd apps/api
export DATABASE_URL="postgresql://postgres:4T7OBv0nfgcMuKY7hw79DJFUxaBDQkPw@fieldsmartprostack-databaseb269d8bb-o7edqpyx821v.cluster-c6biqum2w39o.us-east-1.rds.amazonaws.com:5432/fieldsmartpro?schema=public&sslmode=require"
npx prisma studio
```

This opens a web UI at http://localhost:5555

---

## Connection Details Summary

| Parameter | Value |
|-----------|-------|
| **Host** | `fieldsmartprostack-databaseb269d8bb-o7edqpyx821v.cluster-c6biqum2w39o.us-east-1.rds.amazonaws.com` |
| **Port** | `5432` |
| **Database** | `fieldsmartpro` |
| **Username** | `postgres` |
| **Password** | `4T7OBv0nfgcMuKY7hw79DJFUxaBDQkPw` |
| **SSL Mode** | `Require` |

---

**Note:** The password is stored in AWS Secrets Manager. If it gets rotated, you'll need to update pgAdmin with the new password.

