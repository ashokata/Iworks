-- CreateIndex
CREATE UNIQUE INDEX "unique_tenant_email" ON "customers"("tenantId", "email");
