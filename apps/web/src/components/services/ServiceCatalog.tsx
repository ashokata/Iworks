import { useState, useEffect } from 'react';
import { ServiceItem, ServiceCategory } from '@/types/enhancedTypes';
import { serviceCatalogService } from '@/services/serviceCatalogService';

/**
 * Component for displaying and managing service catalog.
 * Based on HouseCallPro's service catalog functionality.
 */
export default function ServiceCatalog() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const fetchedCategories = await serviceCatalogService.getCategories();
        setCategories(fetchedCategories);
        
        // Select the first category by default if available
        if (fetchedCategories.length > 0) {
          setSelectedCategory(fetchedCategories[0].id);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load service categories');
        console.error('Error loading service categories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Load services when selected category changes
  useEffect(() => {
    const loadServices = async () => {
      if (!selectedCategory) return;
      
      setLoading(true);
      try {
        const fetchedServices = await serviceCatalogService.getServices(selectedCategory);
        setServices(fetchedServices);
        setError(null);
      } catch (err) {
        setError('Failed to load services');
        console.error('Error loading services:', err);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [selectedCategory]);

  // Handle category selection change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  if (loading && categories.length === 0) {
    return <div className="flex justify-center p-4">Loading service catalog...</div>;
  }

  if (error && categories.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-sm text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Service Catalog
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Browse and manage your service offerings
        </p>
      </div>
      
      {/* Category navigation */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Service items */}
      <div className="divide-y divide-gray-200">
        {loading && selectedCategory ? (
          <div className="p-4 text-center text-gray-500">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No services found in this category.
          </div>
        ) : (
          services.map((service) => (
            <div key={service.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-md font-medium text-gray-900">{service.name}</h4>
                  <p className="mt-1 text-sm text-gray-500">{service.description}</p>
                  {service.estimatedDuration > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Estimated duration: {service.estimatedDuration} minutes
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-lg font-medium text-gray-900">
                    ${service.price.toFixed(2)}
                  </span>
                  {service.onlineBookingEnabled && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Online booking
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {service.materials.length > 0 && (
                <div className="mt-2">
                  <h5 className="text-sm font-medium text-gray-700">Materials:</h5>
                  <ul className="mt-1 text-sm text-gray-500 list-disc list-inside">
                    {service.materials.map((material) => (
                      <li key={material.id}>
                        {material.name} - {material.quantity} x ${material.unitCost.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <button
          type="button"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => alert('Add Service functionality will be implemented')}
        >
          Add Service
        </button>
      </div>
    </div>
  );
}
