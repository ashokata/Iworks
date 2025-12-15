/**
 * List Employee Role Assignments
 * GET /api/employee-roles
 *
 * Query parameters:
 * - employeeId: Filter by employee ID
 * - roleId: Filter by role ID
 * - includeRoleDetails: Include role details (default: false)
 * - includeEmployeeDetails: Include employee details (default: false)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { employeeRoleService } from '../../services/employee-role.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[EmployeeRoles-List] Handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const params = event.queryStringParameters || {};
    const tenantId = event.headers['X-Tenant-Id'] || event.headers['x-tenant-id'];

    let result;

    if (params.employeeId) {
      // Get roles for specific employee
      console.log('[EmployeeRoles-List] Fetching roles for employee:', params.employeeId);
      result = await employeeRoleService.getEmployeeRoles({
        employeeId: params.employeeId,
        includeRoleDetails: params.includeRoleDetails === 'true',
      });
    } else if (params.roleId) {
      // Get employees for specific role
      console.log('[EmployeeRoles-List] Fetching employees for role:', params.roleId);
      result = await employeeRoleService.getRoleEmployees({
        roleId: params.roleId,
        tenantId: tenantId,
        includeEmployeeDetails: params.includeEmployeeDetails === 'true',
        status: params.status as any,
      });
    } else if (tenantId) {
      // Get all employee-role assignments for tenant
      console.log('[EmployeeRoles-List] Fetching all assignments for tenant:', tenantId);
      result = await employeeRoleService.getTenantEmployeeRoles(
        tenantId,
        params.status as any
      );
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Must provide either employeeId, roleId, or X-Tenant-Id header'
        }),
      };
    }

    console.log('[EmployeeRoles-List] Found assignments:', result.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        assignments: result,
        total: result.length,
      }),
    };
  } catch (error: any) {
    console.error('[EmployeeRoles-List] Error:', error);
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
