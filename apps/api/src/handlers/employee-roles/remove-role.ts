/**
 * Remove Role from Employee
 * DELETE /api/employee-roles/remove
 *
 * Request body:
 * {
 *   "employeeId": "emp-123",
 *   "roleId": "role-456"
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { employeeRoleService } from '../../services/employee-role.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[EmployeeRoles-Remove] Handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { employeeId, roleId } = body;

    if (!employeeId || !roleId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: employeeId and roleId are required'
        }),
      };
    }

    console.log('[EmployeeRoles-Remove] Removing role:', { employeeId, roleId });

    await employeeRoleService.removeRole(employeeId, roleId);

    console.log('[EmployeeRoles-Remove] Role removed successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Role removed successfully',
      }),
    };
  } catch (error: any) {
    console.error('[EmployeeRoles-Remove] Error:', error);

    // Handle not found case
    if (error.code === 'P2025') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Not Found',
          message: 'Role assignment not found',
        }),
      };
    }

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
