/**
 * Replace Employee Roles
 * PUT /api/employee-roles/replace
 *
 * Replaces all roles for an employee with a new set of roles
 *
 * Request body:
 * {
 *   "employeeId": "emp-123",
 *   "roleIds": ["role-456", "role-789"],
 *   "assignedBy": "user-789" (optional)
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { employeeRoleService } from '../../services/employee-role.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[EmployeeRoles-Replace] Handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    // Get user ID from headers for audit trail
    const userId = event.headers['X-User-Id'] || event.headers['x-user-id'];

    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { employeeId, roleIds, assignedBy } = body;

    if (!employeeId || !roleIds || !Array.isArray(roleIds)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: employeeId and roleIds (array) are required'
        }),
      };
    }

    console.log('[EmployeeRoles-Replace] Replacing roles for employee:', employeeId, 'with', roleIds.length, 'roles');

    const assignments = await employeeRoleService.replaceEmployeeRoles(
      employeeId,
      roleIds,
      assignedBy || userId
    );

    console.log('[EmployeeRoles-Replace] Roles replaced successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        assignments,
        total: assignments.length,
      }),
    };
  } catch (error: any) {
    console.error('[EmployeeRoles-Replace] Error:', error);
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
