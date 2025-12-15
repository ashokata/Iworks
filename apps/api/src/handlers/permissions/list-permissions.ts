/**
 * List All Permissions
 * GET /api/permissions
 *
 * Returns all available permissions, optionally grouped by category
 *
 * Query parameters:
 * - grouped: If true, returns permissions grouped by category
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { permissionService } from '../../services/permission.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Permissions-List] Handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const params = event.queryStringParameters || {};
    const grouped = params.grouped === 'true';

    let result;
    if (grouped) {
      result = permissionService.getPermissionsByCategory();
      console.log('[Permissions-List] Returning grouped permissions');
    } else {
      result = permissionService.getAllPermissions();
      console.log('[Permissions-List] Returning all permissions:', result.length);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        permissions: result,
        total: grouped ? Object.keys(result).length : result.length,
      }),
    };
  } catch (error: any) {
    console.error('[Permissions-List] Error:', error);
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
