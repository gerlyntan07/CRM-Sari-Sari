import React, { useState, useCallback, useEffect } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { toast } from "react-toastify";

const ITEM_TYPES = [
  { value: "Product", label: "Product" },
  { value: "Service", label: "Service" },
];

const EMPTY_ITEM = {
  id: null,
  item_type: "Product",
  name: "",
  description: "",
  sku: "",
  variant: "",
  unit: "pcs",
  quantity: 1,
  unit_price: 0,
  discount_percent: 0,
  discount_amount: 0,
  line_total: 0,
  sort_order: 0,
};

// Calculate line total for an item
const calculateLineTotal = (item) => {
  const quantity = parseFloat(item.quantity) || 0;
  const unitPrice = parseFloat(item.unit_price) || 0;
  const discountPercent = parseFloat(item.discount_percent) || 0;
  
  const subtotal = quantity * unitPrice;
  const discountAmount = subtotal * (discountPercent / 100);
  const lineTotal = subtotal - discountAmount;
  
  return {
    discount_amount: discountAmount,
    line_total: lineTotal,
  };
};

// Format currency
const formatCurrency = (amount, symbol = "₱") => {
  const num = parseFloat(amount) || 0;
  return `${symbol}${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function QuoteItemsEditor({
  items = [],
  onChange,
  currencySymbol = "₱",
  readOnly = false,
  taxRate = 0,
  discountType = null,
  discountValue = 0,
  onTotalsChange,
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ ...EMPTY_ITEM });

  // Calculate totals whenever items change
  useEffect(() => {
    if (onTotalsChange) {
      const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.line_total) || 0), 0);
      
      let discountAmount = 0;
      if (discountType === "percentage" && discountValue) {
        discountAmount = subtotal * (parseFloat(discountValue) / 100);
      } else if (discountType === "fixed" && discountValue) {
        discountAmount = parseFloat(discountValue);
      }
      
      const subtotalAfterDiscount = subtotal - discountAmount;
      const taxAmount = subtotalAfterDiscount * (parseFloat(taxRate) / 100);
      const totalAmount = subtotalAfterDiscount + taxAmount;
      
      onTotalsChange({
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
      });
    }
  }, [items, taxRate, discountType, discountValue, onTotalsChange]);

  // Handle adding new item
  const handleAddItem = useCallback(() => {
    if (!newItem.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (parseFloat(newItem.unit_price) <= 0) {
      toast.error("Unit price must be greater than 0");
      return;
    }
    if (parseFloat(newItem.quantity) <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const calculated = calculateLineTotal(newItem);
    const itemToAdd = {
      ...newItem,
      ...calculated,
      sort_order: items.length,
    };

    onChange([...items, itemToAdd]);
    setNewItem({ ...EMPTY_ITEM });
    setShowAddForm(false);
    toast.success("Item added");
  }, [newItem, items, onChange]);

  // Handle updating an item
  const handleUpdateItem = (index) => {
    if (!editItem) {
      toast.error("No item being edited");
      return;
    }
    if (!editItem.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (parseFloat(editItem.unit_price) <= 0) {
      toast.error("Unit price must be greater than 0");
      return;
    }
    if (parseFloat(editItem.quantity) <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const calculated = calculateLineTotal(editItem);
    const updatedItem = { ...editItem, ...calculated };
    
    // Use .map() to create a new array with the updated item at the correct index
    const updatedItems = items.map((item, i) => 
      i === index ? updatedItem : item
    );
    
    onChange(updatedItems);
    setEditingIndex(null);
    setEditItem(null);
    toast.success("Item updated");
  };

  // Handle deleting an item
  const handleDeleteItem = useCallback((index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    // Re-order sort_order
    updatedItems.forEach((item, i) => {
      item.sort_order = i;
    });
    onChange(updatedItems);
    toast.success("Item removed");
  }, [items, onChange]);

  // Handle moving item up/down
  const handleMoveItem = useCallback((index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    
    const updatedItems = [...items];
    [updatedItems[index], updatedItems[newIndex]] = [updatedItems[newIndex], updatedItems[index]];
    
    // Update sort_order
    updatedItems.forEach((item, i) => {
      item.sort_order = i;
    });
    
    onChange(updatedItems);
  }, [items, onChange]);

  // Start editing an item
  const startEditing = (index) => {
    setEditingIndex(index);
    setEditItem({ ...items[index] });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingIndex(null);
    setEditItem(null);
  };

  // Calculate summary
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.line_total) || 0), 0);

  // Render item row (inline to avoid re-mounting issues)
  const renderItemRow = (item, index) => {
    const isEditing = editingIndex === index;
    
    if (isEditing && !readOnly) {
      return (
        <tr key={item.id || `edit-${index}`} className="bg-blue-50">
          <td className="px-3 py-2">
            <select
              value={editItem.item_type}
              onChange={(e) => setEditItem(prev => ({ ...prev, item_type: e.target.value }))}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              {ITEM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </td>
          <td className="px-3 py-2">
            <input
              type="text"
              value={editItem.name}
              onChange={(e) => setEditItem(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="Name *"
            />
            <input
              type="text"
              value={editItem.variant || ""}
              onChange={(e) => setEditItem(prev => ({ ...prev, variant: e.target.value }))}
              className="w-full px-2 py-1 border rounded text-sm mt-1"
              placeholder="Variant (optional)"
            />
          </td>
          <td className="px-3 py-2">
            <input
              type="text"
              value={editItem.sku || ""}
              onChange={(e) => setEditItem(prev => ({ ...prev, sku: e.target.value }))}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="SKU"
            />
          </td>
          <td className="px-3 py-2">
            <div className="flex gap-1">
              <input
                type="number"
                value={editItem.quantity}
                onChange={(e) => setEditItem(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-16 px-2 py-1 border rounded text-sm text-right"
                min="0.01"
                step="0.01"
              />
              <input
                type="text"
                value={editItem.unit || ""}
                onChange={(e) => setEditItem(prev => ({ ...prev, unit: e.target.value }))}
                className="w-16 px-2 py-1 border rounded text-sm"
                placeholder="Unit"
              />
            </div>
          </td>
          <td className="px-3 py-2">
            <input
              type="number"
              value={editItem.unit_price}
              onChange={(e) => setEditItem(prev => ({ ...prev, unit_price: e.target.value }))}
              className="w-24 px-2 py-1 border rounded text-sm text-right"
              min="0"
              step="0.01"
            />
          </td>
          <td className="px-3 py-2">
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editItem.discount_percent || 0}
                onChange={(e) => setEditItem(prev => ({ ...prev, discount_percent: e.target.value }))}
                className="w-16 px-2 py-1 border rounded text-sm text-right"
                min="0"
                max="100"
                step="0.01"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </td>
          <td className="px-3 py-2 text-right font-medium">
            {formatCurrency(calculateLineTotal(editItem).line_total, currencySymbol)}
          </td>
          <td className="px-3 py-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleUpdateItem(index)}
                className="p-1 text-green-600 hover:bg-green-100 rounded"
                title="Save"
              >
                <FiCheck size={16} />
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                title="Cancel"
              >
                <FiX size={16} />
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={item.id || `row-${index}`} className="border-b hover:bg-gray-50">
        <td className="px-3 py-2">
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
            item.item_type === "Service" 
              ? "bg-purple-100 text-purple-700" 
              : "bg-blue-100 text-blue-700"
          }`}>
            {item.item_type}
          </span>
        </td>
        <td className="px-3 py-2">
          <div className="font-medium text-gray-900">{item.name}</div>
          {item.variant && (
            <div className="text-xs text-gray-500">{item.variant}</div>
          )}
          {item.description && (
            <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
          )}
        </td>
        <td className="px-3 py-2 text-gray-600 text-sm">{item.sku || "-"}</td>
        <td className="px-3 py-2 text-center">
          <span className="font-medium">{parseFloat(item.quantity).toLocaleString()}</span>
          {item.unit && <span className="text-gray-500 text-sm ml-1">{item.unit}</span>}
        </td>
        <td className="px-3 py-2 text-right">
          {formatCurrency(item.unit_price, currencySymbol)}
        </td>
        <td className="px-3 py-2 text-right text-sm">
          {parseFloat(item.discount_percent) > 0 ? (
            <span className="text-red-600">-{parseFloat(item.discount_percent).toFixed(1)}%</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
        <td className="px-3 py-2 text-right font-medium">
          {formatCurrency(item.line_total, currencySymbol)}
        </td>
        {!readOnly && (
          <td className="px-3 py-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleMoveItem(index, "up")}
                disabled={index === 0}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                title="Move up"
              >
                <FiChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleMoveItem(index, "down")}
                disabled={index === items.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                title="Move down"
              >
                <FiChevronDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => startEditing(index)}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                title="Edit"
              >
                <FiEdit2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteItem(index)}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="Delete"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </td>
        )}
      </tr>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <h3 className="font-semibold text-gray-800">
          Line Items {items.length > 0 && <span className="text-gray-500 font-normal">({items.length})</span>}
        </h3>
        {!readOnly && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
          >
            <FiPlus size={14} />
            Add Item
          </button>
        )}
      </div>

      {/* Add Item Form */}
      {showAddForm && !readOnly && (
        <div className="p-4 bg-blue-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={newItem.item_type}
                onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {ITEM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Product/Service name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
              <input
                type="text"
                value={newItem.sku}
                onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Item code"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Variant</label>
              <input
                type="text"
                value={newItem.variant}
                onChange={(e) => setNewItem({ ...newItem, variant: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Size, color, etc."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-20 px-3 py-2 border rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0.01"
                  step="0.01"
                />
                <input
                  type="text"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-20 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Unit"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{currencySymbol}</span>
                <input
                  type="number"
                  value={newItem.unit_price}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
              <input
                type="number"
                value={newItem.discount_percent}
                onChange={(e) => setNewItem({ ...newItem, discount_percent: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Line Total</label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-right font-medium">
                {formatCurrency(calculateLineTotal(newItem).line_total, currencySymbol)}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Additional details about this item..."
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewItem({ ...EMPTY_ITEM });
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Add Item
            </button>
          </div>
        </div>
      )}

      {/* Items Table */}
      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">Type</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Item</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">SKU</th>
                <th className="px-3 py-2 text-center font-medium text-gray-600 w-28">Qty</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 w-28">Price</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 w-20">Disc.</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 w-28">Total</th>
                {!readOnly && <th className="px-3 py-2 w-28"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => renderItemRow(item, index))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          <p>No items added yet.</p>
          {!readOnly && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-blue-600 hover:underline text-sm"
            >
              + Add your first item
            </button>
          )}
        </div>
      )}

      {/* Summary Footer */}
      {items.length > 0 && (
        <div className="border-t bg-gray-50 px-4 py-3">
          <div className="flex justify-end">
            <div className="w-64 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal, currencySymbol)}</span>
              </div>
              {parseFloat(discountValue) > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount ({discountType === "percentage" ? `${discountValue}%` : "Fixed"}):</span>
                  <span>
                    -{formatCurrency(
                      discountType === "percentage" 
                        ? subtotal * (parseFloat(discountValue) / 100)
                        : parseFloat(discountValue),
                      currencySymbol
                    )}
                  </span>
                </div>
              )}
              {parseFloat(taxRate) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({taxRate}%):</span>
                  <span>
                    {formatCurrency(
                      (subtotal - (discountType === "percentage" 
                        ? subtotal * (parseFloat(discountValue) / 100)
                        : parseFloat(discountValue) || 0)) * (parseFloat(taxRate) / 100),
                      currencySymbol
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-1 border-t">
                <span>Total:</span>
                <span>
                  {formatCurrency(
                    (() => {
                      let disc = 0;
                      if (discountType === "percentage" && discountValue) {
                        disc = subtotal * (parseFloat(discountValue) / 100);
                      } else if (discountType === "fixed" && discountValue) {
                        disc = parseFloat(discountValue);
                      }
                      const afterDisc = subtotal - disc;
                      const tax = afterDisc * (parseFloat(taxRate) / 100);
                      return afterDisc + tax;
                    })(),
                    currencySymbol
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
