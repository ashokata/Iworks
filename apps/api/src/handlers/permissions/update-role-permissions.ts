/**
 * Update Role Permissions
 * PUT /api/permissions/roles/{roleId}
 *
 * Updates the permissions assigned to a role
 *
 * Request body:
 * {
 *   "permissions": ["CUSTOMERS_VIEW", "CUSTOMERS_CREATE", ...]
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { permissionService } from '../../services/permission.postgres.service';
import { Permission } from '@prisma/client';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Permissions-UpdateRole] Handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const roleId = event.pathParameters?.roleId;

    if (!roleId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing roleId parameter' }),
      };
    }

    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { permissions } = body;

    if (!permissions || !Array.isArray(permissions)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing or invalid permissions array in request body' }),
      };
    }

    console.log('[Permissions-UpdateRole] Updating permissions for role:', roleId, 'with', permissions.length, 'permissions');

    const updatedRole = await permissionService.updateRolePermissions(roleId, permissions as Permission[]);

    console.log('[Permissions-UpdateRole] Updated successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        role: updatedRole,
      }),
    };
  } catch (error: any) {
    console.error('[Permissions-UpdateRole] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
      }),
    };
  }
};
