// Mock API Interceptor for Demo Mode
// This file intercepts all fetch requests if the user is in Demo mode (test@gmail.com).

const originalFetch = window.fetch;

const getStorage = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const mockResponse = (data, status = 200) => {
  return Promise.resolve(new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  }));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const setupMockApi = () => {
  console.log('🚀 Demo Mode Activated: Intercepting all API calls to use LocalStorage.');

  window.fetch = async (input, init) => {
    let url = input;
    if (typeof input === 'object' && input.url) {
      url = input.url;
    }

    // Only intercept /api/ calls. Skip auth to allow login/logout to hit real backend if needed,
    // though test@gmail.com is already logged in. 
    if (typeof url === 'string' && url.includes('/api/') && !url.includes('/api/auth/login')) {
      const method = (init && init.method) ? init.method.toUpperCase() : 'GET';
      const body = (init && init.body) ? JSON.parse(init.body) : null;

      // ---- /api/menu ----
      if (url.includes('/api/menu')) {
        let menu = getStorage('demo_menu');
        
        if (method === 'GET') {
          return mockResponse(menu);
        }
        if (method === 'POST') {
          const newItem = { id: generateId(), ...body, _id: generateId() };
          menu.push(newItem);
          setStorage('demo_menu', menu);
          return mockResponse(newItem, 201);
        }
        if (method === 'PUT') {
          const id = url.split('/').pop();
          menu = menu.map(item => item._id === id || item.id === id ? { ...item, ...body } : item);
          setStorage('demo_menu', menu);
          return mockResponse({ success: true });
        }
        if (method === 'DELETE') {
          const id = url.split('/').pop();
          menu = menu.filter(item => item._id !== id && item.id !== id);
          setStorage('demo_menu', menu);
          return mockResponse({ success: true });
        }
      }

      // ---- /api/inventory ----
      if (url.includes('/api/inventory')) {
        let inventory = getStorage('demo_inventory');
        
        if (method === 'GET') {
          return mockResponse(inventory);
        }
        if (method === 'POST') {
          const newItem = { id: generateId(), ...body, _id: generateId() };
          inventory.push(newItem);
          setStorage('demo_inventory', inventory);
          return mockResponse(newItem, 201);
        }
        if (method === 'PUT') {
          const id = url.split('/').pop();
          inventory = inventory.map(item => item._id === id || item.id === id ? { ...item, ...body } : item);
          setStorage('demo_inventory', inventory);
          return mockResponse({ success: true });
        }
      }

      // ---- /api/orders ----
      if (url.includes('/api/orders')) {
        let orders = getStorage('demo_orders');
        
        if (method === 'GET') {
          // If active orders only
          if (url.includes('?status=Preparing,Ready')) {
            return mockResponse(orders.filter(o => o.status === 'Preparing' || o.status === 'Ready'));
          }
          return mockResponse(orders);
        }
        if (method === 'POST') {
          const orderNum = orders.length + 1;
          const newOrder = {
            id: generateId(),
            _id: generateId(),
            orderNumber: orderNum,
            invoiceNumber: `INV-${orderNum}`,
            createdAt: new Date().toISOString(),
            status: 'Preparing',
            ...body
          };
          orders.push(newOrder);
          setStorage('demo_orders', orders);

          // Loyalty Points Logic
          if (body.customerPhone) {
            let customers = getStorage('demo_customers');
            let customerIndex = customers.findIndex(c => c.phone === body.customerPhone);
            let customer = customerIndex >= 0 ? customers[customerIndex] : null;

            if (!customer) {
              customer = {
                id: generateId(),
                _id: generateId(),
                phone: body.customerPhone,
                name: body.customerName || 'Walk-in',
                loyaltyPoints: 0
              };
              customers.push(customer);
              customerIndex = customers.length - 1;
            }

            const settings = getStorage('demo_loyalty_settings') || { pointsPerOrder: 1, thresholdPoints: 10 };
            
            if (body.rewardApplied) {
              customer.loyaltyPoints = Math.max(0, (customer.loyaltyPoints || 0) - (settings.thresholdPoints || 10));
            }
            
            customer.loyaltyPoints = (customer.loyaltyPoints || 0) + (settings.pointsPerOrder || 1);
            
            customers[customerIndex] = customer;
            setStorage('demo_customers', customers);
          }

          return mockResponse(newOrder, 201);
        }
        if (method === 'PUT') {
          const id = url.split('/').pop();
          orders = orders.map(order => order._id === id || order.id === id ? { ...order, ...body } : order);
          setStorage('demo_orders', orders);
          return mockResponse({ success: true });
        }
      }

      // ---- /api/customers ----
      if (url.includes('/api/customers')) {
        let customers = getStorage('demo_customers');
        if (method === 'GET') {
          // Check for specific customer by phone
          const parts = url.split('/');
          const possiblePhone = parts[parts.length - 1];
          if (possiblePhone && possiblePhone !== 'customers' && possiblePhone.length >= 10) {
            const customer = customers.find(c => c.phone === possiblePhone);
            if (customer) return mockResponse(customer);
            return mockResponse({ error: 'Not found' }, 404);
          }
          return mockResponse(customers);
        }
        if (method === 'POST') {
          const newCust = { id: generateId(), ...body, _id: generateId() };
          customers.push(newCust);
          setStorage('demo_customers', customers);
          return mockResponse(newCust, 201);
        }
      }

      // ---- /api/loyalty-settings ----
      if (url.includes('/api/loyalty-settings')) {
        if (method === 'GET') {
          const settings = getStorage('demo_loyalty_settings') || {
            pointsPerOrder: 1,
            thresholdPoints: 10,
            rewardType: 'discount',
            rewardValue: 50
          };
          return mockResponse(settings);
        }
        if (method === 'POST') {
          setStorage('demo_loyalty_settings', body);
          return mockResponse(body);
        }
      }

      // Return empty array for any other unmatched mock route
      return mockResponse([]);
    }

    // Fallback to real fetch for everything else
    return originalFetch(input, init);
  };
};

export const teardownMockApi = () => {
  window.fetch = originalFetch;
};
