/**
 * Get Role Permissions
 * GET /api/permissions/roles/{roleId}
 *
 * Returns all permissions assigned to a specific role
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { permissionService } from '../../services/permission.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Permissions-GetRole] Handler invoked');

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

    console.log('[Permissions-GetRole] Fetching permissions for role:', roleId);

    const permissions = await permissionService.getRolePermissions(roleId);

    console.log('[Permissions-GetRole] Found permissions:', permissions.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        roleId,
        permissions,
        total: permissions.length,
      }),
    };
  } catch (error: any) {
    console.error('[Permissions-GetRole] Error:', error);
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
