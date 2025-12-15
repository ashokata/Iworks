/**
 * Assign Role to Employee
 * POST /api/employee-roles/assign
 *
 * Request body:
 * {
 *   "employeeId": "emp-123",
 *   "roleId": "role-456",
 *   "assignedBy": "user-789" (optional)
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { employeeRoleService } from '../../services/employee-role.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[EmployeeRoles-Assign] Handler invoked');

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
    const { employeeId, roleId, assignedBy } = body;

    if (!employeeId || !roleId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: employeeId and roleId are required'
        }),
      };
    }

    console.log('[EmployeeRoles-Assign] Assigning role:', { employeeId, roleId, assignedBy: assignedBy || userId });

    const assignment = await employeeRoleService.assignRole({
      employeeId,
      roleId,
      assignedBy: assignedBy || userId,
    });

    console.log('[EmployeeRoles-Assign] Role assigned successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        assignment,
      }),
    };
  } catch (error: any) {
    console.error('[EmployeeRoles-Assign] Error:', error);
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
