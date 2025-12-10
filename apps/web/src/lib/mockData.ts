// Mock users for testing
export const MOCK_USERS = [
  // InField Works users
  {
    id: 'user1',
    tenantId: 'tenant1',
    email: 'admin@infieldworks.com',
    username: 'iw_admin',
    password: 'password123',
    name: 'Alex Johnson',
    role: 'admin',
  },
  {
    id: 'user2',
    tenantId: 'tenant1',
    email: 'tech@infieldworks.com',
    username: 'iw_tech',
    password: 'password123',
    name: 'Taylor Smith',
    role: 'technician',
  },
  
  // Acme Corp users
  {
    id: 'user3',
    tenantId: 'tenant2',
    email: 'admin@acmecorp.com',
    username: 'acme_admin',
    password: 'password123',
    name: 'Jordan Lee',
    role: 'admin',
  },
  {
    id: 'user4',
    tenantId: 'tenant2',
    email: 'tech@acmecorp.com',
    username: 'acme_tech',
    password: 'password123',
    name: 'Morgan Taylor',
    role: 'technician',
  },
  
  // Globex Inc users
  {
    id: 'user5',
    tenantId: 'tenant3',
    email: 'admin@globexinc.com',
    username: 'globex_admin',
    password: 'password123',
    name: 'Riley Wilson',
    role: 'admin',
  },
  {
    id: 'user6',
    tenantId: 'tenant3',
    email: 'tech@globexinc.com',
    username: 'globex_tech',
    password: 'password123',
    name: 'Casey Brown',
    role: 'technician',
  },
];

// Mock tenants
export const MOCK_TENANTS = [
  {
    id: 'tenant1',
    name: 'InField Works',
    slug: 'infieldworks',
    domain: 'infieldworks.com',
    logo: '/infield-works-logo.png',
    createdAt: '2024-01-01',
    settings: {
      theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
      },
      features: {
        enableInvoicing: true,
        enableReports: true,
        enableCustomerPortal: true,
      }
    }
  },
  {
    id: 'tenant2',
    name: 'Acme Corporation',
    slug: 'acmecorp',
    domain: 'acmecorp.com',
    logo: '/logo-acme.png',
    createdAt: '2024-02-15',
    settings: {
      theme: {
        primaryColor: '#EF4444',
        secondaryColor: '#F59E0B',
      },
      features: {
        enableInvoicing: true,
        enableReports: false,
        enableCustomerPortal: false,
      }
    }
  },
  {
    id: 'tenant3',
    name: 'Globex Inc',
    slug: 'globex',
    domain: 'globexinc.com',
    logo: '/logo-globex.png',
    createdAt: '2024-03-10',
    settings: {
      theme: {
        primaryColor: '#8B5CF6',
        secondaryColor: '#EC4899',
      },
      features: {
        enableInvoicing: true,
        enableReports: true,
        enableCustomerPortal: true,
      }
    }
  }
];
