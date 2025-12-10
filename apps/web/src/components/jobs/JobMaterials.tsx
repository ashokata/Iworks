import { useState, useEffect } from 'react';
import { Material } from '@/types/enhancedTypes';
import { materialService } from '@/services/materialService';

interface JobMaterialsProps {
  jobId: string;
  readOnly?: boolean;
}

/**
 * Component for displaying and managing materials used in a job.
 * Based on HouseCallPro's material tracking functionality.
 */
export default function JobMaterials({ jobId, readOnly = false }: JobMaterialsProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMaterialId, setNewMaterialId] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);

  // Load job materials and available materials for selection
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load job materials
        const jobMaterials = await materialService.getJobMaterials(jobId);
        setMaterials(jobMaterials);
        
        // Load available materials for adding
        const allMaterials = await materialService.getAllMaterials();
        setAvailableMaterials(allMaterials);
        
        setError(null);
      } catch (err) {
        setError('Failed to load materials');
        console.error('Error loading materials:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [jobId]);

  // Calculate total cost
  const totalCost = materials.reduce((sum, material) => sum + material.totalCost, 0);
  
  // Filter available materials to exclude those already added to the job
  const filteredAvailableMaterials = availableMaterials.filter(
    material => !materials.some(m => m.id === material.id)
  );

  // Handle adding a new material to the job
  const handleAddMaterial = async () => {
    if (!newMaterialId || newQuantity <= 0) return;
    
    try {
      const result = await materialService.addMaterialToJob(jobId, newMaterialId, newQuantity);
      if (result) {
        // Find the material info from available materials
        const materialInfo = availableMaterials.find(m => m.id === newMaterialId);
        if (materialInfo) {
          // Add the new material to the list
          setMaterials([
            ...materials, 
            { 
              ...materialInfo,
              quantity: newQuantity,
              totalCost: newQuantity * materialInfo.unitCost
            }
          ]);
        }
        
        // Reset form
        setNewMaterialId('');
        setNewQuantity(1);
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Error adding material:', err);
      setError('Failed to add material');
    }
  };

  // Handle updating material quantity
  const handleQuantityChange = async (materialId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    try {
      const result = await materialService.updateJobMaterial(jobId, materialId, newQuantity);
      if (result) {
        setMaterials(materials.map(material => {
          if (material.id === materialId) {
            return {
              ...material,
              quantity: newQuantity,
              totalCost: newQuantity * material.unitCost
            };
          }
          return material;
        }));
      }
    } catch (err) {
      console.error('Error updating material quantity:', err);
      setError('Failed to update quantity');
    }
  };

  // Handle removing a material
  const handleRemoveMaterial = async (materialId: string) => {
    try {
      const result = await materialService.removeJobMaterial(jobId, materialId);
      if (result) {
        setMaterials(materials.filter(material => material.id !== materialId));
      }
    } catch (err) {
      console.error('Error removing material:', err);
      setError('Failed to remove material');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading materials...</div>;
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Materials</h3>
        {!readOnly && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            {showAddForm ? 'Cancel' : 'Add Material'}
          </button>
        )}
      </div>
      
      {/* Add material form */}
      {showAddForm && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-1">
                Material
              </label>
              <select
                id="material"
                value={newMaterialId}
                onChange={(e) => setNewMaterialId(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">Select a material</option>
                {filteredAvailableMaterials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name} - ${material.unitCost.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div className="col-span-3 flex justify-end">
              <button
                onClick={handleAddMaterial}
                disabled={!newMaterialId || newQuantity <= 0}
                className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Material
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Materials list */}
      {materials.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No materials have been added to this job.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                {!readOnly && (
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.map((material) => (
                <tr key={material.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {material.name}
                    {material.taxable && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Taxable
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    ${material.unitCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {readOnly ? (
                      material.quantity
                    ) : (
                      <input
                        type="number"
                        min="1"
                        value={material.quantity}
                        onChange={(e) => handleQuantityChange(material.id, parseInt(e.target.value) || 1)}
                        className="w-16 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    ${material.totalCost.toFixed(2)}
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <button
                        onClick={() => handleRemoveMaterial(material.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              
              {/* Total row */}
              <tr className="bg-gray-50">
                <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                  Total:
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${totalCost.toFixed(2)}
                </td>
                {!readOnly && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
