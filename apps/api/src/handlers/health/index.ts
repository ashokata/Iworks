import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async () => {
  try {
    console.log('Health check called');
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      AWS_REGION: process.env.AWS_REGION,
    });

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'fieldsmartpro-api',
        environment: process.env.NODE_ENV || 'unknown',
        region: process.env.AWS_REGION || 'unknown',
      }),
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export const healthHandler = handler;
